/**
 * FFmpeg.wasm をラップするサービスクラス
 * ブラウザローカルで安全かつ高速に動画の切り取りを実行する
 */

// @ffmpeg/ffmpeg の型定義用インターフェース
interface FFmpegInstance {
  load: () => Promise<void>;
  isLoaded: () => boolean;
  setProgress: (callback: (p: { ratio: number }) => void) => void;
  setLogger: (callback: (log: { type: string; message: string }) => void) => void;
  FS: (method: string, ...args: any[]) => any;
  run: (...args: string[]) => Promise<any>;
}

export class FFmpegEngine {
  private static instance: FFmpegEngine;
  private ffmpeg: FFmpegInstance | null = null;
  private isLoaded = false;
  private isLoading = false;

  private constructor() {}

  public static getInstance(): FFmpegEngine {
    if (!FFmpegEngine.instance) {
      FFmpegEngine.instance = new FFmpegEngine();
    }
    return FFmpegEngine.instance;
  }

  /**
   * FFmpeg.wasm の初期化
   */
  public async load(onProgress?: (ratio: number) => void): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading) {
      // 読み込み中なら完了まで待機
      while (this.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoading = true;
    try {
      // @ts-ignore - グローバルまたは動的インポート
      const FFmpegModule = (window as any).FFmpeg || await import('@ffmpeg/ffmpeg');
      const createFFmpeg = FFmpegModule.createFFmpeg;

      this.ffmpeg = createFFmpeg({
        log: true,
        corePath: 'https://unpkg.com/@ffmpeg/core@0.11.0/dist/ffmpeg-core.js',
      }) as FFmpegInstance;

      if (onProgress && this.ffmpeg.setProgress) {
        this.ffmpeg.setProgress(({ ratio }) => {
          onProgress(Math.min(100, Math.max(0, ratio * 100)));
        });
      }

      await this.ffmpeg.load();
      this.isLoaded = true;
    } catch (error) {
      console.error('FFmpeg load failed:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  public getIsLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * 動画の切り取り処理
   * @param file 入力動画ファイル
   * @param startTime 切り取り開始秒
   * @param endTime 切り取り終了秒
   * @param onProgress 進捗コールバック (0-100)
   */
  public async cutVideo(
    file: File,
    startTime: number,
    endTime: number,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.isLoaded || !this.ffmpeg) {
      await this.load(onProgress);
    }
    if (!this.ffmpeg) throw new Error('FFmpeg is not initialized');

    if (onProgress) {
      this.ffmpeg.setProgress(({ ratio }) => {
        onProgress(Math.min(100, Math.max(0, ratio * 100)));
      });
    }

    const ext = file.name.split('.').pop() || 'mp4';
    const inputName = `input_${Date.now()}.${ext}`;
    const outputName = `output_${Date.now()}.mp4`;

    try {
      const fileData = await file.arrayBuffer();
      this.ffmpeg.FS('writeFile', inputName, new Uint8Array(fileData));

      // ストリームコピー (-c copy) で超高速切り出し
      // -ss と -to を -i の前後に最適配置
      try {
        await this.ffmpeg.run(
          '-ss', startTime.toFixed(3),
          '-to', endTime.toFixed(3),
          '-i', inputName,
          '-c', 'copy',
          '-avoid_negative_ts', 'make_zero',
          outputName
        );
      } catch (streamCopyErr) {
        console.warn('Stream copy failed, falling back to fast re-encode:', streamCopyErr);
        // ストリームコピーに失敗した場合は高速プリセットで再エンコード
        await this.ffmpeg.run(
          '-ss', startTime.toFixed(3),
          '-to', endTime.toFixed(3),
          '-i', inputName,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-c:a', 'aac',
          outputName
        );
      }

      const outData = this.ffmpeg.FS('readFile', outputName);
      const blob = new Blob([outData.buffer], { type: 'video/mp4' });

      // 仮想ファイルシステムのクリーンアップ
      try {
        this.ffmpeg.FS('unlink', inputName);
        this.ffmpeg.FS('unlink', outputName);
      } catch (e) {
        // unlink エラーは無視
      }

      return blob;
    } catch (err) {
      console.error('Video cutting failed:', err);
      throw err;
    }
  }
}
