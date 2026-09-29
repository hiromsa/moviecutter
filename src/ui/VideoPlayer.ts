import { AppState, AppStateData } from '../state/AppState';
import { VideoEngine } from '../core/VideoEngine';
import { AudioEngine } from '../core/AudioEngine';
import { Icons } from './icons';

export class VideoPlayer {
  private container: HTMLElement;
  private mainViewEl: HTMLElement;
  private videoEl: HTMLVideoElement;
  private dropzoneEl: HTMLElement;
  private replaceOverlayEl: HTMLElement;
  private hudTimeEl: HTMLElement;
  private hudInfoEl: HTMLElement;

  private rangeSidebarEl: HTMLElement;
  private inPreviewCard: HTMLElement;
  private outPreviewCard: HTMLElement;
  private inPreviewTimeEl: HTMLElement;
  private outPreviewTimeEl: HTMLElement;
  private inPreviewImgEl: HTMLImageElement;
  private outPreviewImgEl: HTMLImageElement;
  private inPreviewEmptyEl: HTMLElement;
  private outPreviewEmptyEl: HTMLElement;

  private appState: AppState;
  private isUserSeeking = false;
  private onSelectFile: () => void;
  private updateThumbTimeout: any = null;
  private lastCapturedInTime: number = -1;
  private lastCapturedOutTime: number = -1;

  constructor(options: { onSelectFile: () => void }) {
    this.appState = AppState.getInstance();
    this.onSelectFile = options.onSelectFile;

    this.container = document.createElement('div');
    this.container.className = 'player-container';

    // 左側: メインビュー
    this.mainViewEl = document.createElement('div');
    this.mainViewEl.className = 'player-main-view';

    this.videoEl = document.createElement('video');
    this.videoEl.className = 'player-video';
    this.videoEl.playsInline = true;

    this.dropzoneEl = document.createElement('div');
    this.dropzoneEl.className = 'dropzone-overlay';

    // 動画読み込み後のドラッグオーバー用オーバーレイ（点線＆ドロップガイド）
    this.replaceOverlayEl = document.createElement('div');
    this.replaceOverlayEl.className = 'replace-drop-overlay';

    this.hudTimeEl = document.createElement('div');
    this.hudTimeEl.className = 'hud-badge time';
    this.hudTimeEl.textContent = '00:00.00 / 00:00.00';

    this.hudInfoEl = document.createElement('div');
    this.hudInfoEl.className = 'hud-badge info';
    this.hudInfoEl.textContent = '未選択';

    // 右側: IN/OUT プレビューサイドバー
    this.rangeSidebarEl = document.createElement('aside');
    this.rangeSidebarEl.className = 'range-preview-sidebar';

    this.inPreviewCard = document.createElement('div');
    this.inPreviewCard.className = 'range-preview-card in-card';
    this.inPreviewCard.title = 'クリックして開始点 (In) へジャンプ';
    this.inPreviewCard.innerHTML = `
      <div class="range-card-header">
        <span class="range-badge badge-in">IN (開始)</span>
        <span class="range-time-badge" id="inPreviewTime">--:--.--</span>
      </div>
      <div class="range-thumb-container">
        <img id="inPreviewImg" class="range-thumb-img" style="display: none;" alt="開始点プレビュー" />
        <div id="inPreviewEmpty" class="range-thumb-empty">
          <span>未設定</span>
        </div>
      </div>
    `;

    this.outPreviewCard = document.createElement('div');
    this.outPreviewCard.className = 'range-preview-card out-card';
    this.outPreviewCard.title = 'クリックして終了点 (Out) へジャンプ';
    this.outPreviewCard.innerHTML = `
      <div class="range-card-header">
        <span class="range-badge badge-out">OUT (終了)</span>
        <span class="range-time-badge" id="outPreviewTime">--:--.--</span>
      </div>
      <div class="range-thumb-container">
        <img id="outPreviewImg" class="range-thumb-img" style="display: none;" alt="終了点プレビュー" />
        <div id="outPreviewEmpty" class="range-thumb-empty">
          <span>未設定</span>
        </div>
      </div>
    `;

    this.inPreviewTimeEl = this.inPreviewCard.querySelector('#inPreviewTime') as HTMLElement;
    this.inPreviewImgEl = this.inPreviewCard.querySelector('#inPreviewImg') as HTMLImageElement;
    this.inPreviewEmptyEl = this.inPreviewCard.querySelector('#inPreviewEmpty') as HTMLElement;

    this.outPreviewTimeEl = this.outPreviewCard.querySelector('#outPreviewTime') as HTMLElement;
    this.outPreviewImgEl = this.outPreviewCard.querySelector('#outPreviewImg') as HTMLImageElement;
    this.outPreviewEmptyEl = this.outPreviewCard.querySelector('#outPreviewEmpty') as HTMLElement;

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

    this.replaceOverlayEl.innerHTML = `
      <div class="replace-drop-content">
        <div class="dropzone-icon-box">
          ${Icons.uploadCloud}
        </div>
        <div class="dropzone-text-main">新しい動画をドロップして差し替え</div>
        <div class="dropzone-text-sub">クリックまたはドラッグ＆ドロップ (MP4, WebM, MOV, AVI...)</div>
      </div>
    `;

    const hudOverlay = document.createElement('div');
    hudOverlay.className = 'player-hud-overlay';
    hudOverlay.appendChild(this.hudTimeEl);
    hudOverlay.appendChild(this.hudInfoEl);

    this.mainViewEl.appendChild(this.videoEl);
    this.mainViewEl.appendChild(this.dropzoneEl);
    this.mainViewEl.appendChild(this.replaceOverlayEl);
    this.mainViewEl.appendChild(hudOverlay);

    this.rangeSidebarEl.appendChild(this.inPreviewCard);
    this.rangeSidebarEl.appendChild(this.outPreviewCard);

    this.container.appendChild(this.mainViewEl);
    this.container.appendChild(this.rangeSidebarEl);

    this.setupEvents();
    this.appState.subscribe((state, key) => this.onStateChange(state, key));
  }

