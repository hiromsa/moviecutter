import { AppState, AppStateData } from '../state/AppState';

export class StatusBar {
  private container: HTMLElement;
  private appState: AppState;
  private statusDot!: HTMLElement;
  private statusText!: HTMLElement;
  private fileInfoText!: HTMLElement;

  constructor() {
    this.appState = AppState.getInstance();
    this.container = document.createElement('footer');
    this.container.className = 'status-bar-container';
    this.init();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  private init(): void {
    this.container.innerHTML = `
      <div class="engine-status-indicator">
        <span class="status-dot" id="statusDot"></span>
        <span id="statusText">初期化中...</span>
      </div>
      <div id="fileInfoText">
        <span>ショートカット: Space(再生/停止), [(In点), ](Out点), ←/→(1フレーム)</span>
      </div>
    `;

    this.statusDot = this.container.querySelector('#statusDot') as HTMLElement;
    this.statusText = this.container.querySelector('#statusText') as HTMLElement;
    this.fileInfoText = this.container.querySelector('#fileInfoText') as HTMLElement;

    this.appState.subscribe((state, key) => this.onStateChange(state, key));
  }

  private onStateChange(state: AppStateData, _changedKey?: keyof AppStateData): void {
    this.statusText.textContent = state.statusMessage;

    this.statusDot.className = 'status-dot';
    if (state.ffmpegStatus === 'ready') {
      this.statusDot.classList.add('ready');
    } else if (state.ffmpegStatus === 'processing' || state.ffmpegStatus === 'loading') {
      this.statusDot.classList.add('processing');
    } else if (state.ffmpegStatus === 'error') {
      this.statusDot.classList.add('error');
    }

    if (state.videoFile) {
      this.fileInfoText.innerHTML = `
        <span><strong>${state.videoName}</strong> (${state.videoWidth}x${state.videoHeight}, ${state.duration.toFixed(2)}s)</span>
      `;
    }
  }
}
