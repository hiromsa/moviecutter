/**
 * アプリケーションのグローバル状態管理 (Pub/Sub イベント駆動)
 * UI とロジックを疎結合に保つための中心的な状態ストア
 */

export type FFmpegStatus = 'unloaded' | 'loading' | 'ready' | 'processing' | 'error';

export interface ThumbnailItem {
  time: number;
  dataUrl: string;
}

export type MediaMode = 'video' | 'audio-still';

export interface AppStateData {
  mediaMode: MediaMode;
  videoFile: File | null;
  videoUrl: string | null;
  videoName: string;
  audioFile: File | null;
  imageFile: File | null;
  imageBlob: Blob | null;
  imageUrl: string | null;
  duration: number;
  currentTime: number;
  startTime: number;
  endTime: number;
  hasRange: boolean;
  isPlaying: boolean;
  isLoopingRange: boolean;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  videoWidth: number;
  videoHeight: number;
  fps: number;
  timelineZoom: number;
  isDurationLocked: boolean;
  ffmpegStatus: FFmpegStatus;
  ffmpegProgress: number;
  statusMessage: string;
  thumbnails: ThumbnailItem[];
  isLoadingThumbnails: boolean;
  audioPeaks: number[];
  isLoadingWaveform: boolean;
}

export type StateChangeListener = (state: AppStateData, changedKey?: keyof AppStateData) => void;

export class AppState {
  private static instance: AppState;

  private state: AppStateData = {
    mediaMode: 'video',
    videoFile: null,
    videoUrl: null,
    videoName: '',
    audioFile: null,
    imageFile: null,
    imageBlob: null,
    imageUrl: null,
    duration: 0,
    currentTime: 0,
    startTime: 0,
    endTime: 0,
    hasRange: false,
    isPlaying: false,
    isLoopingRange: false,
    playbackRate: 1.0,
    volume: 1.0,
    isMuted: false,
    videoWidth: 0,
    videoHeight: 0,
    fps: 30,
    timelineZoom: 1.0,
    isDurationLocked: false,
    ffmpegStatus: 'unloaded',
    ffmpegProgress: 0,
    statusMessage: '動画・音声・画像ファイルを選択またはドラッグ＆ドロップしてください',
    thumbnails: [],
    isLoadingThumbnails: false,
    audioPeaks: [],
    isLoadingWaveform: false,
  };

  private listeners: Set<StateChangeListener> = new Set();

