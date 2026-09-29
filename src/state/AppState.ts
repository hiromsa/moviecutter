/**
 * アプリケーションのグローバル状態管理 (Pub/Sub イベント駆動)
 * UI とロジックを疎結合に保つための中心的な状態ストア
 */

export type FFmpegStatus = 'unloaded' | 'loading' | 'ready' | 'processing' | 'error';

export interface ThumbnailItem {
  time: number;
  dataUrl: string;
}

export interface AppStateData {
  videoFile: File | null;
  videoUrl: string | null;
  videoName: string;
  duration: number;
  currentTime: number;
  startTime: number;
  endTime: number;
  isPlaying: boolean;
  isLoopingRange: boolean;
  playbackRate: number;
  volume: number;
  isMuted: boolean;
  videoWidth: number;
  videoHeight: number;
  fps: number;
  timelineZoom: number;
  ffmpegStatus: FFmpegStatus;
  ffmpegProgress: number;
  statusMessage: string;
  thumbnails: ThumbnailItem[];
}

export type StateChangeListener = (state: AppStateData, changedKey?: keyof AppStateData) => void;

export class AppState {
  private static instance: AppState;

  private state: AppStateData = {
    videoFile: null,
    videoUrl: null,
    videoName: '',
    duration: 0,
    currentTime: 0,
    startTime: 0,
    endTime: 0,
    isPlaying: false,
    isLoopingRange: false,
    playbackRate: 1.0,
    volume: 1.0,
    isMuted: false,
    videoWidth: 0,
    videoHeight: 0,
    fps: 30,
    timelineZoom: 1.0,
    ffmpegStatus: 'unloaded',
    ffmpegProgress: 0,
    statusMessage: '動画ファイルを選択またはドラッグ＆ドロップしてください',
    thumbnails: [],
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
    this.state.videoFile = file;
    this.state.videoUrl = url;
    this.state.videoName = file.name;
    this.state.duration = duration;
    this.state.currentTime = 0;
    this.state.startTime = 0;
    // デフォルトの終了時間は動画全体、もしくは初期クリップとして短めに設定可能
    this.state.endTime = duration;
    this.state.videoWidth = width;
    this.state.videoHeight = height;
    this.state.isPlaying = false;
    this.state.thumbnails = [];
    this.state.statusMessage = `「${file.name}」を読み込みました (${duration.toFixed(2)}s)`;
    this.notify('videoFile');
  }

  public setCurrentTime(time: number): void {
    const clamped = Math.max(0, Math.min(this.state.duration, time));
    if (Math.abs(this.state.currentTime - clamped) < 0.001) return;
    this.state.currentTime = clamped;

    // 範囲ループ再生がONの場合のハンドリング
    if (this.state.isLoopingRange && this.state.isPlaying) {
      if (clamped >= this.state.endTime) {
        this.state.currentTime = this.state.startTime;
        this.notify('currentTime');
        return;
      }
    }

    this.notify('currentTime');
  }

  public setStartTime(time: number): void {
    const clamped = Math.max(0, Math.min(this.state.endTime - 0.05, time));
    this.state.startTime = clamped;
    this.notify('startTime');
  }

  public setEndTime(time: number): void {
    const clamped = Math.min(this.state.duration, Math.max(this.state.startTime + 0.05, time));
    this.state.endTime = clamped;
    this.notify('endTime');
  }

  public setRange(start: number, end: number): void {
    const s = Math.max(0, Math.min(start, this.state.duration));
    const e = Math.max(s + 0.05, Math.min(end, this.state.duration));
    this.state.startTime = s;
    this.state.endTime = e;
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

  public setVolume(volume: number, isMuted: boolean): void {
    this.state.volume = volume;
    this.state.isMuted = isMuted;
    this.notify('volume');
  }

  public setTimelineZoom(zoom: number): void {
    const clamped = Math.max(1.0, Math.min(10.0, zoom));
    if (Math.abs(this.state.timelineZoom - clamped) < 0.01) return;
    this.state.timelineZoom = clamped;
    this.notify('timelineZoom');
  }

  public jumpToStart(): void {
    this.setCurrentTime(this.state.startTime);
  }

  public jumpToEnd(): void {
    this.setCurrentTime(this.state.endTime);
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
    this.notify('thumbnails');
  }

  public setStatusMessage(msg: string): void {
    this.state.statusMessage = msg;
    this.notify('statusMessage');
  }
}
