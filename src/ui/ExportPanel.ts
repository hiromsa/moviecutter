import { AppState, AppStateData } from '../state/AppState';
import { FFmpegEngine } from '../core/FFmpegEngine';
import { VideoEngine } from '../core/VideoEngine';

export class ExportPanel {
  private container: HTMLElement;
  private appState: AppState;
  private getVideoElement: () => HTMLVideoElement;

  private cutVideoBtn!: HTMLButtonElement;
  private captureFrameBtn!: HTMLButtonElement;
  private captureLastFrameBtn!: HTMLButtonElement;
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
        <div class="action-card-title">
          <span>✂️</span>
          <span>選択範囲の動画を切り取り</span>
        </div>
        <p class="action-card-desc">再エンコードなしの超高速ストリームコピーで瞬時にMP4クリップを出力・保存します。</p>
        <button id="cutVideoBtn" class="btn btn-primary" style="margin-top: 0.5rem;">
          <span>MP4動画として保存</span>
        </button>
        <div class="progress-bar-container" id="progressBarContainer">
          <div class="progress-bar-fill" id="progressBarFill"></div>
        </div>
      </div>

      <!-- ② 現在フレームをPNG保存 (AIリファレンス用) -->
      <div class="action-card">
        <div class="action-card-title">
          <span>📸</span>
          <span>現在のフレームを保存</span>
        </div>
        <p class="action-card-desc">再生ヘッドが指している位置の最高画質静止画(PNG)をダウンロードします。</p>
        <button id="captureFrameBtn" class="btn" style="margin-top: 0.5rem;">
          <span>現在フレーム (PNG)</span>
        </button>
      </div>

      <!-- ③ 最終フレームを保存 (AIで続きを作る専用) -->
      <div class="action-card">
        <div class="action-card-title">
          <span>🎬</span>
          <span>選択範囲のラストフレーム</span>
        </div>
        <p class="action-card-desc">選択範囲の最後の瞬間をワンクリック抽出。AIに読み込ませて「続きの動画」を生成するのに最適です。</p>
        <button id="captureLastFrameBtn" class="btn btn-ai" style="margin-top: 0.5rem;">
          <span>ラストフレーム抽出 (PNG)</span>
        </button>
      </div>
    `;

    this.cutVideoBtn = this.container.querySelector('#cutVideoBtn') as HTMLButtonElement;
    this.captureFrameBtn = this.container.querySelector('#captureFrameBtn') as HTMLButtonElement;
    this.captureLastFrameBtn = this.container.querySelector('#captureLastFrameBtn') as HTMLButtonElement;
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
        this.downloadBlob(blob, `cut_${state.videoFile.name}`);
        this.appState.setFFmpegStatus('ready', '切り取りとダウンロードが完了しました！');
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

    // 現在フレーム保存
    this.captureFrameBtn.addEventListener('click', async () => {
      const video = this.getVideoElement();
      const state = this.appState.getState();
      if (!state.videoFile || !video) return;

      const { dataUrl } = VideoEngine.captureFrame(video);
      const filename = `frame_${state.currentTime.toFixed(2)}s_${state.videoName.replace(/\.[^/.]+$/, '')}.png`;
      this.downloadDataUrl(dataUrl, filename);
      this.appState.setStatusMessage(`現在のフレームを保存しました: ${filename}`);
    });

    // 選択範囲のラストフレーム保存
    this.captureLastFrameBtn.addEventListener('click', async () => {
      const state = this.appState.getState();
      if (!state.videoUrl || !state.videoFile) return;

      this.captureLastFrameBtn.disabled = true;
      this.appState.setStatusMessage('ラストフレームを抽出中...');

      try {
        // 終了時刻の直前フレーム（微小手前）を狙ってキャプチャ
        const targetTime = Math.max(0, state.endTime - 0.033);
        const blob = await VideoEngine.captureFrameAtTime(state.videoUrl, targetTime);
        if (blob) {
          const filename = `last_frame_${state.endTime.toFixed(2)}s_${state.videoName.replace(/\.[^/.]+$/, '')}.png`;
          this.downloadBlob(blob, filename);
          this.appState.setStatusMessage(`ラストフレームを保存しました: ${filename} (AIの「続き」入力に最適)`);
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
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  private downloadDataUrl(dataUrl: string, filename: string): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  private onStateChange(state: AppStateData, _changedKey?: keyof AppStateData): void {
    const hasVideo = state.videoFile !== null;
    const isProcessing = state.ffmpegStatus === 'processing';

    this.cutVideoBtn.disabled = !hasVideo || isProcessing;
    this.captureFrameBtn.disabled = !hasVideo;
    this.captureLastFrameBtn.disabled = !hasVideo;
  }
}
