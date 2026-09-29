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

  private switchTab(tab: 'shortcuts' | 'workflow' | 'storage'): void {
    const tabBtns = this.backdrop.querySelectorAll('.help-tab-btn');
    tabBtns.forEach((btn) => {
      const target = (btn as HTMLElement).dataset.tab;
      btn.classList.toggle('active', target === tab);
    });

    const panes = this.backdrop.querySelectorAll('.help-tab-pane');
    panes.forEach((pane) => {
      const target = (pane as HTMLElement).dataset.tab;
      pane.classList.toggle('active', target === tab);
    });
  }

  private init(): void {
    this.backdrop.innerHTML = `
      <div class="modal-card">
        <!-- 固定ヘッダー -->
        <div class="modal-header">
          <div class="modal-title" style="display: flex; align-items: center; gap: 0.5rem;">
            ${Icons.help}
            <span>MovieCutter ガイド</span>
          </div>
          <button class="close-btn" id="closeHelpModal" title="閉じる">
            ${Icons.close}
          </button>
        </div>

        <!-- タブ切り替えバー -->
        <div class="help-tabs-nav">
          <button class="help-tab-btn active" data-tab="shortcuts">
            <span>⌨️ 操作・ショートカット</span>
          </button>
          <button class="help-tab-btn" data-tab="workflow">
            <span>🤖 AI連携ワークフロー</span>
          </button>
          <button class="help-tab-btn" data-tab="storage">
            <span>📁 保存先と仕様</span>
          </button>
        </div>

        <!-- スクロール可能コンテンツ領域 -->
        <div class="modal-body custom-scrollbar">
          <!-- タブ1: ショートカット & 操作 -->
          <div class="help-tab-pane active" data-tab="shortcuts">
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">
              タイムライン上のクリック・ドラッグや、キーボードを使って素早く正確にカット編集が行えます。
            </div>
            <table class="shortcut-table">
              <tr>
                <td><span class="kbd">ルーラー上下ドラッグ</span></td>
                <td>時間軸の拡大・縮小（ズームイン / アウト）</td>
              </tr>
              <tr>
                <td><span class="kbd">ルーラー クリック/左右ドラッグ</span></td>
                <td>キャレット（再生ヘッド）を直接シーク移動</td>
              </tr>
              <tr>
                <td><span class="kbd">トラックをドラッグ</span></td>
                <td>開始点(In)〜終了点(Out)を一発で範囲選択</td>
              </tr>
              <tr>
                <td><span class="kbd">トラックをクリック</span></td>
                <td>範囲を維持したままキャレットをクリック位置へ移動</td>
              </tr>
              <tr>
                <td><span class="kbd">選択範囲ハイライトをドラッグ</span></td>
                <td>範囲長さを保持したまま左右へスライド移動</td>
              </tr>
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
                <td><span class="kbd">A</span> / <span class="kbd">Ctrl</span> + <span class="kbd">A</span></td>
                <td>動画の最初から最後までを全選択</td>
              </tr>
              <tr>
                <td><span class="kbd">←</span> / <span class="kbd">→</span></td>
                <td>1フレーム戻る / 進む（精密コマ送り）</td>
              </tr>
              <tr>
                <td><span class="kbd">Shift</span> + <span class="kbd">←</span> / <span class="kbd">→</span></td>
                <td>1秒戻る / 進む</td>
              </tr>
              <tr>
                <td><span class="kbd">Esc</span></td>
                <td>選択範囲を解除</td>
              </tr>
              <tr>
                <td><span class="kbd">L</span></td>
                <td>範囲ループ再生 ON / OFF</td>
              </tr>
              <tr>
                <td><span class="kbd">Alt</span> + <span class="kbd">ホイール</span></td>
                <td>タイムラインのズーム拡大・縮小</td>
              </tr>
            </table>
          </div>

          <!-- タブ2: AI連携 -->
          <div class="help-tab-pane" data-tab="workflow">
            <div style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1rem; line-height: 1.6;">
              <strong style="color: var(--text-main);">MovieCutter</strong> は、既存の動画から必要な区間を素早く切り出し、AIで続きの動画を生成するための軽量＆高速ブラウザスタジオです。
            </div>

            <div class="workflow-card">
              <h4 style="margin-bottom: 0.6rem; font-size: 0.95rem; color: var(--primary); display: flex; align-items: center; gap: 0.4rem;">
                <span>🚀 AIで続きを作るおすすめ手順</span>
              </h4>
              <ol style="font-size: 0.85rem; color: var(--text-muted); padding-left: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; line-height: 1.5;">
                <li>既存動画を読み込み、タイムラインで続きを作りたい部分を指定。</li>
                <li>「<strong>🎬 選択範囲のラストフレーム (PNG)</strong>」をクリックして末尾の画像を保存。</li>
                <li>Runway, Luma Dream Machine, Kling, Sora, Pika などの <em>Image-to-Video (I2V)</em> サービスに保存した画像をセットし、続きのモーションをプロンプトで生成！</li>
                <li>必要に応じて「<strong>✂️ 動画を切り取り保存 (MP4)</strong>」で前段の動画クリップも高速に手元に保管。</li>
              </ol>
            </div>

            <div class="workflow-card" style="margin-top: 1rem;">
              <h4 style="margin-bottom: 0.6rem; font-size: 0.95rem; color: #38bdf8; display: flex; align-items: center; gap: 0.4rem;">
                <span>🎵 音声＋静止画モード（Twitter/X投稿用MP4）</span>
              </h4>
              <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.5;">
                音声ファイル（MP3/WAV）と画像（PNG/JPG）をドロップするだけで、静止画を背景にした動画（MP4）をブラウザ内で超高速生成できます。TwitterやInstagramなど音声単体で投稿できないSNSへのシェアに最適です。
              </p>
            </div>
          </div>

          <!-- タブ3: 保存先と仕様 -->
          <div class="help-tab-pane" data-tab="storage">
            <div class="workflow-card">
              <h4 style="margin-bottom: 0.6rem; font-size: 0.95rem; color: #38bdf8;">📁 ファイルの保存先と拡張子</h4>
              <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.6;">
                - 保存ボタンを押すと、Chrome/Edge等のブラウザでは<strong>「名前を付けて保存」ダイアログ</strong>が開き、保存先フォルダとファイル名を確認・選択できます。<br>
                - ダイアログが開かない環境では、ブラウザ標準の<strong>「ダウンロード」フォルダ</strong>（通常はPCのダウンロードフォルダ）へ自動保存されます。<br>
                - 切り取り動画には必ず <code>.mp4</code>、画像には <code>.png</code> の拡張子が自動付与されます。
              </p>
            </div>

            <div class="workflow-card" style="margin-top: 1rem;">
              <h4 style="margin-bottom: 0.6rem; font-size: 0.95rem; color: var(--accent-success);">🔒 セキュリティ・完全ローカル処理</h4>
              <p style="font-size: 0.84rem; color: var(--text-muted); line-height: 1.6;">
                - 読み込んだ動画・音声・画像は、すべてWebAssembly (FFmpeg) によりお使いのブラウザ内部でのみ処理されます。<br>
                - 外部サーバーへのアップロードや情報収集、通信は一切行われません。機密動画やプライベートな素材も安全に編集していただけます。
              </p>
            </div>
          </div>
        </div>

        <!-- 固定フッター -->
        <div class="modal-footer">
          <span>MovieCutter ${APP_VERSION_DETAIL}</span>
          <span style="color: var(--accent-success); display: inline-flex; align-items: center; gap: 0.3rem;">
            ${Icons.shieldCheck} 完全ローカル処理
          </span>
        </div>
      </div>
    `;

    // タブイベント
    const tabBtns = this.backdrop.querySelectorAll('.help-tab-btn');
    tabBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = (btn as HTMLElement).dataset.tab as any;
        if (tab) this.switchTab(tab);
      });
    });

    const closeBtn = this.backdrop.querySelector('#closeHelpModal') as HTMLButtonElement;
    closeBtn.addEventListener('click', () => this.close());

    this.backdrop.addEventListener('click', (e) => {
      if (e.target === this.backdrop) {
        this.close();
      }
    });
  }
}