  private constructor() {}

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }
    return AppState.instance;
  }

  public getState(): Readonly<AppStateData> {
    return this.state;
  }

  public subscribe(listener: StateChangeListener): () => void {
    this.listeners.add(listener);
    // 初期呼び出し
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(changedKey?: keyof AppStateData): void {
    for (const listener of this.listeners) {
      listener(this.state, changedKey);
    }
  }

  public setVideo(file: File, url: string, duration: number, width: number, height: number): void {
    if (this.state.videoUrl) {
      URL.revokeObjectURL(this.state.videoUrl);
    }
    if (this.state.imageUrl) {
      URL.revokeObjectURL(this.state.imageUrl);
    }
    this.state.mediaMode = 'video';
    this.state.videoFile = file;
    this.state.videoUrl = url;
    this.state.videoName = file.name;
    this.state.audioFile = null;
    this.state.imageFile = null;
    this.state.imageBlob = null;
    this.state.imageUrl = null;
    this.state.duration = duration;
    this.state.currentTime = 0;
    this.state.startTime = 0;
    this.state.endTime = 0;
    this.state.hasRange = false; // デフォルトは開始・終了なし（未選択）
    this.state.videoWidth = width;
    this.state.videoHeight = height;
    this.state.isPlaying = false;
    this.state.thumbnails = [];
    this.state.isLoadingThumbnails = true;
    this.state.audioPeaks = [];
    this.state.isLoadingWaveform = true;
    this.state.statusMessage = `「${file.name}」を読み込みました (${duration.toFixed(2)}s)`;
    this.notify('videoFile');
    this.notify('mediaMode');
    this.notify('hasRange');
    this.notify('isLoadingThumbnails');
    this.notify('isLoadingWaveform');
    this.notify('audioPeaks');
  }

  /**
   * 音声＋静止画モードのセットアップ
   */
  public setAudioWithStill(
    audioFile: File,
    audioUrl: string,
    duration: number,
    imageBlob: Blob,
    imageUrl: string,
    imageFile: File | null = null,
    width: number = 1280,
    height: number = 720
  ): void {
    if (this.state.videoUrl) {
      URL.revokeObjectURL(this.state.videoUrl);
    }
    if (this.state.imageUrl && this.state.imageUrl !== imageUrl) {
      URL.revokeObjectURL(this.state.imageUrl);
    }
    this.state.mediaMode = 'audio-still';
    this.state.audioFile = audioFile;
    this.state.videoFile = audioFile; // video要素での再生互換用
    this.state.videoUrl = audioUrl;
    this.state.videoName = audioFile.name;
    this.state.imageFile = imageFile;
    this.state.imageBlob = imageBlob;
    this.state.imageUrl = imageUrl;
    this.state.duration = duration;
    this.state.currentTime = 0;
    this.state.startTime = 0;
    this.state.endTime = 0;
    this.state.hasRange = false;
    this.state.videoWidth = width;
    this.state.videoHeight = height;
    this.state.isPlaying = false;
    this.state.thumbnails = [];
    this.state.isLoadingThumbnails = false;
    this.state.audioPeaks = [];
    this.state.isLoadingWaveform = true;
    this.state.statusMessage = `音声「${audioFile.name}」＋静止画を取り込みました (${duration.toFixed(2)}s)`;
    this.notify('videoFile');
    this.notify('mediaMode');
    this.notify('imageUrl');
    this.notify('hasRange');
    this.notify('isLoadingThumbnails');
    this.notify('isLoadingWaveform');
  }

  /**
   * 静止画（カバー画像）の差し替え更新
   */
  public updateStillImage(
    imageBlob: Blob,
    imageUrl: string,
    imageFile: File | null = null,
    width: number = 1280,
    height: number = 720
  ): void {
    if (this.state.imageUrl && this.state.imageUrl !== imageUrl) {
      URL.revokeObjectURL(this.state.imageUrl);
    }
    this.state.imageFile = imageFile;
    this.state.imageBlob = imageBlob;
    this.state.imageUrl = imageUrl;
    this.state.videoWidth = width;
    this.state.videoHeight = height;
    this.notify('imageUrl');
  }

  /**
   * 最初から最後まで（0秒〜duration）を全選択
   */
  public selectAllRange(): void {
    if (this.state.duration > 0) {
      this.setRange(0, this.state.duration);
    }
  }

  public setCurrentTime(time: number): void {
    const clamped = Math.max(0, Math.min(this.state.duration, time));
    if (Math.abs(this.state.currentTime - clamped) < 0.001) return;
    this.state.currentTime = clamped;

    // 範囲ループ再生がONかつ範囲が選択されている場合のハンドリング
    if (this.state.isLoopingRange && this.state.hasRange && this.state.isPlaying) {
      if (clamped >= this.state.endTime) {
        this.state.currentTime = this.state.startTime;
        this.notify('currentTime');
        return;
      }
    }

    this.notify('currentTime');
  }

  public setStartTime(time: number): void {
    if (!this.state.hasRange) {
      // 範囲未選択時は、指定位置からデフォルト3秒（または動画末尾まで）の範囲を作成
      const defaultLen = 3.0;
      const end = Math.min(this.state.duration, time + defaultLen);
      this.setRange(time, end);
      return;
    }
    const clamped = Math.max(0, Math.min(this.state.endTime - 0.05, time));
    this.state.startTime = clamped;
    this.notify('startTime');
  }

  public setEndTime(time: number): void {
    if (!this.state.hasRange) {
      // 範囲未選択時は、手前3秒から指定位置までの範囲を作成
      const defaultLen = 3.0;
      const start = Math.max(0, time - defaultLen);
      this.setRange(start, time);
      return;
    }
    const clamped = Math.min(this.state.duration, Math.max(this.state.startTime + 0.05, time));
    this.state.endTime = clamped;
    this.notify('endTime');
  }

  public setRange(start: number, end: number): void {
    const s = Math.max(0, Math.min(start, this.state.duration));
    const e = Math.max(s + 0.05, Math.min(end, this.state.duration));
    this.state.startTime = s;
    this.state.endTime = e;
    const wasWithoutRange = !this.state.hasRange;
    this.state.hasRange = true;
    if (wasWithoutRange) {
      this.notify('hasRange');
    }
    this.notify('startTime');
    this.notify('endTime');
  }

  /**
   * 選択範囲をクリア（開始・終了なしの状態に戻す）
   */
  public clearRange(): void {
    if (!this.state.hasRange) return;
    this.state.hasRange = false;
    this.state.startTime = 0;
    this.state.endTime = 0;
    this.notify('hasRange');
    this.notify('startTime');
    this.notify('endTime');
  }

  /**
   * 切り取り時間（長さ）を直接指定して終了点を更新
   */
  public setClipDuration(seconds: number): void {
    if (this.state.duration <= 0) return;
    const clampedDuration = Math.max(0.05, Math.min(this.state.duration, seconds));

    let newStart = this.state.hasRange ? this.state.startTime : this.state.currentTime;
    let newEnd = newStart + clampedDuration;

    // もし動画の終端を超える場合は開始点を手前に寄せる
    if (newEnd > this.state.duration) {
      newEnd = this.state.duration;
      newStart = Math.max(0, this.state.duration - clampedDuration);
    }

    this.state.startTime = newStart;
    this.state.endTime = newEnd;
    const wasWithoutRange = !this.state.hasRange;
    this.state.hasRange = true;
    if (wasWithoutRange) {
      this.notify('hasRange');
    }
    this.notify('startTime');
    this.notify('endTime');
  }

  /**
   * 時間ロックモードの切り替え
   */
  public toggleDurationLock(): void {
    this.state.isDurationLocked = !this.state.isDurationLocked;
    this.notify('isDurationLocked');
  }

  public setDurationLocked(locked: boolean): void {
    this.state.isDurationLocked = locked;
    this.notify('isDurationLocked');
  }

  /**
   * 長さを固定したまま範囲全体を平行移動（スライド）
   */
  public moveRange(deltaSeconds: number): void {
    if (!this.state.hasRange || this.state.duration <= 0) return;
    const len = this.state.endTime - this.state.startTime;
    let newStart = this.state.startTime + deltaSeconds;
    let newEnd = newStart + len;

    if (newStart < 0) {
      newStart = 0;
      newEnd = len;
    }
    if (newEnd > this.state.duration) {
      newEnd = this.state.duration;
      newStart = Math.max(0, this.state.duration - len);
    }

    this.state.startTime = newStart;
    this.state.endTime = newEnd;
    this.notify('startTime');
    this.notify('endTime');
  }

  public setPlaying(playing: boolean): void {
    if (this.state.isPlaying === playing) return;
    this.state.isPlaying = playing;
    this.notify('isPlaying');
  }

  public togglePlay(): void {
    this.setPlaying(!this.state.isPlaying);
  }

  public setLoopingRange(loop: boolean): void {
    this.state.isLoopingRange = loop;
    this.notify('isLoopingRange');
  }

  public setPlaybackRate(rate: number): void {
    this.state.playbackRate = rate;
    this.notify('playbackRate');
  }

  public setVolume(volume: number, isMuted?: boolean): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    if (isMuted !== undefined) {
      this.state.isMuted = isMuted;
    }
    this.notify('volume');
  }

  public toggleMute(): void {
    this.state.isMuted = !this.state.isMuted;
    this.notify('volume');
  }

  public setTimelineZoom(zoom: number): void {
    const clamped = Math.max(1.0, Math.min(10.0, zoom));
    if (Math.abs(this.state.timelineZoom - clamped) < 0.01) return;
    this.state.timelineZoom = clamped;
    this.notify('timelineZoom');
  }

  public jumpToStart(): void {
    if (this.state.hasRange) {
      this.setCurrentTime(this.state.startTime);
    } else {
      this.setCurrentTime(0);
    }
  }

  public jumpToEnd(): void {
    if (this.state.hasRange) {
      this.setCurrentTime(this.state.endTime);
    } else {
      this.setCurrentTime(this.state.duration);
    }
  }

  public stepFrame(direction: 1 | -1): void {
    const frameDuration = 1 / (this.state.fps || 30);
    this.setCurrentTime(this.state.currentTime + direction * frameDuration);
  }

  public setFFmpegStatus(status: FFmpegStatus, message?: string, progress?: number): void {
    this.state.ffmpegStatus = status;
    if (message !== undefined) this.state.statusMessage = message;
    if (progress !== undefined) this.state.ffmpegProgress = progress;
    this.notify('ffmpegStatus');
  }

  public setThumbnails(thumbnails: ThumbnailItem[]): void {
    this.state.thumbnails = thumbnails;
    this.state.isLoadingThumbnails = false;
    this.notify('thumbnails');
    this.notify('isLoadingThumbnails');
  }

  public setLoadingThumbnails(loading: boolean): void {
    this.state.isLoadingThumbnails = loading;
    this.notify('isLoadingThumbnails');
  }

  public setStatusMessage(msg: string): void {
    this.state.statusMessage = msg;
    this.notify('statusMessage');
  }

  public setAudioPeaks(peaks: number[]): void {
    this.state.audioPeaks = peaks;
    this.state.isLoadingWaveform = false;
    this.notify('audioPeaks');
    this.notify('isLoadingWaveform');
  }

  public setLoadingWaveform(loading: boolean): void {
    this.state.isLoadingWaveform = loading;
    this.notify('isLoadingWaveform');
  }

  /**
   * 編集内容をクリアしてアプリを初期状態にリセット
   */
  public reset(): void {
    if (this.state.videoUrl) {
      try {
        URL.revokeObjectURL(this.state.videoUrl);
      } catch (e) {
        console.warn('Revoke videoUrl error:', e);
      }
    }
    if (this.state.imageUrl) {
      try {
        URL.revokeObjectURL(this.state.imageUrl);
      } catch (e) {
        console.warn('Revoke imageUrl error:', e);
      }
    }

    this.state = {
      mediaMode: 'video',
      videoFile: null,
      videoUrl: null,
      videoName: '',
      audioFile: null,
      imageFile: null,
      imageBlob: null,
      imageUrl: null,
      duration: 0,
      currentTime: 0,
      startTime: 0,
      endTime: 0,
      hasRange: false,
      isPlaying: false,
      isLoopingRange: false,
      playbackRate: 1.0,
      volume: 1.0,
      isMuted: false,
      videoWidth: 0,
      videoHeight: 0,
      fps: 30,
      timelineZoom: 1.0,
      isDurationLocked: false,
      ffmpegStatus: this.state.ffmpegStatus === 'ready' ? 'ready' : this.state.ffmpegStatus,
      ffmpegProgress: 0,
      statusMessage: '編集内容をクリアしました。動画・音声・画像ファイルを選択してください。',
      thumbnails: [],
      isLoadingThumbnails: false,
      audioPeaks: [],
      isLoadingWaveform: false,
    };

    this.notify();
  }
}
