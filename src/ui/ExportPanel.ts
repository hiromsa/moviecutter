import { AppState, AppStateData } from '../state/AppState';
import { FFmpegEngine } from '../core/FFmpegEngine';
import { VideoEngine } from '../core/VideoEngine';
import { Icons } from './icons';

export class ExportPanel {
  private container: HTMLElement;
  private appState: AppState;
  private getVideoElement: () => HTMLVideoElement;

  private cutVideoBtn!: HTMLButtonElement;
  private captureFrameBtn!: HTMLButtonElement;
  private copyFrameBtn!: HTMLButtonElement;
  private captureLastFrameBtn!: HTMLButtonElement;
  private copyLastFrameBtn!: HTMLButtonElement;
  private progressBarContainer!: HTMLElement;
  private progressBarFill!: HTMLElement;

  constructor(options: { getVideoElement: () => HTMLVideoElement }) {
    this.appState = AppState.getInstance();
    this.getVideoElement = options.getVideoElement;

    this.container = document.createElement('div');
    this.container.className = 'export-panel-card';
    this.init();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  private init(): void {
    this.container.innerHTML = `
      <!-- ① 切り取り保存 (MP4) -->
      <div class="action-card">
        <div class="action-card-header">
          <div class="action-icon-badge cyan">
            ${Icons.scissors}
          </div>
          <span class="action-card-title">選択範囲の動画を切り取り</span>
        </div>
        <p class="action-card-desc">再エンコードなしの超高速ストリームコピーで瞬時にMP4動画を出力・保存します。</p>
        <button id="cutVideoBtn" class="btn btn-primary" style="margin-top: 0.5rem;">
          ${Icons.download}
          <span>MP4動画として保存 (.mp4)</span>
        </button>
        <div class="progress-bar-container" id="progressBarContainer">
          <div class="progress-bar-fill" id="progressBarFill"></div>
        </div>
      </div>

      <!-- ② 現在フレームをPNG保存 & クリップボードコピー -->
      <div class="action-card">
        <div class="action-card-header">
          <div class="action-icon-badge">
            ${Icons.camera}
          </div>
          <span class="action-card-title">現在のフレーム</span>
        </div>
        <p class="action-card-desc">キャレット位置の最高画質静止画をファイル保存、またはクリップボードに直接コピーします。</p>
        <div class="action-buttons-row">
          <button id="captureFrameBtn" class="btn btn-sm" style="flex: 1;" title="PNG画像として保存">
            ${Icons.download}
            <span>PNG保存</span>
          </button>
          <button id="copyFrameBtn" class="btn btn-sm" title="クリップボードに画像をコピー (Ctrl+Vで貼り付け)">
            ${Icons.copy}
            <span>コピー</span>
          </button>
        </div>
      </div>

      <!-- ③ 最終フレームを保存 & クリップボードコピー (AIで続きを作る専用) -->
      <div class="action-card">
        <div class="action-card-header">
          <div class="action-icon-badge purple">
            ${Icons.sparkles}
          </div>
          <span class="action-card-title">選択範囲ラストフレーム</span>
        </div>
        <p class="action-card-desc">最後の瞬間を抽出。画像コピーでAI（Runway, Kling, Luma等）へ直接貼り付けて続きを生成可能！</p>
        <div class="action-buttons-row">
          <button id="captureLastFrameBtn" class="btn btn-ai btn-sm" style="flex: 1;" title="PNG画像として保存">
            ${Icons.download}
            <span>PNG保存</span>
          </button>
          <button id="copyLastFrameBtn" class="btn btn-sm" title="クリップボードに画像をコピー (Ctrl+Vで貼り付け)">
            ${Icons.copy}
            <span>コピー</span>
          </button>
        </div>
      </div>
    `;

    this.cutVideoBtn = this.container.querySelector('#cutVideoBtn') as HTMLButtonElement;
    this.captureFrameBtn = this.container.querySelector('#captureFrameBtn') as HTMLButtonElement;
    this.copyFrameBtn = this.container.querySelector('#copyFrameBtn') as HTMLButtonElement;
    this.captureLastFrameBtn = this.container.querySelector('#captureLastFrameBtn') as HTMLButtonElement;
    this.copyLastFrameBtn = this.container.querySelector('#copyLastFrameBtn') as HTMLButtonElement;
    this.progressBarContainer = this.container.querySelector('#progressBarContainer') as HTMLElement;
    this.progressBarFill = this.container.querySelector('#progressBarFill') as HTMLElement;

    this.setupEvents();
    this.appState.subscribe((state, key) => this.onStateChange(state, key));
  }

  private setupEvents(): void {
    // 動画切り取り
    this.cutVideoBtn.addEventListener('click', async () => {
      const state = this.appState.getState();
      if (!state.videoFile) return;

      try {
        this.cutVideoBtn.disabled = true;
        this.progressBarContainer.classList.add('active');
        this.progressBarFill.style.width = '10%';
        this.appState.setFFmpegStatus('processing', '動画を高速切り出し中...');

        const ffmpeg = FFmpegEngine.getInstance();
        const blob = await ffmpeg.cutVideo(
          state.videoFile,
          state.startTime,
          state.endTime,
          (progress) => {
            this.progressBarFill.style.width = `${Math.max(10, progress)}%`;
          }
        );

        this.progressBarFill.style.width = '100%';

        const baseName = (state.videoFile.name || 'video').replace(/\.[^/.]+$/, '');
        const filename = `cut_${baseName}_${state.startTime.toFixed(2)}s-${state.endTime.toFixed(2)}s.mp4`;

        await this.saveFile(blob, filename, 'video/mp4', 'mp4');
        this.appState.setFFmpegStatus('ready', '切り取りと保存が完了しました！');
      } catch (err: any) {
        console.error(err);
        this.appState.setFFmpegStatus('error', '切り取り処理でエラーが発生しました: ' + err.message);
        alert('切り取り処理中にエラーが発生しました。コンソールログを確認してください。');
      } finally {
        this.cutVideoBtn.disabled = false;
        setTimeout(() => {
          this.progressBarContainer.classList.remove('active');
          this.progressBarFill.style.width = '0%';
        }, 1200);
      }
    });

    // 現在フレーム保存 (ファイル保存)
    this.captureFrameBtn.addEventListener('click', async () => {
      const video = this.getVideoElement();
      const state = this.appState.getState();
      if (!state.videoFile || !video) return;

      const { blob } = VideoEngine.captureFrame(video);
      const b = await blob;
      if (!b) return;

      const baseName = (state.videoFile.name || 'video').replace(/\.[^/.]+$/, '');
      const filename = `frame_${baseName}_${state.currentTime.toFixed(2)}s.png`;

      await this.saveFile(b, filename, 'image/png', 'png');
    });

    // 現在フレームをクリップボードにコピー
    this.copyFrameBtn.addEventListener('click', async () => {
      const video = this.getVideoElement();
      const state = this.appState.getState();
      if (!state.videoFile || !video) return;

      const { blob } = VideoEngine.captureFrame(video);
      const b = await blob;
      if (!b) return;

      await this.copyImageToClipboard(b, '現在のフレーム');
    });

    // 選択範囲のラストフレーム保存 (ファイル保存)
    this.captureLastFrameBtn.addEventListener('click', async () => {
      const state = this.appState.getState();
      if (!state.videoUrl || !state.videoFile) return;

      this.captureLastFrameBtn.disabled = true;
      this.appState.setStatusMessage('ラストフレームを抽出中...');

      try {
        const targetTime = Math.max(0, state.endTime - 0.033);
        const blob = await VideoEngine.captureFrameAtTime(state.videoUrl, targetTime);
        if (blob) {
          const baseName = (state.videoFile.name || 'video').replace(/\.[^/.]+$/, '');
          const filename = `last_frame_${baseName}_${state.endTime.toFixed(2)}s.png`;

          await this.saveFile(blob, filename, 'image/png', 'png');
        } else {
          alert('ラストフレームの抽出に失敗しました。');
        }
      } catch (e: any) {
        console.error(e);
        alert('エラーが発生しました: ' + e.message);
      } finally {
        this.captureLastFrameBtn.disabled = false;
      }
    });

    // 選択範囲のラストフレームをクリップボードにコピー
    this.copyLastFrameBtn.addEventListener('click', async () => {
      const state = this.appState.getState();
      if (!state.videoUrl || !state.videoFile) return;

      this.copyLastFrameBtn.disabled = true;
      this.appState.setStatusMessage('ラストフレームをコピー中...');

      try {
        const targetTime = Math.max(0, state.endTime - 0.033);
        const blob = await VideoEngine.captureFrameAtTime(state.videoUrl, targetTime);
        if (blob) {
          await this.copyImageToClipboard(blob, 'ラストフレーム');
        } else {
          alert('ラストフレームの抽出に失敗しました。');
        }
      } catch (e: any) {
        console.error(e);
        alert('エラーが発生しました: ' + e.message);
      } finally {
        this.copyLastFrameBtn.disabled = false;
      }
    });
  }

  /**
   * 画像をクリップボードに直接コピー (Ctrl+Vで貼り付け可能)
   */
  private async copyImageToClipboard(blob: Blob, label: string): Promise<void> {
    try {
      if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('お使いのブラウザはクリップボード画像書き込みに対応していません。');
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);

      this.showToast(`📋 ${label}をクリップボードにコピーしました！\n(Ctrl+V でAIツール等に直接貼り付けできます)`);
      this.appState.setStatusMessage(`${label}をクリップボードにコピーしました`);
    } catch (err: any) {
      console.error('Clipboard copy failed:', err);
      alert('クリップボードへの画像コピーに失敗しました: ' + (err.message || err));
    }
  }

