/**
 * ブラウザ標準の HTML5 Video & Canvas を使った軽量・高速な動画処理
 */

import { ThumbnailItem } from '../state/AppState';

export class VideoEngine {
  /**
   * 動画ファイルからメタデータ (duration, width, height) を取得
   */
  public static async loadMetadata(file: File): Promise<{
    url: string;
    duration: number;
    width: number;
    height: number;
  }> {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    return new Promise((resolve, reject) => {
      video.onloadedmetadata = () => {
        resolve({
          url,
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
        });
      };
      video.onerror = (e) => {
        URL.revokeObjectURL(url);
        reject(new Error('動画の読み込みに失敗しました: ' + e));
      };
    });
  }

  /**
   * 動画の現在位置フレームをPNG画像としてキャプチャ
   */
  public static captureFrame(video: HTMLVideoElement): { dataUrl: string; blob: Promise<Blob | null> } {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
    const dataUrl = canvas.toDataURL('image/png');
    const blobPromise = new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png');
    });
    return { dataUrl, blob: blobPromise };
  }

  /**
   * 指定したタイムスタンプのフレームをキャプチャする（非同期）
   */
  public static async captureFrameAtTime(videoUrl: string, time: number): Promise<Blob | null> {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(Math.max(0, time), video.duration);
      };
      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png');
      };
      video.onerror = () => resolve(null);
    });
  }

  /**
   * 指定したタイムスタンプのフレームを軽量なDataURL（画像）として取得
   */
  public static async captureDataUrlAtTime(
    videoUrl: string,
    time: number,
    targetWidth: number = 320
  ): Promise<string | null> {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;

    return new Promise((resolve) => {
      video.onloadedmetadata = () => {
        video.currentTime = Math.min(Math.max(0, time), video.duration);
      };
      video.onseeked = () => {
        const aspect = (video.videoHeight || 9) / (video.videoWidth || 16);
        const targetHeight = Math.round(targetWidth * aspect);

        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      video.onerror = () => resolve(null);
    });
  }

  /**
   * タイムライン用のサムネイルストリップを高速生成
   */
  public static async generateThumbnails(
    videoUrl: string,
    duration: number,
    count: number = 12
  ): Promise<ThumbnailItem[]> {
    if (duration <= 0) return [];

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.muted = true;

    await new Promise((resolve) => {
      video.onloadedmetadata = () => resolve(true);
      video.onerror = () => resolve(false);
    });

    const thumbnails: ThumbnailItem[] = [];
    const step = duration / Math.max(1, count);
    const canvas = document.createElement('canvas');
    // サムネイルは軽量に
    canvas.width = 160;
    canvas.height = Math.round(160 * (video.videoHeight / (video.videoWidth || 160))) || 90;
    const ctx = canvas.getContext('2d');

    for (let i = 0; i < count; i++) {
      const time = Math.min(i * step + step * 0.5, duration - 0.05);
      video.currentTime = time;

      await new Promise((resolve) => {
        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            thumbnails.push({
              time,
              dataUrl: canvas.toDataURL('image/jpeg', 0.6),
            });
          }
          resolve(true);
        };
        // タイムアウト保護
        setTimeout(resolve, 300);
      });
    }

    return thumbnails;
  }

  /**
   * 秒数を "00:00.00" 形式にフォーマット
   */
  public static formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '00:00.00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');
    const msStr = ms.toString().padStart(2, '0');
    return `${mStr}:${sStr}.${msStr}`;
  }

  /**
   * ファイルサイズを人間が読みやすい形式に変換
   */
  public static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * 音声ファイル専用の高品質デフォルトアートワーク画像をCanvasで自動生成
   */
  public static async createDefaultArtwork(
    title: string,
    durationStr: string,
    width = 1280,
    height = 720
  ): Promise<{ blob: Blob; dataUrl: string }> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');

    // 1. バックグラウンドグラデーション
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#040711');
    bgGrad.addColorStop(0.5, '#091322');
    bgGrad.addColorStop(1, '#050a16');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. ネオングロー円（アンビエントライト）
    const radialCyan = ctx.createRadialGradient(width * 0.3, height * 0.45, 50, width * 0.3, height * 0.45, 450);
    radialCyan.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
    radialCyan.addColorStop(1, 'rgba(6, 182, 212, 0)');
    ctx.fillStyle = radialCyan;
    ctx.fillRect(0, 0, width, height);

    const radialPurple = ctx.createRadialGradient(width * 0.7, height * 0.55, 50, width * 0.7, height * 0.55, 450);
    radialPurple.addColorStop(0, 'rgba(147, 51, 234, 0.2)');
    radialPurple.addColorStop(1, 'rgba(147, 51, 234, 0)');
    ctx.fillStyle = radialPurple;
    ctx.fillRect(0, 0, width, height);

    // 3. 中央のジャケットカード枠
    const cardW = 420;
    const cardH = 420;
    const cardX = (width - cardW) / 2;
    const cardY = 110;

    // カードの影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 15;

    // カード本体
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
    cardGrad.addColorStop(1, 'rgba(30, 41, 59, 0.75)');
    ctx.fillStyle = cardGrad;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();

    // カード枠線
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 4. アートワーク中央のオーディオ波形グラフィック
    const centerX = cardX + cardW / 2;
    const centerY = cardY + cardH / 2;
    const barCount = 28;
    const barWidth = 6;
    const barGap = 6;
    const totalW = barCount * (barWidth + barGap);
    const startX = centerX - totalW / 2;

    for (let i = 0; i < barCount; i++) {
      const x = startX + i * (barWidth + barGap);
      // サイン波状のバー
      const factor = Math.sin((i / barCount) * Math.PI);
      const barH = 20 + factor * 110;
      const y = centerY - barH / 2;

      const barGrad = ctx.createLinearGradient(0, y, 0, y + barH);
      barGrad.addColorStop(0, '#06b6d4');
      barGrad.addColorStop(0.5, '#3b82f6');
      barGrad.addColorStop(1, '#a855f7');
      ctx.fillStyle = barGrad;

      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, 3);
      ctx.fill();
    }

    // 5. テキスト情報（タイトル・ロゴ）
    ctx.textAlign = 'center';

    // ブランドバッジ
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText('MovieCutter Audio Studio', width / 2, cardY + cardH + 50);

    // 曲名・ファイル名
    ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#ffffff';
    const displayTitle = title.length > 35 ? title.substring(0, 32) + '...' : title;
    ctx.fillText(displayTitle, width / 2, cardY + cardH + 95);

    // 時間コード
    ctx.font = '500 20px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.fillText(`Audio Track  •  ${durationStr}`, width / 2, cardY + cardH + 130);

    const dataUrl = canvas.toDataURL('image/png');
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
    });

    return { blob, dataUrl };
  }

  /**
   * ユーザー指定の画像ファイルを読み込み、偶数サイズ（YUV420P準拠）に調整したBlobとDataUrlを返却
   */
  public static async loadImage(file: File): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
    const objectUrl = URL.createObjectURL(file);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // H.264 YUV420P エンコードの制約で幅と高さは偶数である必要がある
        const width = img.naturalWidth - (img.naturalWidth % 2);
        const height = img.naturalHeight - (img.naturalHeight % 2);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        URL.revokeObjectURL(objectUrl);

        const dataUrl = canvas.toDataURL('image/png');
        canvas.toBlob((b) => {
          if (b) {
            resolve({ blob: b, dataUrl, width, height });
          } else {
            reject(new Error('画像のBlob変換に失敗しました'));
          }
        }, 'image/png');
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('画像の読み込みに失敗しました'));
      };
      img.src = objectUrl;
    });
  }

  /**
   * 静止画モード用に同一画像のサムネイルリストを生成
   */
  public static generateStaticThumbnails(dataUrl: string, duration: number, count = 12): ThumbnailItem[] {
    const items: ThumbnailItem[] = [];
    const step = duration > 0 ? duration / count : 1;
    for (let i = 0; i < count; i++) {
      items.push({
        time: i * step,
        dataUrl,
      });
    }
    return items;
  }
}
