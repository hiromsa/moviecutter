import { AppState, AppStateData } from '../state/AppState';
import { Icons } from './icons';

/**
 * 編集・切り取り範囲設定コントロールバー
 * 開始点(In)・終了点(Out)の設定、時間入力、長さロック、SNS/AIプリセット、範囲解除に特化
 */
export class Controls {
  private container: HTMLElement;
  private appState: AppState;

  private setInBtn!: HTMLButtonElement;
  private setOutBtn!: HTMLButtonElement;
  private inStepPrevBtn!: HTMLButtonElement;
  private inStepNextBtn!: HTMLButtonElement;
  private outStepPrevBtn!: HTMLButtonElement;
  private outStepNextBtn!: HTMLButtonElement;
  private startTimeInput!: HTMLInputElement;
  private endTimeInput!: HTMLInputElement;
  private durationInput!: HTMLInputElement;
  private lockDurationBtn!: HTMLButtonElement;
  private durationInputField!: HTMLElement;
  private clearRangeBtn!: HTMLButtonElement;
  private selectAllBtn!: HTMLButtonElement;
  private quick3sBtn!: HTMLButtonElement;
  private quick5sBtn!: HTMLButtonElement;
  private quick15sBtn!: HTMLButtonElement;
  private quick60sBtn!: HTMLButtonElement;
  private presetSelect!: HTMLSelectElement;

