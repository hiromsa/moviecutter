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

  /**
   * 選択範囲の音声のみを抽出 (MP3 / WAV)
   * @param file 入力動画ファイル
   * @param startTime 開始秒数
   * @param endTime 終了秒数
   * @param format 出力フォーマット ('mp3' | 'wav')
   * @param onProgress 進捗コールバック
   */
  public async extractAudio(
    file: File,
    startTime: number,
    endTime: number,
    format: 'mp3' | 'wav',
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
    const inputName = `audio_in_${Date.now()}.${ext}`;
    const outputName = `audio_out_${Date.now()}.${format}`;

    try {
      const fileData = await file.arrayBuffer();
      this.ffmpeg.FS('writeFile', inputName, new Uint8Array(fileData));

      if (format === 'mp3') {
        await this.ffmpeg.run(
          '-ss', startTime.toFixed(3),
          '-to', endTime.toFixed(3),
          '-i', inputName,
          '-vn',
          '-c:a', 'libmp3lame',
          '-q:a', '2',
          outputName
        );
      } else {
        // WAV (PCM 16-bit 非圧縮)
        await this.ffmpeg.run(
          '-ss', startTime.toFixed(3),
          '-to', endTime.toFixed(3),
          '-i', inputName,
          '-vn',
          '-c:a', 'pcm_s16le',
          outputName
        );
      }

      const outData = this.ffmpeg.FS('readFile', outputName);
      const mimeType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav';
      const blob = new Blob([outData.buffer], { type: mimeType });

      // クリーンアップ
      try {
        this.ffmpeg.FS('unlink', inputName);
        this.ffmpeg.FS('unlink', outputName);
      } catch (e) {
        // unlink エラーは無視
      }

      return blob;
    } catch (err) {
      console.error(`Audio extraction (${format}) failed:`, err);
      throw err;
    }
  }

  /**
   * 静止画と音声を合成してMP4動画を生成（Twitter/X投稿用静止画動画）
   * @param imageBlob カバー画像Blob
   * @param audioFile 入力音声ファイル
   * @param startTime 開始秒数
   * @param endTime 終了秒数
   * @param onProgress 進捗コールバック (0-100)
   */
  public async createVideoFromImageAndAudio(
    imageBlob: Blob,
    audioFile: File,
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

    const imgName = `cover_${Date.now()}.png`;
    const audioExt = audioFile.name.split('.').pop() || 'mp3';
    const audioName = `audio_${Date.now()}.${audioExt}`;
    const outputName = `still_video_${Date.now()}.mp4`;

    try {
      const imgData = await imageBlob.arrayBuffer();
      const audioData = await audioFile.arrayBuffer();
      this.ffmpeg.FS('writeFile', imgName, new Uint8Array(imgData));
      this.ffmpeg.FS('writeFile', audioName, new Uint8Array(audioData));

      const duration = Math.max(0.1, endTime - startTime);

      // 静止画ループ + 音声切り出し + H.264 / AAC + YUV420P (Twitter/X 完全互換)
      await this.ffmpeg.run(
        '-loop', '1',
        '-i', imgName,
        '-ss', startTime.toFixed(3),
        '-t', duration.toFixed(3),
        '-i', audioName,
        '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-preset', 'ultrafast',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        outputName
      );

      const outData = this.ffmpeg.FS('readFile', outputName);
      const blob = new Blob([outData.buffer], { type: 'video/mp4' });

      try {
        this.ffmpeg.FS('unlink', imgName);
        this.ffmpeg.FS('unlink', audioName);
        this.ffmpeg.FS('unlink', outputName);
      } catch (e) {}

      return blob;
    } catch (err) {
      console.error('Image + Audio video creation failed:', err);
      throw err;
    }
  }
}
