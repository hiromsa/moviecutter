import { APP_VERSION_DETAIL } from '../config/version';
import { Icons } from './icons';

export class HelpModal {
  private backdrop: HTMLElement;

  constructor() {
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'modal-backdrop';
    this.init();
  }

  public getElement(): HTMLElement {
    return this.backdrop;
  }

  public open(): void {
    this.backdrop.classList.add('open');
  }

  public close(): void {
    this.backdrop.classList.remove('open');
  }

  private init(): void {
    this.backdrop.innerHTML = `
      <div class="modal-card">
        <div class="modal-header">
          <div class="modal-title" style="display: flex; align-items: center; gap: 0.5rem;">
            ${Icons.help}
            <span>MovieCutter ガイド</span>
          </div>
          <button class="close-btn" id="closeHelpModal" title="閉じる">
            ${Icons.close}
          </button>
        </div>

        <div style="font-size: 0.9rem; color: var(--text-muted);">
          <strong style="color: var(--text-main);">MovieCutter</strong> は、既存の動画から必要な区間を素早く切り取り、AIで続きの動画を生成するための軽量＆高速ブラウザスタジオです。
        </div>

        <div>
          <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--primary);">🤖 AIで続きを作るおすすめワークフロー</h4>
          <ol style="font-size: 0.85rem; color: var(--text-muted); padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.35rem;">
            <li>既存動画を読み込み、タイムラインで続きを作りたい部分を指定。</li>
            <li>「<strong>🎬 選択範囲のラストフレーム (PNG)</strong>」をクリックして末尾の画像を保存。</li>
            <li>Runway, Luma Dream Machine, Kling, Sora, Pika などの <em>Image-to-Video (I2V)</em> に保存した画像をセットし、続きのモーションをプロンプトで生成！</li>
            <li>必要に応じて「<strong>✂️ 動画を切り取り保存 (MP4)</strong>」で前段の動画クリップも高速に手元に保管。</li>
          </ol>
        </div>

        <div>
          <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem; color: var(--accent-range);">⌨️ キーボードショートカット & 操作</h4>
          <table class="shortcut-table">
            <tr>
              <td><span class="kbd">Space</span></td>
              <td>再生 / 一時停止</td>
            </tr>
            <tr>
              <td><span class="kbd">I</span> / <span class="kbd">Home</span></td>
              <td>キャレットを開始地点 (In) へ移動</td>
            </tr>
            <tr>
              <td><span class="kbd">O</span> / <span class="kbd">End</span></td>
              <td>キャレットを終了地点 (Out) へ移動</td>
            </tr>
            <tr>
              <td><span class="kbd">[</span></td>
              <td>現在のキャレット位置を開始地点 (In) に設定</td>
            </tr>
            <tr>
              <td><span class="kbd">]</span></td>
              <td>現在のキャレット位置を終了地点 (Out) に設定</td>
            </tr>
            <tr>
              <td><span class="kbd">Alt</span> + <span class="kbd">ホイール</span></td>
              <td>タイムラインのズームイン / ズームアウト</td>
            </tr>
            <tr>
              <td><span class="kbd">←</span> / <span class="kbd">→</span></td>
              <td>1フレーム戻る / 進む（コマ送り）</td>
            </tr>
            <tr>
              <td><span class="kbd">Shift</span> + <span class="kbd">←</span> / <span class="kbd">→</span></td>
              <td>1秒戻る / 進む</td>
            </tr>
            <tr>
              <td><span class="kbd">L</span></td>
              <td>選択範囲のループ再生 ON / OFF</td>
            </tr>
          </table>
        </div>

        <div>
          <h4 style="margin-bottom: 0.5rem; font-size: 0.95rem; color: #38bdf8;">📁 ファイルの保存先と拡張子について</h4>
          <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.6;">
            - 保存ボタンを押すと、Chrome/Edge等のブラウザでは<strong>「名前を付けて保存」ダイアログ</strong>が開き、保存先フォルダとファイル名を確認・選択できます。<br>
            - ダイアログが開かない環境では、ブラウザ標準の<strong>「ダウンロード」フォルダ</strong>（通常はPCのダウンロードフォルダ）へ自動保存されます。<br>
            - 切り取り動画には必ず <code>.mp4</code>、画像には <code>.png</code> の拡張子が付与されます。
          </p>
        </div>

        <div style="font-size: 0.75rem; color: var(--text-dim); border-top: 1px solid rgba(255,255,255,0.06); padding-top: 0.75rem; display: flex; justify-content: space-between;">
          <span>MovieCutter ${APP_VERSION_DETAIL}</span>
          <span>再エンコードなしストリームコピー対応</span>
        </div>
      </div>
    `;

    const closeBtn = this.backdrop.querySelector('#closeHelpModal') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.close());

    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });
  }
}
