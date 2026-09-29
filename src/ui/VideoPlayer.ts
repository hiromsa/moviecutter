import { AppState, AppStateData } from '../state/AppState';
import { VideoEngine } from '../core/VideoEngine';
import { AudioEngine } from '../core/AudioEngine';
import { Icons } from './icons';

export class VideoPlayer {
  private container: HTMLElement;
  private mainViewEl: HTMLElement;
  private videoEl: HTMLVideoElement;
  private stillImageEl: HTMLImageElement;
  private dropzoneEl: HTMLElement;
  private replaceOverlayEl: HTMLElement;
  private hudTimeEl: HTMLElement;
  private hudInfoEl: HTMLElement;
  private changeImageBtn: HTMLButtonElement;
  private imageFileInput: HTMLInputElement;
  private pendingImage: { file: File | null; blob: Blob; dataUrl: string; width: number; height: number } | null = null;

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

    // 静止画像（音声モード用カバーアート）
    this.stillImageEl = document.createElement('img');
    this.stillImageEl.className = 'player-still-image';
    this.stillImageEl.alt = 'カバー画像';
    this.stillImageEl.style.display = 'none';

    this.dropzoneEl = document.createElement('div');
    this.dropzoneEl.className = 'dropzone-overlay';

    // 動画・音声・画像読み込み後のドラッグオーバー用オーバーレイ（点線＆ドロップガイド）
    this.replaceOverlayEl = document.createElement('div');
    this.replaceOverlayEl.className = 'replace-drop-overlay';

    this.hudTimeEl = document.createElement('div');
    this.hudTimeEl.className = 'hud-badge time';
    this.hudTimeEl.textContent = '00:00.00 / 00:00.00';

    this.hudInfoEl = document.createElement('div');
    this.hudInfoEl.className = 'hud-badge info';
    this.hudInfoEl.textContent = '未選択';

    this.changeImageBtn = document.createElement('button');
    this.changeImageBtn.className = 'hud-badge action-btn btn-change-image';
    this.changeImageBtn.innerHTML = `${Icons.camera}<span>画像変更</span>`;
    this.changeImageBtn.title = '静止画（カバー画像）を変更する';
    this.changeImageBtn.style.display = 'none';

