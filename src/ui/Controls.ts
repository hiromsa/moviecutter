import { AppState, AppStateData } from '../state/AppState';
import { Icons } from './icons';

export class Controls {
  private container: HTMLElement;
  private appState: AppState;

  private playBtn!: HTMLButtonElement;
  private prevFrameBtn!: HTMLButtonElement;
  private nextFrameBtn!: HTMLButtonElement;
  private setInBtn!: HTMLButtonElement;
  private setOutBtn!: HTMLButtonElement;
  private loopBtn!: HTMLButtonElement;
  private loopLabel!: HTMLElement;
  private speedSelect!: HTMLSelectElement;
  private volumeMuteBtn!: HTMLButtonElement;
  private volumeSlider!: HTMLInputElement;
  private volumeValue!: HTMLElement;
  private startTimeInput!: HTMLInputElement;
  private endTimeInput!: HTMLInputElement;
  private durationInput!: HTMLInputElement;
  private lockDurationBtn!: HTMLButtonElement;
  private durationInputField!: HTMLElement;
  private clearRangeBtn!: HTMLButtonElement;
  private quick3sBtn!: HTMLButtonElement;
  private quick5sBtn!: HTMLButtonElement;

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
        <button id="prevFrameBtn" class="btn btn-icon" title="1フレーム戻る (←)">
          ${Icons.stepBack}
        </button>
        <button id="playBtn" class="btn btn-primary play-btn" title="再生 / 一時停止 (Space)">
          ${Icons.play}
        </button>
        <button id="nextFrameBtn" class="btn btn-icon" title="1フレーム進む (→)">
          ${Icons.stepForward}
        </button>
      </div>

      <!-- 範囲マーカー & ジャンプ -->
      <div class="control-group">
        <button id="jumpInBtnControls" class="btn btn-sm" title="開始点 (In) へ移動 (I または Home)">
          ${Icons.jumpToIn}
          <span>Inへ</span>
        </button>
        <button id="setInBtn" class="btn btn-sm" title="現在位置を開始点に設定 ([)">
          ${Icons.bracketIn}
          <span>In設定</span>
        </button>
        <button id="setOutBtn" class="btn btn-sm" title="現在位置を終了点に設定 (])">
          <span>Out設定</span>
          ${Icons.bracketOut}
        </button>
        <button id="jumpOutBtnControls" class="btn btn-sm" title="終了点 (Out) へ移動 (O または End)">
          <span>Outへ</span>
          ${Icons.jumpToOut}
        </button>
        <button id="loopBtn" class="btn btn-sm" title="選択範囲をループ再生 (L)">
          ${Icons.repeat}
          <span id="loopLabel">ループ: OFF</span>
        </button>
      </div>

      <!-- 再生速度 & ボリューム -->
      <div class="control-group">
        <select id="speedSelect" class="btn" title="再生速度" style="padding: 0.45rem 0.6rem;">
          <option value="0.25">0.25x</option>
          <option value="0.5">0.5x</option>
          <option value="1" selected>1.0x (標準)</option>
          <option value="1.5">1.5x</option>
          <option value="2">2.0x</option>
        </select>

        <div class="volume-control-box" title="プレビュー音量">
          <button id="volumeMuteBtn" class="btn btn-icon btn-sm volume-mute-btn" title="ミュート切替">
            ${Icons.volume2}
          </button>
          <input type="range" id="volumeSlider" min="0" max="1" step="0.02" value="1" class="volume-slider">
          <span id="volumeValue" class="volume-value-label">100%</span>
        </div>
      </div>