  /**
   * ファイル保存ユーティリティ
   * 最新の showSaveFilePicker (名前を付けて保存) を優先し、非対応時はダウンロードフォルダへの保存にフォールバック
   */
  private async saveFile(blob: Blob, suggestedName: string, mimeType: string, extension: string): Promise<void> {
    // File System Access API 対応ブラウザ
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName,
          types: [
            {
              description: extension === 'mp4' ? 'MP4 Video' : 'PNG Image',
              accept: { [mimeType]: [`.${extension}`] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();

        this.showToast(`✅ 保存完了: 「${handle.name}」を指定した場所に保存しました`);
        this.appState.setStatusMessage(`保存完了: ${handle.name}`);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          this.appState.setStatusMessage('保存ダイアログがキャンセルされました');
          return;
        }
        console.warn('showSaveFilePicker failed, falling back to download:', err);
      }
    }

    // 通常ダウンロードへのフォールバック
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);

    this.showToast(`✅ ダウンロード完了: 「${suggestedName}」\n(ブラウザの「ダウンロード」フォルダに保存されました)`);
    this.appState.setStatusMessage(`ダウンロード完了: ${suggestedName} (ダウンロードフォルダ)`);
  }

  /**
   * 画面下部にスッと現れるトースト通知
   */
  private showToast(message: string): void {
    let toast = document.getElementById('saveToastNotification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'saveToastNotification';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }

    toast.innerText = message;
    toast.classList.add('visible');

    setTimeout(() => {
      toast?.classList.remove('visible');
    }, 4500);
  }

  private onStateChange(state: AppStateData, _changedKey?: keyof AppStateData): void {
    const hasVideo = state.videoFile !== null;
    const hasRange = state.hasRange && hasVideo;
    const isProcessing = state.ffmpegStatus === 'processing';

    this.cutVideoBtn.disabled = !hasRange || isProcessing;
    if (!hasVideo) {
      this.cutVideoBtn.innerHTML = `${Icons.scissors} カット保存`;
      this.cutVideoBtn.title = '動画を読み込んでください';
    } else if (!hasRange) {
      this.cutVideoBtn.innerHTML = `${Icons.scissors} 範囲未選択`;
      this.cutVideoBtn.title = 'タイムライン上をドラッグして切り取り範囲を指定してください';
    } else {
      const len = (state.endTime - state.startTime).toFixed(2);
      this.cutVideoBtn.innerHTML = `${Icons.scissors} カット保存 (${len}s)`;
      this.cutVideoBtn.title = '選択範囲を高画質・無劣化でMP4出力します';
    }

    this.captureFrameBtn.disabled = !hasVideo;
    this.copyFrameBtn.disabled = !hasVideo;
    this.captureLastFrameBtn.disabled = !hasRange;
    this.copyLastFrameBtn.disabled = !hasRange;
  }
}