    this.imageFileInput = document.createElement('input');
    this.imageFileInput.type = 'file';
    this.imageFileInput.accept = 'image/*';
    this.imageFileInput.style.display = 'none';
    document.body.appendChild(this.imageFileInput);

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
      <div class="dropzone-text-main">動画・音声・画像をドラッグ＆ドロップ</div>
      <div class="dropzone-text-sub">クリックしてファイルを選択 (MP4, WebM, MP3, WAV, PNG, JPG...)</div>
    `;

    this.replaceOverlayEl.innerHTML = `
      <div class="replace-drop-content">
        <div class="dropzone-icon-box">
          ${Icons.uploadCloud}
        </div>
        <div class="dropzone-text-main">新しい動画・音声・画像をドロップして読み込み</div>
        <div class="dropzone-text-sub">クリックまたはドラッグ＆ドロップ (MP4, MP3, WAV, PNG, JPG...)</div>
      </div>
    `;

    const hudOverlay = document.createElement('div');
    hudOverlay.className = 'player-hud-overlay';
    hudOverlay.appendChild(this.hudTimeEl);

    const hudRight = document.createElement('div');
    hudRight.style.display = 'flex';
    hudRight.style.alignItems = 'center';
    hudRight.style.gap = '0.5rem';
    hudRight.appendChild(this.changeImageBtn);
    hudRight.appendChild(this.hudInfoEl);
    hudOverlay.appendChild(hudRight);

    this.mainViewEl.appendChild(this.videoEl);
    this.mainViewEl.appendChild(this.stillImageEl);
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

    // 静止画カバークリックで再生/一時停止
    this.stillImageEl.addEventListener('click', () => {
      this.appState.togglePlay();
    });

    // カバー画像変更ボタンクリック
    this.changeImageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.imageFileInput.value = '';
      this.imageFileInput.click();
    });

    this.imageFileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.loadImageFile(target.files[0]);
      }
    });

    // ドラッグ＆ドロップハンドリング (動画・音声・画像すべてを柔軟に受入)
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
        this.loadMediaFile(e.dataTransfer.files[0]);
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

  public async loadMediaFile(file: File): Promise<void> {
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac|flac|ogg)$/i.test(file.name);
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);

    if (isVideo) {
      await this.loadVideoFile(file);
    } else if (isAudio) {
      await this.loadAudioFile(file);
    } else if (isImage) {
      await this.loadImageFile(file);
    } else {
      alert('動画、音声（MP3/WAV等）、または画像（PNG/JPG等）を選択してください。');
    }
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

  public async loadAudioFile(file: File): Promise<void> {
    try {
      this.appState.setStatusMessage('音声を読み込み中...');
      const duration = await AudioEngine.getAudioDuration(file);
      const audioUrl = URL.createObjectURL(file);

      // 画像の選定: pendingImage -> 既存のimageBlob -> 自動生成アートワーク
      let imageBlob: Blob;
      let imageUrl: string;
      let imageFile: File | null = null;
      let width = 1280;
      let height = 720;

      if (this.pendingImage) {
        imageBlob = this.pendingImage.blob;
        imageUrl = this.pendingImage.dataUrl;
        imageFile = this.pendingImage.file;
        width = this.pendingImage.width;
        height = this.pendingImage.height;
        this.pendingImage = null;
      } else {
        const state = this.appState.getState();
        if (state.imageBlob && state.imageUrl) {
          imageBlob = state.imageBlob;
          imageUrl = state.imageUrl;
          imageFile = state.imageFile;
          width = state.videoWidth || 1280;
          height = state.videoHeight || 720;
        } else {
          // 美麗なスタジオアートワークをCanvasで自動生成
          const artwork = await VideoEngine.createDefaultArtwork(
            file.name,
            VideoEngine.formatTime(duration),
            1280,
            720
          );
          imageBlob = artwork.blob;
          imageUrl = artwork.dataUrl;
        }
      }

      this.appState.setAudioWithStill(file, audioUrl, duration, imageBlob, imageUrl, imageFile, width, height);

      // 静止画像サムネイルをタイムラインに展開
      const staticThumbs = VideoEngine.generateStaticThumbnails(imageUrl, duration, 16);
      this.appState.setThumbnails(staticThumbs);

      // 音声波形抽出
      AudioEngine.extractPeaks(file)
        .then((peaks) => {
          this.appState.setAudioPeaks(peaks);
        })
        .catch((err) => {
          console.warn('波形抽出エラー:', err);
          this.appState.setLoadingWaveform(false);
        });
    } catch (err: any) {
      console.error(err);
      this.appState.setLoadingThumbnails(false);
      this.appState.setLoadingWaveform(false);
      alert('音声ファイルの読み込みに失敗しました: ' + err.message);
    }
  }

  public async loadImageFile(file: File): Promise<void> {
    try {
      this.appState.setStatusMessage('画像を読み込み中...');
      const { blob, dataUrl, width, height } = await VideoEngine.loadImage(file);
      const state = this.appState.getState();

      if (state.audioFile) {
        // すでに音声がロードされている場合はカバー画像を即時差し替え
        this.appState.updateStillImage(blob, dataUrl, file, width, height);
        const staticThumbs = VideoEngine.generateStaticThumbnails(dataUrl, state.duration, 16);
        this.appState.setThumbnails(staticThumbs);
        this.appState.setStatusMessage(`カバー画像を「${file.name}」に変更しました`);
      } else {
        // 音声がまだない場合は画像を保留し、音声を待つ
        this.pendingImage = { file, blob, dataUrl, width, height };
        this.dropzoneEl.innerHTML = `
          <div class="dropzone-icon-box">
            ${Icons.film}
          </div>
          <div class="dropzone-text-main">カバー画像「${file.name}」をセットしました！</div>
          <div class="dropzone-text-sub">裏で流す音声ファイル（MP3, WAV, M4A等）をここにドロップしてください</div>
        `;
        this.appState.setStatusMessage('画像をセットしました。続けて音声ファイルをドロップしてください。');
      }
    } catch (err: any) {
      console.error(err);
      alert('画像ファイルの読み込みに失敗しました: ' + err.message);
    }
  }

  private onStateChange(state: AppStateData, changedKey?: keyof AppStateData): void {
    if (changedKey === 'videoFile' || changedKey === 'mediaMode' || changedKey === 'imageUrl' || !changedKey) {
      if (state.videoUrl) {
        this.dropzoneEl.style.display = 'none';

        if (state.mediaMode === 'audio-still') {
          // 静止画＋音声モード
          this.stillImageEl.style.display = 'block';
          this.stillImageEl.src = state.imageUrl || '';
          this.videoEl.style.display = 'none';
          this.changeImageBtn.style.display = 'inline-flex';
          this.hudInfoEl.textContent = `🎵 音声+静止画 (${state.videoWidth}x${state.videoHeight})`;
        } else {
          // 通常動画モード
          this.stillImageEl.style.display = 'none';
          this.videoEl.style.display = 'block';
          this.changeImageBtn.style.display = 'none';
          this.hudInfoEl.textContent = `${state.videoWidth}x${state.videoHeight} (${VideoEngine.formatFileSize(state.videoFile?.size || 0)})`;
        }

        if (this.videoEl.src !== state.videoUrl) {
          this.videoEl.src = state.videoUrl;
        }
      } else {
        this.dropzoneEl.style.display = 'flex';
        this.stillImageEl.style.display = 'none';
        this.changeImageBtn.style.display = 'none';
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

    // 静止画＋音声モードの場合は同一カバー画像を即座にセット
    if (state.mediaMode === 'audio-still' && state.imageUrl) {
      this.inPreviewImgEl.src = state.imageUrl;
      this.inPreviewImgEl.style.display = 'block';
      this.inPreviewEmptyEl.style.display = 'none';
      this.outPreviewImgEl.src = state.imageUrl;
      this.outPreviewImgEl.style.display = 'block';
      this.outPreviewEmptyEl.style.display = 'none';
      return;
    }

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
