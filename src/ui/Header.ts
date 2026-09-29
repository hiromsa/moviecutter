import { APP_VERSION_SHORT } from '../config/version';
import { Icons } from './icons';
import { AppState } from '../state/AppState';

export class Header {
  private container: HTMLElement;
  private appState: AppState;
  private onOpenHelp: () => void;
  private onSelectFile: () => void;

  constructor(options: { onOpenHelp: () => void; onSelectFile: () => void }) {
    this.appState = AppState.getInstance();
    this.onOpenHelp = options.onOpenHelp;
    this.onSelectFile = options.onSelectFile;
    this.container = document.createElement('header');
    this.container.className = 'header-container';
    this.render();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  private render(): void {
    this.container.innerHTML = `
      <div class="brand-wrapper">
        <div class="brand-logo-icon">
          ${Icons.scissors}
        </div>
        <div class="brand-info">
          <div class="brand-title-row">
            <span class="brand-title">MovieCutter</span>
            <span class="version-badge" title="バージョン">${APP_VERSION_SHORT}</span>
            <div class="privacy-shield-badge" title="【完全ローカル処理＆情報収集ゼロ】\n動画・音声・画像データはお使いのブラウザ内でのみ処理されます。外部サーバーへの送信や情報収集は一切行いません。安心してご利用ください。">
              ${Icons.shieldCheck}
              <span>完全ローカル処理（情報収集ゼロ）</span>
            </div>
          </div>
          <span class="brand-tagline">AI-Powered Video Clip & Frame Studio</span>
        </div>
      </div>

      <div class="header-actions">
        <button id="headerResetBtn" class="btn" title="編集内容をクリアして初期状態に戻します">
          ${Icons.rotateCcw}
          <span>クリア</span>
        </button>
        <button id="headerOpenBtn" class="btn btn-primary" title="動画・音声・画像ファイルを開く">
          ${Icons.folder}
          <span>ファイルを開く</span>
        </button>
        <button id="headerHelpBtn" class="btn" title="使い方・キーボードショートカット">
          ${Icons.help}
          <span>ガイド</span>
        </button>
      </div>
    `;

    const resetBtn = this.container.querySelector('#headerResetBtn') as HTMLButtonElement;
    resetBtn.addEventListener('click', () => {
      const state = this.appState.getState();
      if (state.videoFile || state.imageFile || state.hasRange) {
        if (!confirm('現在の編集内容をクリアして初期状態に戻しますか？')) {
          return;
        }
      }
      this.appState.reset();
    });

    const openBtn = this.container.querySelector('#headerOpenBtn') as HTMLButtonElement;
    openBtn.addEventListener('click', () => this.onSelectFile());

    const helpBtn = this.container.querySelector('#headerHelpBtn') as HTMLButtonElement;
    helpBtn.addEventListener('click', () => this.onOpenHelp());
  }
}
