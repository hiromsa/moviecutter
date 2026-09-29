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
}
