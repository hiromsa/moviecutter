import { AppState, AppStateData } from '../state/AppState';
import { VideoEngine } from '../core/VideoEngine';

export class Controls {
  private container: HTMLElement;
  private appState: AppState;

  private playBtn!: HTMLButtonElement;
  private prevFrameBtn!: HTMLButtonElement;
  private nextFrameBtn!: HTMLButtonElement;
  private setInBtn!: HTMLButtonElement;
  private setOutBtn!: HTMLButtonElement;
  private loopBtn!: HTMLButtonElement;
  private speedSelect!: HTMLSelectElement;
  private startTimeInput!: HTMLInputElement;
  private endTimeInput!: HTMLInputElement;
  private durationBadge!: HTMLElement;

  constructor() {
    this.appState = AppState.getInstance();
    this.container = document.createElement('div');
    this.container.className = 'controls-card';
    this.init();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  private init(): void {
    this.container.innerHTML = `
      <!-- 再生コントロール -->
      <div class="control-group">
        <button id="prevFrameBtn" class="btn btn-icon" title="1フレーム戻る (←)">◀ 1f</button>
        <button id="playBtn" class="btn btn-primary play-btn" title="再生 / 一時停止 (Space)">▶</button>
        <button id="nextFrameBtn" class="btn btn-icon" title="1フレーム進む (→)">1f ▶</button>
      </div>

      <!-- 範囲マーカー -->
      <div class="control-group">
        <button id="setInBtn" class="btn" title="現在位置を開始点に設定 ([)">
          <span>[ 開始点 (In)</span>
        </button>
        <button id="setOutBtn" class="btn" title="現在位置を終了点に設定 (])">
          <span>終了点 (Out) ]</span>
        </button>
        <button id="loopBtn" class="btn" title="選択範囲をループ再生 (L)">
          <span>🔁 ループ: OFF</span>
        </button>
      </div>

      <!-- 再生速度 -->
      <div class="control-group">
        <select id="speedSelect" class="btn" title="再生速度" style="padding: 0.45rem 0.6rem;">
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="1" selected>1.0x (標準)</option>
          <option value="1.5">1.5x</option>
          <option value="2">2.0x</option>
        </select>
      </div>

      <!-- 時間入力 -->
      <div class="time-inputs-wrapper">
        <div class="time-field" title="開始秒数">
          <label>IN</label>
          <input type="number" id="startTimeInput" step="0.01" min="0" value="0.00">
        </div>
        <div class="time-field" title="終了秒数">
          <label>OUT</label>
          <input type="number" id="endTimeInput" step="0.01" min="0" value="0.00">
        </div>
        <div class="duration-chip" id="durationBadge" title="選択範囲の長さ">
          0.00s
        </div>
      </div>
    `;

    this.playBtn = this.container.querySelector('#playBtn') as HTMLButtonElement;
    this.prevFrameBtn = this.container.querySelector('#prevFrameBtn') as HTMLButtonElement;
    this.nextFrameBtn = this.container.querySelector('#nextFrameBtn') as HTMLButtonElement;
    this.setInBtn = this.container.querySelector('#setInBtn') as HTMLButtonElement;
    this.setOutBtn = this.container.querySelector('#setOutBtn') as HTMLButtonElement;
    this.loopBtn = this.container.querySelector('#loopBtn') as HTMLButtonElement;
    this.speedSelect = this.container.querySelector('#speedSelect') as HTMLSelectElement;
    this.startTimeInput = this.container.querySelector('#startTimeInput') as HTMLInputElement;
    this.endTimeInput = this.container.querySelector('#endTimeInput') as HTMLInputElement;
    this.durationBadge = this.container.querySelector('#durationBadge') as HTMLElement;

    this.setupEvents();
    this.appState.subscribe((state, key) => this.onStateChange(state, key));
  }

  private setupEvents(): void {
    this.playBtn.addEventListener('click', () => {
      this.appState.togglePlay();
    });

    this.prevFrameBtn.addEventListener('click', () => {
      this.appState.stepFrame(-1);
    });

    this.nextFrameBtn.addEventListener('click', () => {
      this.appState.stepFrame(1);
    });

    this.setInBtn.addEventListener('click', () => {
      const state = this.appState.getState();
      this.appState.setStartTime(state.currentTime);
    });

    this.setOutBtn.addEventListener('click', () => {
      const state = this.appState.getState();
      this.appState.setEndTime(state.currentTime);
    });

    this.loopBtn.addEventListener('click', () => {
      const state = this.appState.getState();
      this.appState.setLoopingRange(!state.isLoopingRange);
    });

    this.speedSelect.addEventListener('change', () => {
      const rate = parseFloat(this.speedSelect.value);
      this.appState.setPlaybackRate(rate);
    });

    this.startTimeInput.addEventListener('change', () => {
      const val = parseFloat(this.startTimeInput.value);
      if (!isNaN(val)) {
        this.appState.setStartTime(val);
      }
    });

    this.endTimeInput.addEventListener('change', () => {
      const val = parseFloat(this.endTimeInput.value);
      if (!isNaN(val)) {
        this.appState.setEndTime(val);
      }
    });

    // キーボードショートカット
    window.addEventListener('keydown', (e) => {
      // inputにフォーカスがある時はショートカット無効
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        this.appState.togglePlay();
      } else if (e.key === '[') {
        const state = this.appState.getState();
        this.appState.setStartTime(state.currentTime);
      } else if (e.key === ']') {
        const state = this.appState.getState();
        this.appState.setEndTime(state.currentTime);
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
      }
    });
  }

  private onStateChange(state: AppStateData, changedKey?: keyof AppStateData): void {
    const hasVideo = state.videoFile !== null;
    this.playBtn.disabled = !hasVideo;
    this.prevFrameBtn.disabled = !hasVideo;
    this.nextFrameBtn.disabled = !hasVideo;
    this.setInBtn.disabled = !hasVideo;
    this.setOutBtn.disabled = !hasVideo;
    this.loopBtn.disabled = !hasVideo;
    this.speedSelect.disabled = !hasVideo;
    this.startTimeInput.disabled = !hasVideo;
    this.endTimeInput.disabled = !hasVideo;

    if (changedKey === 'isPlaying' || !changedKey) {
      this.playBtn.innerHTML = state.isPlaying ? '❚❚' : '▶';
      this.playBtn.title = state.isPlaying ? '一時停止 (Space)' : '再生 (Space)';
    }

    if (changedKey === 'isLoopingRange' || !changedKey) {
      this.loopBtn.innerHTML = state.isLoopingRange ? '🔁 ループ: ON' : '🔁 ループ: OFF';
      if (state.isLoopingRange) {
        this.loopBtn.classList.add('btn-primary');
      } else {
        this.loopBtn.classList.remove('btn-primary');
      }
    }

    if (changedKey === 'startTime' || !changedKey) {
      if (document.activeElement !== this.startTimeInput) {
        this.startTimeInput.value = state.startTime.toFixed(2);
      }
    }

    if (changedKey === 'endTime' || !changedKey) {
      if (document.activeElement !== this.endTimeInput) {
        this.endTimeInput.value = state.endTime.toFixed(2);
      }
    }

    const duration = Math.max(0, state.endTime - state.startTime);
    this.durationBadge.textContent = `${duration.toFixed(2)}s (${VideoEngine.formatTime(duration)})`;
  }
}
