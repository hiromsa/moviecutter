import { AppState, AppStateData } from '../state/AppState';
import { VideoEngine } from '../core/VideoEngine';
import { AudioEngine } from '../core/AudioEngine';
import { Icons } from './icons';

export class VideoPlayer {
  private container: HTMLElement;
  private videoEl: HTMLVideoElement;
  private dropzoneEl: HTMLElement;
  private hudTimeEl: HTMLElement;
  private hudInfoEl: HTMLElement;
  private appState: AppState;
  private isUserSeeking = false;
  private onSelectFile: () => void;

  constructor(options: { onSelectFile: () => void }) {
    this.appState = AppState.getInstance();
    this.onSelectFile = options.onSelectFile;

    this.container = document.createElement('div');
    this.container.className = 'player-container';

    this.videoEl = document.createElement('video');
    this.videoEl.className = 'player-video';
    this.videoEl.playsInline = true;

    this.dropzoneEl = document.createElement('div');
    this.dropzoneEl.className = 'dropzone-overlay';

    this.hudTimeEl = document.createElement('div');
    this.hudTimeEl.className = 'hud-badge time';
    this.hudTimeEl.textContent = '00:00.00 / 00:00.00';

    this.hudInfoEl = document.createElement('div');
    this.hudInfoEl.className = 'hud-badge info';
    this.hudInfoEl.textContent = '未選択';

    this.init();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  public getVideoElement(): HTMLVideoElement {
    return this.videoEl;
  }

  private init(): void {
    this.dropzoneEl.innerHTML = `
      <div class="dropzone-icon-box">
        ${Icons.uploadCloud}
      </div>
      <div class="dropzone-text-main">動画ファイルをここにドラッグ＆ドロップ</div>
      <div class="dropzone-text-sub">クリックしてファイルを選択 (MP4, WebM, MOV, AVI...)</div>
    `;

    const hudOverlay = document.createElement('div');
    hudOverlay.className = 'player-hud-overlay';
    hudOverlay.appendChild(this.hudTimeEl);
    hudOverlay.appendChild(this.hudInfoEl);

    this.container.appendChild(this.videoEl);
    this.container.appendChild(this.dropzoneEl);
    this.container.appendChild(hudOverlay);

    this.setupEvents();
    this.appState.subscribe((state, key) => this.onStateChange(state, key));
  }

  private setupEvents(): void {
    // ドロップゾーンクリック
    this.dropzoneEl.addEventListener('click', () => this.onSelectFile());

    // ドラッグ＆ドロップハンドリング
    this.container.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzoneEl.classList.add('drag-over');
    });

    this.container.addEventListener('dragleave', (e) => {
      e.preventDefault();
      this.dropzoneEl.classList.remove('drag-over');
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzoneEl.classList.remove('drag-over');
      if (e.dataTransfer && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith('video/')) {
          this.loadVideoFile(file);
        } else {
          alert('動画ファイルを選択してください。');
        }
      }
    });

    // ビデオクリックで再生/一時停止
    this.videoEl.addEventListener('click', () => {
      this.appState.togglePlay();
    });

    // ビデオの再生位置更新
    this.videoEl.addEventListener('timeupdate', () => {
      if (!this.isUserSeeking) {
        this.appState.setCurrentTime(this.videoEl.currentTime);
      }
    });

    this.videoEl.addEventListener('play', () => {
      this.appState.setPlaying(true);
    });

    this.videoEl.addEventListener('pause', () => {
      this.appState.setPlaying(false);
    });

    this.videoEl.addEventListener('ended', () => {
      const state = this.appState.getState();
      if (state.isLoopingRange) {
        this.videoEl.currentTime = state.startTime;
        this.videoEl.play();
      } else {
        this.appState.setPlaying(false);
      }
    });
  }

  public async loadVideoFile(file: File): Promise<void> {
    try {
      this.appState.setStatusMessage('動画を読み込み中...');
      const { url, duration, width, height } = await VideoEngine.loadMetadata(file);
      this.appState.setVideo(file, url, duration, width, height);

      // サムネイル生成をバックグラウンドで開始
      VideoEngine.generateThumbnails(url, duration, 14).then((thumbnails) => {
        this.appState.setThumbnails(thumbnails);
      });

      // 音声波形抽出をバックグラウンドで開始
      AudioEngine.extractPeaks(file).then((peaks) => {
        this.appState.setAudioPeaks(peaks);
      });
    } catch (err: any) {
      console.error(err);
      alert('動画の読み込みに失敗しました: ' + err.message);
    }
  }

  private onStateChange(state: AppStateData, changedKey?: keyof AppStateData): void {
    if (changedKey === 'videoFile' || !changedKey) {
      if (state.videoUrl) {
        this.dropzoneEl.style.display = 'none';
        this.videoEl.src = state.videoUrl;
        this.hudInfoEl.textContent = `${state.videoWidth}x${state.videoHeight} (${VideoEngine.formatFileSize(state.videoFile?.size || 0)})`;
      } else {
        this.dropzoneEl.style.display = 'flex';
        this.hudInfoEl.textContent = '未選択';
      }
    }

    if (changedKey === 'currentTime' || changedKey === 'duration' || !changedKey) {
      const currentFormatted = VideoEngine.formatTime(state.currentTime);
      const totalFormatted = VideoEngine.formatTime(state.duration);
      this.hudTimeEl.textContent = `${currentFormatted} / ${totalFormatted}`;

      // video要素のシーク位置と同期
      if (Math.abs(this.videoEl.currentTime - state.currentTime) > 0.05) {
        this.videoEl.currentTime = state.currentTime;
      }
    }

    if (changedKey === 'isPlaying' || !changedKey) {
      if (state.isPlaying && this.videoEl.paused) {
        this.videoEl.play().catch((e) => console.warn('Play interrupted:', e));
      } else if (!state.isPlaying && !this.videoEl.paused) {
        this.videoEl.pause();
      }
    }

    if (changedKey === 'playbackRate' || !changedKey) {
      this.videoEl.playbackRate = state.playbackRate;
    }
  }
}