  constructor() {
    this.appState = AppState.getInstance();
    this.container = document.createElement('div');
    this.container.className = 'controls-card editing-controls-card';
    this.init();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  private init(): void {
    this.container.innerHTML = `
      <!-- 開始・終了ポイント設定 -->
      <div class="control-group range-point-group">
        <button id="setInBtn" class="btn btn-sm btn-set-point" title="現在位置を開始点に設定 ([)">
          ${Icons.bracketIn}
          <span>In設定</span>
        </button>
        <button id="setOutBtn" class="btn btn-sm btn-set-point" title="現在位置を終了点に設定 (])">
          <span>Out設定</span>
          ${Icons.bracketOut}
        </button>
      </div>

      <!-- 時間入力 & 切り取り時間（長さ指定・ロック） -->
      <div class="time-inputs-wrapper">
        <!-- IN (開始) 微調整グループ: |< IN[   ] >| -->
        <div class="time-adjust-group" title="開始位置の微調整 (クリック: 1フレーム / Shift+クリック: 1秒)">
          <button id="inStepPrevBtn" class="time-step-btn" title="INを1フレーム戻す (-1f / Shift: -1s)">
            ${Icons.stepBack}
          </button>
          <div class="time-field" title="開始秒数">
            <label>IN</label>
            <input type="number" id="startTimeInput" step="0.01" min="0" placeholder="--">
          </div>
          <button id="inStepNextBtn" class="time-step-btn" title="INを1フレーム進める (+1f / Shift: +1s)">
            ${Icons.stepForward}
          </button>
        </div>

        <!-- OUT (終了) 微調整グループ: |< OUT[   ] >| -->
        <div class="time-adjust-group" title="終了位置の微調整 (クリック: 1フレーム / Shift+クリック: 1秒)">
          <button id="outStepPrevBtn" class="time-step-btn" title="OUTを1フレーム戻す (-1f / Shift: -1s)">
            ${Icons.stepBack}
          </button>
          <div class="time-field" title="終了秒数">
            <label>OUT</label>
            <input type="number" id="endTimeInput" step="0.01" min="0" placeholder="--">
          </div>
          <button id="outStepNextBtn" class="time-step-btn" title="OUTを1フレーム進める (+1f / Shift: +1s)">
            ${Icons.stepForward}
          </button>
        </div>

        <div class="time-field duration-input-field" id="durationInputField" title="切り取り時間 (秒) - 入力すると終了点が自動計算されます">
          <label>長さ</label>
          <input type="number" id="durationInput" step="0.01" min="0.05" placeholder="--">
          <button id="lockDurationBtn" class="lock-duration-btn" title="時間をロック (長さを固定したまま範囲をドラッグ移動)">
            ${Icons.unlock}
          </button>
        </div>
      </div>

      <!-- クイック秒数プリセット (AI & SNS) & 範囲解除 -->
      <div class="control-group range-action-group">
        <div class="quick-duration-group" title="ワンクリックで指定秒数を選択">
          <button id="selectAllBtn" class="btn btn-sm quick-preset-btn select-all-btn" title="最初から最後まで全選択 (Ctrl+A / Alt+A)">
            ${Icons.maximize}
            <span>全選択</span>
          </button>
          <button id="quick3sBtn" class="btn btn-sm quick-preset-btn" title="AI動画推奨 (3秒)">3s</button>
          <button id="quick5sBtn" class="btn btn-sm quick-preset-btn" title="AI動画推奨 (5秒)">5s</button>
          <button id="quick15sBtn" class="btn btn-sm quick-preset-btn" title="Instagram Stories / TikTok (15秒)">15s</button>
          <button id="quick60sBtn" class="btn btn-sm quick-preset-btn" title="YouTube Shorts / Reels (60秒)">60s</button>
        </div>

        <select id="presetSelect" class="btn btn-sm preset-select" title="SNS・プラットフォーム別の制限時間プリセット">
          <option value="" disabled selected>SNS制限 ▾</option>
          <option value="3">3秒 - AI動画標準 (Runway / Luma / Pika)</option>
          <option value="5">5秒 - AI動画標準 (Gen-3 / Kling)</option>
          <option value="10">10秒 - AI動画長尺 (Kling 10s)</option>
          <option value="15">15秒 - Instagram Stories / TikTok / Reels</option>
          <option value="30">30秒 - Instagram Reels / 短尺広告</option>
          <option value="60">60秒 - YouTube Shorts / TikTok / Reels</option>
          <option value="90">90秒 - Instagram Reels (最長)</option>
          <option value="140">140秒 - X (Twitter) 動画上限 (2分20秒)</option>
        </select>

        <button id="clearRangeBtn" class="btn btn-sm btn-clear-range" title="選択範囲をクリア (Esc)">
          ${Icons.xCircle}
          <span>選択クリア</span>
        </button>
      </div>
    `;

    this.setInBtn = this.container.querySelector('#setInBtn') as HTMLButtonElement;
    this.setOutBtn = this.container.querySelector('#setOutBtn') as HTMLButtonElement;
    this.inStepPrevBtn = this.container.querySelector('#inStepPrevBtn') as HTMLButtonElement;
    this.inStepNextBtn = this.container.querySelector('#inStepNextBtn') as HTMLButtonElement;
    this.outStepPrevBtn = this.container.querySelector('#outStepPrevBtn') as HTMLButtonElement;
    this.outStepNextBtn = this.container.querySelector('#outStepNextBtn') as HTMLButtonElement;
    this.startTimeInput = this.container.querySelector('#startTimeInput') as HTMLInputElement;
    this.endTimeInput = this.container.querySelector('#endTimeInput') as HTMLInputElement;
    this.durationInput = this.container.querySelector('#durationInput') as HTMLInputElement;
    this.lockDurationBtn = this.container.querySelector('#lockDurationBtn') as HTMLButtonElement;
    this.durationInputField = this.container.querySelector('#durationInputField') as HTMLElement;
    this.clearRangeBtn = this.container.querySelector('#clearRangeBtn') as HTMLButtonElement;
    this.selectAllBtn = this.container.querySelector('#selectAllBtn') as HTMLButtonElement;
    this.quick3sBtn = this.container.querySelector('#quick3sBtn') as HTMLButtonElement;
    this.quick5sBtn = this.container.querySelector('#quick5sBtn') as HTMLButtonElement;
    this.quick15sBtn = this.container.querySelector('#quick15sBtn') as HTMLButtonElement;
    this.quick60sBtn = this.container.querySelector('#quick60sBtn') as HTMLButtonElement;
    this.presetSelect = this.container.querySelector('#presetSelect') as HTMLSelectElement;

    this.setupEvents();
    this.appState.subscribe((state, key) => this.onStateChange(state, key));
  }

  private setupEvents(): void {
    // IN (開始) / OUT (終了) の微調整 (クリック: 1フレーム / Shift: 1秒)
    const stepIn = (direction: -1 | 1, isShift: boolean) => {
      const state = this.appState.getState();
      if (!state.videoUrl) return;
      const step = isShift ? 1.0 : (state.fps > 0 ? 1 / state.fps : 0.0333);
      const currentIn = state.hasRange ? state.startTime : state.currentTime;
      let newIn = Math.max(0, currentIn + direction * step);
      if (state.duration > 0) {
        newIn = Math.min(state.duration, newIn);
      }

      if (state.isDurationLocked && state.hasRange) {
        const len = state.endTime - state.startTime;
        this.appState.setRange(newIn, newIn + len);
      } else {
        if (!state.hasRange) {
          const end = Math.min(state.duration, newIn + 3);
          this.appState.setRange(newIn, end);
        } else {
          this.appState.setStartTime(newIn);
        }
      }
      this.appState.setCurrentTime(newIn);
    };

    const stepOut = (direction: -1 | 1, isShift: boolean) => {
      const state = this.appState.getState();
      if (!state.videoUrl) return;
      const step = isShift ? 1.0 : (state.fps > 0 ? 1 / state.fps : 0.0333);
      const currentOut = state.hasRange ? state.endTime : state.currentTime;
      let newOut = Math.max(0, currentOut + direction * step);
      if (state.duration > 0) {
        newOut = Math.min(state.duration, newOut);
      }

      if (state.isDurationLocked && state.hasRange) {
        const len = state.endTime - state.startTime;
        this.appState.setRange(newOut - len, newOut);
      } else {
        if (!state.hasRange) {
          const start = Math.max(0, newOut - 3);
          this.appState.setRange(start, newOut);
        } else {
          this.appState.setEndTime(newOut);
        }
      }
      this.appState.setCurrentTime(newOut);
    };

    this.inStepPrevBtn.addEventListener('click', (e) => stepIn(-1, e.shiftKey));
    this.inStepNextBtn.addEventListener('click', (e) => stepIn(1, e.shiftKey));
    this.outStepPrevBtn.addEventListener('click', (e) => stepOut(-1, e.shiftKey));
    this.outStepNextBtn.addEventListener('click', (e) => stepOut(1, e.shiftKey));

    this.setInBtn.addEventListener('click', () => {
      const state = this.appState.getState();
      if (state.isDurationLocked && state.hasRange) {
        // ロック中の場合は長さを維持して開始点を現在の位置へ移動
        const len = state.endTime - state.startTime;
        this.appState.setRange(state.currentTime, state.currentTime + len);
      } else {
        this.appState.setStartTime(state.currentTime);
      }
    });

    this.setOutBtn.addEventListener('click', () => {
      const state = this.appState.getState();
      if (state.isDurationLocked && state.hasRange) {
        // ロック中の場合は長さを維持して終了点を現在の位置へ移動
        const len = state.endTime - state.startTime;
        this.appState.setRange(state.currentTime - len, state.currentTime);
      } else {
        this.appState.setEndTime(state.currentTime);
      }
    });

    this.startTimeInput.addEventListener('change', () => {
      const val = parseFloat(this.startTimeInput.value);
      if (!isNaN(val)) {
        if (this.appState.getState().isDurationLocked) {
          const len = this.appState.getState().endTime - this.appState.getState().startTime;
          this.appState.setRange(val, val + len);
        } else {
          this.appState.setStartTime(val);
        }
      }
    });

    this.endTimeInput.addEventListener('change', () => {
      const val = parseFloat(this.endTimeInput.value);
      if (!isNaN(val)) {
        if (this.appState.getState().isDurationLocked) {
          const len = this.appState.getState().endTime - this.appState.getState().startTime;
          this.appState.setRange(val - len, val);
        } else {
          this.appState.setEndTime(val);
        }
      }
    });

    // 切り取り時間（長さ）入力による終了点の自動変更
    this.durationInput.addEventListener('change', () => {
      const val = parseFloat(this.durationInput.value);
      if (!isNaN(val) && val > 0) {
        this.appState.setClipDuration(val);
      }
    });

    // 時間ロックトグル
    this.lockDurationBtn.addEventListener('click', () => {
      this.appState.toggleDurationLock();
    });

    // 範囲クリアボタン
    this.clearRangeBtn.addEventListener('click', () => {
      this.appState.clearRange();
    });

    // 全選択ボタン (最初から最後まで)
    this.selectAllBtn.addEventListener('click', () => {
      this.appState.selectAllRange();
    });

    // クイック選択プリセット (3秒 / 5秒 / 15秒 / 60秒)
    this.quick3sBtn.addEventListener('click', () => {
      this.appState.setClipDuration(3.0);
    });

    this.quick5sBtn.addEventListener('click', () => {
      this.appState.setClipDuration(5.0);
    });

    this.quick15sBtn.addEventListener('click', () => {
      this.appState.setClipDuration(15.0);
    });

    this.quick60sBtn.addEventListener('click', () => {
      this.appState.setClipDuration(60.0);
    });

    // SNS / プラットフォームプリセットセレクト
    this.presetSelect.addEventListener('change', () => {
      const val = parseFloat(this.presetSelect.value);
      if (!isNaN(val) && val > 0) {
        this.appState.setClipDuration(val);
        this.presetSelect.selectedIndex = 0; // プレースホルダーに戻す
      }
    });

    // キーボードショートカット（アプリ全体）
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        this.appState.togglePlay();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.appState.clearRange();
      } else if (e.key === '{' || (e.shiftKey && e.key === '[') || e.key === 'i' || e.key === 'I' || e.key === 'Home') {
        e.preventDefault();
        this.appState.jumpToStart();
      } else if (e.key === '}' || (e.shiftKey && e.key === ']') || e.key === 'o' || e.key === 'O' || e.key === 'End') {
        e.preventDefault();
        this.appState.jumpToEnd();
      } else if (e.key === '[') {
        const state = this.appState.getState();
        if (state.isDurationLocked && state.hasRange) {
          const len = state.endTime - state.startTime;
          this.appState.setRange(state.currentTime, state.currentTime + len);
        } else {
          this.appState.setStartTime(state.currentTime);
        }
      } else if (e.key === ']') {
        const state = this.appState.getState();
        if (state.isDurationLocked && state.hasRange) {
          const len = state.endTime - state.startTime;
          this.appState.setRange(state.currentTime - len, state.currentTime);
        } else {
          this.appState.setEndTime(state.currentTime);
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) {
          this.appState.setCurrentTime(this.appState.getState().currentTime - 1);
        } else {
          this.appState.stepFrame(-1);
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) {
          this.appState.setCurrentTime(this.appState.getState().currentTime + 1);
        } else {
          this.appState.stepFrame(1);
        }
      } else if (e.key === 'l' || e.key === 'L') {
        const state = this.appState.getState();
        this.appState.setLoopingRange(!state.isLoopingRange);
      } else if ((e.ctrlKey && e.key.toLowerCase() === 'a') || (e.altKey && e.key.toLowerCase() === 'a') || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        this.appState.selectAllRange();
      }
    });
  }

  private onStateChange(state: AppStateData, changedKey?: keyof AppStateData): void {
    const hasVideo = state.videoFile !== null;
    const hasRange = state.hasRange && hasVideo;

    this.setInBtn.disabled = !hasVideo;
    this.setOutBtn.disabled = !hasVideo;
    this.inStepPrevBtn.disabled = !hasVideo;
    this.inStepNextBtn.disabled = !hasVideo;
    this.outStepPrevBtn.disabled = !hasVideo;
    this.outStepNextBtn.disabled = !hasVideo;
    this.startTimeInput.disabled = !hasVideo;
    this.endTimeInput.disabled = !hasVideo;
    this.durationInput.disabled = !hasVideo;
    this.lockDurationBtn.disabled = !hasVideo;
    this.clearRangeBtn.disabled = !hasRange;
    this.selectAllBtn.disabled = !hasVideo;
    this.quick3sBtn.disabled = !hasVideo;
    this.quick5sBtn.disabled = !hasVideo;
    this.quick15sBtn.disabled = !hasVideo;
    this.quick60sBtn.disabled = !hasVideo;
    this.presetSelect.disabled = !hasVideo;

    if (changedKey === 'startTime' || changedKey === 'hasRange' || !changedKey) {
      if (document.activeElement !== this.startTimeInput) {
        this.startTimeInput.value = hasRange ? state.startTime.toFixed(2) : '';
      }
    }

    if (changedKey === 'endTime' || changedKey === 'hasRange' || !changedKey) {
      if (document.activeElement !== this.endTimeInput) {
        this.endTimeInput.value = hasRange ? state.endTime.toFixed(2) : '';
      }
    }

    if (changedKey === 'startTime' || changedKey === 'endTime' || changedKey === 'hasRange' || !changedKey) {
      const duration = Math.max(0, state.endTime - state.startTime);
      if (document.activeElement !== this.durationInput) {
        this.durationInput.value = hasRange ? duration.toFixed(2) : '';
      }
    }

    // ロック状態のUI反映
    if (changedKey === 'isDurationLocked' || !changedKey) {
      this.lockDurationBtn.innerHTML = state.isDurationLocked ? Icons.lock : Icons.unlock;
      this.lockDurationBtn.title = state.isDurationLocked
        ? '時間ロック中: 長さが固定されています (クリックで解除)'
        : '時間をロック: 長さを固定して範囲をドラッグ移動';

      if (state.isDurationLocked) {
        this.durationInputField.classList.add('locked');
      } else {
        this.durationInputField.classList.remove('locked');
      }
    }
  }
}