      <!-- 時間入力 & 切り取り時間（長さ指定・ロック・クイック・クリア） -->
      <div class="time-inputs-wrapper">
        <div class="time-field" title="開始秒数">
          <label>IN</label>
          <input type="number" id="startTimeInput" step="0.01" min="0" placeholder="--">
        </div>
        <div class="time-field" title="終了秒数">
          <label>OUT</label>
          <input type="number" id="endTimeInput" step="0.01" min="0" placeholder="--">
        </div>
        <div class="time-field duration-input-field" id="durationInputField" title="切り取り時間 (秒) - 入力すると終了点が自動計算されます">
          <label>長さ</label>
          <input type="number" id="durationInput" step="0.01" min="0.05" placeholder="--">
          <button id="lockDurationBtn" class="lock-duration-btn" title="時間をロック (長さを固定したまま範囲をドラッグ移動)">
            ${Icons.unlock}
          </button>
        </div>
        <div class="quick-duration-group" title="ワンクリックで現在位置から指定秒数を選択">
          <button id="quick3sBtn" class="btn btn-sm quick-preset-btn">3s</button>
          <button id="quick5sBtn" class="btn btn-sm quick-preset-btn">5s</button>
        </div>
        <button id="clearRangeBtn" class="btn btn-icon clear-range-btn" title="選択範囲を解除 (Esc)">
          ${Icons.close}
        </button>
      </div>
    `;

    this.playBtn = this.container.querySelector('#playBtn') as HTMLButtonElement;
    this.prevFrameBtn = this.container.querySelector('#prevFrameBtn') as HTMLButtonElement;
    this.nextFrameBtn = this.container.querySelector('#nextFrameBtn') as HTMLButtonElement;
    const jumpInBtnControls = this.container.querySelector('#jumpInBtnControls') as HTMLButtonElement;
    const jumpOutBtnControls = this.container.querySelector('#jumpOutBtnControls') as HTMLButtonElement;
    this.setInBtn = this.container.querySelector('#setInBtn') as HTMLButtonElement;
    this.setOutBtn = this.container.querySelector('#setOutBtn') as HTMLButtonElement;
    this.loopBtn = this.container.querySelector('#loopBtn') as HTMLButtonElement;
    this.loopLabel = this.container.querySelector('#loopLabel') as HTMLElement;
    this.speedSelect = this.container.querySelector('#speedSelect') as HTMLSelectElement;
    this.volumeMuteBtn = this.container.querySelector('#volumeMuteBtn') as HTMLButtonElement;
    this.volumeSlider = this.container.querySelector('#volumeSlider') as HTMLInputElement;
    this.volumeValue = this.container.querySelector('#volumeValue') as HTMLElement;
    this.startTimeInput = this.container.querySelector('#startTimeInput') as HTMLInputElement;
    this.endTimeInput = this.container.querySelector('#endTimeInput') as HTMLInputElement;
    this.durationInput = this.container.querySelector('#durationInput') as HTMLInputElement;
    this.lockDurationBtn = this.container.querySelector('#lockDurationBtn') as HTMLButtonElement;
    this.durationInputField = this.container.querySelector('#durationInputField') as HTMLElement;
    this.clearRangeBtn = this.container.querySelector('#clearRangeBtn') as HTMLButtonElement;
    this.quick3sBtn = this.container.querySelector('#quick3sBtn') as HTMLButtonElement;
    this.quick5sBtn = this.container.querySelector('#quick5sBtn') as HTMLButtonElement;

    this.setupEvents(jumpInBtnControls, jumpOutBtnControls);
    this.appState.subscribe((state, key) => this.onStateChange(state, key, jumpInBtnControls, jumpOutBtnControls));
  }

  private setupEvents(jumpInBtnControls: HTMLButtonElement, jumpOutBtnControls: HTMLButtonElement): void {
    jumpInBtnControls.addEventListener('click', () => {
      this.appState.jumpToStart();
    });

    jumpOutBtnControls.addEventListener('click', () => {
      this.appState.jumpToEnd();
    });

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
      if (state.isDurationLocked) {
        // ロック中の場合は長さを維持して開始点を現在の位置へ移動
        const len = state.endTime - state.startTime;
        this.appState.setRange(state.currentTime, state.currentTime + len);
      } else {
        this.appState.setStartTime(state.currentTime);
      }
    });

    this.setOutBtn.addEventListener('click', () => {
      const state = this.appState.getState();
      if (state.isDurationLocked) {
        // ロック中の場合は長さを維持して終了点を現在の位置へ移動
        const len = state.endTime - state.startTime;
        this.appState.setRange(state.currentTime - len, state.currentTime);
      } else {
        this.appState.setEndTime(state.currentTime);
      }
    });

    this.loopBtn.addEventListener('click', () => {
      const state = this.appState.getState();
      this.appState.setLoopingRange(!state.isLoopingRange);
    });

    this.speedSelect.addEventListener('change', () => {
      const rate = parseFloat(this.speedSelect.value);
      this.appState.setPlaybackRate(rate);
    });

    // ボリューム操作
    this.volumeMuteBtn.addEventListener('click', () => {
      this.appState.toggleMute();
    });

    this.volumeSlider.addEventListener('input', () => {
      const val = parseFloat(this.volumeSlider.value);
      this.appState.setVolume(val, false);
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

    // クイック選択プリセット (3秒 / 5秒)
    this.quick3sBtn.addEventListener('click', () => {
      this.appState.setClipDuration(3.0);
    });

    this.quick5sBtn.addEventListener('click', () => {
      this.appState.setClipDuration(5.0);
    });

    // キーボードショートカット
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
      }
    });
  }

  private onStateChange(
    state: AppStateData,
    changedKey?: keyof AppStateData,
    jumpInBtnControls?: HTMLButtonElement,
    jumpOutBtnControls?: HTMLButtonElement
  ): void {
    const hasVideo = state.videoFile !== null;
    const hasRange = state.hasRange && hasVideo;

    this.playBtn.disabled = !hasVideo;
    this.prevFrameBtn.disabled = !hasVideo;
    this.nextFrameBtn.disabled = !hasVideo;
    this.setInBtn.disabled = !hasVideo;
    this.setOutBtn.disabled = !hasVideo;
    if (jumpInBtnControls) jumpInBtnControls.disabled = !hasVideo;
    if (jumpOutBtnControls) jumpOutBtnControls.disabled = !hasVideo;
    this.loopBtn.disabled = !hasVideo;
    this.speedSelect.disabled = !hasVideo;
    this.volumeMuteBtn.disabled = !hasVideo;
    this.volumeSlider.disabled = !hasVideo;
    this.startTimeInput.disabled = !hasVideo;
    this.endTimeInput.disabled = !hasVideo;
    this.durationInput.disabled = !hasVideo;
    this.lockDurationBtn.disabled = !hasVideo;
    this.clearRangeBtn.disabled = !hasRange;
    this.quick3sBtn.disabled = !hasVideo;
    this.quick5sBtn.disabled = !hasVideo;

    if (changedKey === 'isPlaying' || !changedKey) {
      this.playBtn.innerHTML = state.isPlaying ? Icons.pause : Icons.play;
      this.playBtn.title = state.isPlaying ? '一時停止 (Space)' : '再生 (Space)';
    }

    if (changedKey === 'isLoopingRange' || !changedKey) {
      if (this.loopLabel) {
        this.loopLabel.textContent = state.isLoopingRange ? 'ループ: ON' : 'ループ: OFF';
      }
      if (state.isLoopingRange) {
        this.loopBtn.classList.add('btn-primary');
      } else {
        this.loopBtn.classList.remove('btn-primary');
      }
    }

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

    // 音量状態のUI反映
    if (changedKey === 'volume' || !changedKey) {
      const effectiveVolume = state.isMuted ? 0 : state.volume;
      if (document.activeElement !== this.volumeSlider) {
        this.volumeSlider.value = state.volume.toString();
      }
      this.volumeValue.textContent = `${Math.round(effectiveVolume * 100)}%`;

      if (state.isMuted || state.volume === 0) {
        this.volumeMuteBtn.innerHTML = Icons.volumeX;
        this.volumeMuteBtn.title = 'ミュート中 (クリックで解除)';
        this.volumeMuteBtn.classList.add('muted');
      } else if (state.volume < 0.5) {
        this.volumeMuteBtn.innerHTML = Icons.volume1;
        this.volumeMuteBtn.title = '音量小 (クリックでミュート)';
        this.volumeMuteBtn.classList.remove('muted');
      } else {
        this.volumeMuteBtn.innerHTML = Icons.volume2;
        this.volumeMuteBtn.title = '音量大 (クリックでミュート)';
        this.volumeMuteBtn.classList.remove('muted');
      }
    }
  }
}