  private setupEvents(): void {
    // ドロップゾーンクリック
    this.dropzoneEl.addEventListener('click', () => this.onSelectFile());
    this.replaceOverlayEl.addEventListener('click', () => this.onSelectFile());

    // ドラッグ＆ドロップハンドリング (動画未選択時・読み込み後両方で点線とオーバーレイを確実に表示)
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        dragCounter++;
        this.replaceOverlayEl.classList.add('active');
        this.dropzoneEl.classList.add('drag-over');
      }
    });

    window.addEventListener('dragleave', () => {
      dragCounter--;
      if (dragCounter <= 0) {
        dragCounter = 0;
        this.replaceOverlayEl.classList.remove('active');
        this.dropzoneEl.classList.remove('drag-over');
      }
    });

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
        e.dataTransfer.dropEffect = 'copy';
      }
    });

    window.addEventListener('drop', () => {
      dragCounter = 0;
      this.replaceOverlayEl.classList.remove('active');
      this.dropzoneEl.classList.remove('drag-over');
    });

    this.container.addEventListener('drop', (e) => {
      e.preventDefault();
      dragCounter = 0;
      this.replaceOverlayEl.classList.remove('active');
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

    // IN / OUT プレビューカードのクリックでジャンプ
    this.inPreviewCard.addEventListener('click', () => {
      const state = this.appState.getState();
      if (state.hasRange) {
        this.appState.jumpToStart();
      }
    });

    this.outPreviewCard.addEventListener('click', () => {
      const state = this.appState.getState();
      if (state.hasRange) {
        this.appState.jumpToEnd();
      }
    });
  }

  public async loadVideoFile(file: File): Promise<void> {
    try {
      this.appState.setStatusMessage('動画を読み込み中...');
      const { url, duration, width, height } = await VideoEngine.loadMetadata(file);
      this.appState.setVideo(file, url, duration, width, height);

      // サムネイル生成をバックグラウンドで開始
      VideoEngine.generateThumbnails(url, duration, 14)
        .then((thumbnails) => {
          this.appState.setThumbnails(thumbnails);
        })
        .catch((err) => {
          console.warn('サムネイル生成に失敗しました:', err);
          this.appState.setLoadingThumbnails(false);
        });

      // 音声波形抽出をバックグラウンドで開始
      AudioEngine.extractPeaks(file)
        .then((peaks) => {
          this.appState.setAudioPeaks(peaks);
        })
        .catch((err) => {
          console.warn('音声波形抽出に失敗しました:', err);
          this.appState.setLoadingWaveform(false);
        });
    } catch (err: any) {
      console.error(err);
      this.appState.setLoadingThumbnails(false);
      this.appState.setLoadingWaveform(false);
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

    if (changedKey === 'volume' || !changedKey) {
      this.videoEl.volume = state.isMuted ? 0 : state.volume;
      this.videoEl.muted = state.isMuted;
    }

    // 開始点・終了点プレビュー画像の更新トリガー
    if (
      changedKey === 'startTime' ||
      changedKey === 'endTime' ||
      changedKey === 'hasRange' ||
      changedKey === 'videoFile' ||
      !changedKey
    ) {
      this.scheduleRangeThumbnailsUpdate();
    }
  }

  /**
   * IN/OUTフレームプレビューの更新をデバウンス実行
   */
  private scheduleRangeThumbnailsUpdate(): void {
    clearTimeout(this.updateThumbTimeout);
    this.updateThumbTimeout = setTimeout(() => {
      this.updateRangeThumbnails();
    }, 100);
  }

  /**
   * IN/OUTフレームのプレビュー画像を描画
   */
  private async updateRangeThumbnails(): Promise<void> {
    const state = this.appState.getState();

    if (!state.videoUrl || !state.hasRange) {
      this.inPreviewTimeEl.textContent = '--:--.--';
      this.outPreviewTimeEl.textContent = '--:--.--';
      this.inPreviewImgEl.style.display = 'none';
      this.inPreviewEmptyEl.style.display = 'flex';
      this.outPreviewImgEl.style.display = 'none';
      this.outPreviewEmptyEl.style.display = 'flex';
      this.lastCapturedInTime = -1;
      this.lastCapturedOutTime = -1;
      return;
    }

    // 時間テキスト更新
    this.inPreviewTimeEl.textContent = VideoEngine.formatTime(state.startTime);
    this.outPreviewTimeEl.textContent = VideoEngine.formatTime(state.endTime);

    // IN点フレーム更新
    if (Math.abs(this.lastCapturedInTime - state.startTime) > 0.03) {
      this.lastCapturedInTime = state.startTime;
      const inDataUrl = await VideoEngine.captureDataUrlAtTime(state.videoUrl, state.startTime, 280);
      if (inDataUrl) {
        this.inPreviewImgEl.src = inDataUrl;
        this.inPreviewImgEl.style.display = 'block';
        this.inPreviewEmptyEl.style.display = 'none';
      }
    }

    // OUT点フレーム更新
    if (Math.abs(this.lastCapturedOutTime - state.endTime) > 0.03) {
      this.lastCapturedOutTime = state.endTime;
      const outDataUrl = await VideoEngine.captureDataUrlAtTime(state.videoUrl, state.endTime, 280);
      if (outDataUrl) {
        this.outPreviewImgEl.src = outDataUrl;
        this.outPreviewImgEl.style.display = 'block';
        this.outPreviewEmptyEl.style.display = 'none';
      }
    }
  }
}
