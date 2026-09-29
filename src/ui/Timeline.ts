import { AppState, AppStateData } from '../state/AppState';
import { VideoEngine } from '../core/VideoEngine';
import { Icons } from './icons';

export class Timeline {
  private container: HTMLElement;
  private headerBarEl: HTMLElement;
  private viewportEl: HTMLElement;
  private contentEl: HTMLElement;
  private rulerEl: HTMLElement;
  private trackEl: HTMLElement;
  private thumbnailStripEl: HTMLElement;
  private rangeHighlightEl: HTMLElement;
  private inHandleEl: HTMLElement;
  private outHandleEl: HTMLElement;
  private playheadEl: HTMLElement;

  private zoomSliderEl!: HTMLInputElement;
  private zoomBadgeEl!: HTMLElement;
  private jumpInBtn!: HTMLButtonElement;
  private jumpOutBtn!: HTMLButtonElement;

  private appState: AppState;

  private isDraggingIn = false;
  private isDraggingOut = false;
  private isDraggingPlayhead = false;
  private isUserScrolling = false;
  private userScrollTimeout: any = null;

  constructor() {
    this.appState = AppState.getInstance();

    this.container = document.createElement('div');
    this.container.className = 'timeline-card';

    // タイムライン上部ツールバー（ズーム・ジャンプ）
    this.headerBarEl = document.createElement('div');
    this.headerBarEl.className = 'timeline-toolbar';

    // スクロール可能なビューポート
    this.viewportEl = document.createElement('div');
    this.viewportEl.className = 'timeline-scroll-viewport';

    // ズーム倍率に応じた伸縮コンテンツ
    this.contentEl = document.createElement('div');
    this.contentEl.className = 'timeline-content';

    this.rulerEl = document.createElement('div');
    this.rulerEl.className = 'timeline-ruler';
    this.rulerEl.title = 'クリックまたはドラッグしてキャレット（再生ヘッド）を移動';

    this.trackEl = document.createElement('div');
    this.trackEl.className = 'timeline-track-container';
    this.trackEl.title = 'ドラッグで範囲指定 / クリックでキャレット移動';

    this.thumbnailStripEl = document.createElement('div');
    this.thumbnailStripEl.className = 'thumbnail-strip';

    this.rangeHighlightEl = document.createElement('div');
    this.rangeHighlightEl.className = 'timeline-range-highlight';

    this.inHandleEl = document.createElement('div');
    this.inHandleEl.className = 'timeline-handle timeline-handle-in';
    this.inHandleEl.title = '開始点 (In) - ドラッグして調整';

    this.outHandleEl = document.createElement('div');
    this.outHandleEl.className = 'timeline-handle timeline-handle-out';
    this.outHandleEl.title = '終了点 (Out) - ドラッグして調整';

    this.playheadEl = document.createElement('div');
    this.playheadEl.className = 'timeline-playhead';
    this.playheadEl.innerHTML = '<div class="playhead-head" title="再生ヘッド - ドラッグして移動"></div>';

    this.init();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  private init(): void {
    // ツールバー構築
    this.headerBarEl.innerHTML = `
      <div class="timeline-toolbar-left">
        <span class="timeline-title">${Icons.timeline} <span>タイムライン</span></span>
        <button id="jumpInBtn" class="btn btn-sm" title="キャレットを開始地点 (In) へ移動">
          ${Icons.jumpToIn}
          <span>Inへジャンプ</span>
        </button>
        <button id="jumpOutBtn" class="btn btn-sm" title="キャレットを終了地点 (Out) へ移動">
          <span>Outへジャンプ</span>
          ${Icons.jumpToOut}
        </button>
      </div>

      <div class="timeline-toolbar-right">
        <span class="zoom-label">ズーム:</span>
        <button id="zoomOutBtn" class="btn btn-icon btn-sm" title="縮小 (Alt + ホイール下)">
          ${Icons.zoomOut}
        </button>
        <input type="range" id="zoomSlider" min="1" max="10" step="0.2" value="1" class="zoom-slider">
        <button id="zoomInBtn" class="btn btn-icon btn-sm" title="拡大 (Alt + ホイール上)">
          ${Icons.zoomIn}
        </button>
        <button id="zoomBadge" class="zoom-badge-btn" title="クリックで等倍(1.0x)にリセット">1.0x</button>
      </div>
    `;

    this.jumpInBtn = this.headerBarEl.querySelector('#jumpInBtn') as HTMLButtonElement;
    this.jumpOutBtn = this.headerBarEl.querySelector('#jumpOutBtn') as HTMLButtonElement;
    this.zoomSliderEl = this.headerBarEl.querySelector('#zoomSlider') as HTMLInputElement;
    this.zoomBadgeEl = this.headerBarEl.querySelector('#zoomBadge') as HTMLElement;
    const zoomOutBtn = this.headerBarEl.querySelector('#zoomOutBtn') as HTMLButtonElement;
    const zoomInBtn = this.headerBarEl.querySelector('#zoomInBtn') as HTMLButtonElement;

    // トラック構築
    this.trackEl.appendChild(this.thumbnailStripEl);
    this.trackEl.appendChild(this.rangeHighlightEl);
    this.trackEl.appendChild(this.inHandleEl);
    this.trackEl.appendChild(this.outHandleEl);
    this.trackEl.appendChild(this.playheadEl);

    this.contentEl.appendChild(this.rulerEl);
    this.contentEl.appendChild(this.trackEl);
    this.viewportEl.appendChild(this.contentEl);

    this.container.appendChild(this.headerBarEl);
    this.container.appendChild(this.viewportEl);

    // イベント設定
    this.setupEvents(zoomOutBtn, zoomInBtn);
    this.appState.subscribe((state, key) => this.onStateChange(state, key));
  }

  private setupEvents(zoomOutBtn: HTMLButtonElement, zoomInBtn: HTMLButtonElement): void {
    // ジャンプボタン
    this.jumpInBtn.addEventListener('click', () => {
      this.appState.jumpToStart();
      this.scrollPlayheadIntoView();
    });

    this.jumpOutBtn.addEventListener('click', () => {
      this.appState.jumpToEnd();
      this.scrollPlayheadIntoView();
    });

    // ズーム操作
    this.zoomSliderEl.addEventListener('input', () => {
      const zoom = parseFloat(this.zoomSliderEl.value);
      this.appState.setTimelineZoom(zoom);
    });

    this.zoomBadgeEl.addEventListener('click', () => {
      this.appState.setTimelineZoom(1.0);
    });

    zoomInBtn.addEventListener('click', () => {
      const current = this.appState.getState().timelineZoom;
      this.appState.setTimelineZoom(Math.min(10, current + 1.0));
    });

    zoomOutBtn.addEventListener('click', () => {
      const current = this.appState.getState().timelineZoom;
      this.appState.setTimelineZoom(Math.max(1, current - 1.0));
    });

    // マウスホイールによるズーム & 横スクロール
    this.viewportEl.addEventListener('wheel', (e) => {
      if (e.altKey || e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 0.4 : -0.4;
        const current = this.appState.getState().timelineZoom;
        this.appState.setTimelineZoom(Math.max(1, Math.min(10, current + delta)));
      }
    }, { passive: false });

    // スクロール監視
    this.viewportEl.addEventListener('scroll', () => {
      this.isUserScrolling = true;
      clearTimeout(this.userScrollTimeout);
      this.userScrollTimeout = setTimeout(() => {
        this.isUserScrolling = false;
      }, 1000);
    });

    // ① ルーラー領域でのシーク＆ドラッグ（ハンドルに邪魔されない専用キャレット操作）
    const startPlayheadScrubbing = (e: MouseEvent) => {
      e.preventDefault();
      this.isDraggingPlayhead = true;
      this.updatePlayheadFromMouseEvent(e);

      const onMouseMove = (moveEvt: MouseEvent) => {
        if (this.isDraggingPlayhead) {
          this.updatePlayheadFromMouseEvent(moveEvt);
        }
      };

      const onMouseUp = () => {
        this.isDraggingPlayhead = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    // ルーラー領域クリック＆ドラッグ
    this.rulerEl.addEventListener('mousedown', startPlayheadScrubbing);

    // 再生ヘッドのつまみ（ルーラー上の頭部）のみドラッグ可能に
    const playheadHeadEl = this.playheadEl.querySelector('.playhead-head') as HTMLElement;
    if (playheadHeadEl) {
      playheadHeadEl.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        startPlayheadScrubbing(e);
      });
    }

    // ② トラック領域でのマウス操作：
    // ドラッグした時は「マウスダウン〜マウスアップ」で開始・終了を一括指定（ロック中は幅を維持してスライド）
    // 単なるクリックの時はキャレットを移動
    this.trackEl.addEventListener('mousedown', (e) => {
      if (e.target === this.inHandleEl || e.target === this.outHandleEl || e.target === this.rangeHighlightEl) return;

      const startX = e.clientX;
      const initialTime = this.getTimeFromMouseEvent(e);
      const isLocked = this.appState.getState().isDurationLocked;
      const initialStart = this.appState.getState().startTime;
      const initialEnd = this.appState.getState().endTime;
      const rangeLen = Math.max(0.05, initialEnd - initialStart);
      const duration = this.appState.getState().duration;
      const rect = this.trackEl.getBoundingClientRect();

      let isRangeDragging = false;

      const onMouseMove = (moveEvt: MouseEvent) => {
        const dx = Math.abs(moveEvt.clientX - startX);
        if (!isRangeDragging && dx >= 4) {
          isRangeDragging = true;
        }

        if (isRangeDragging) {
          if (isLocked) {
            // ロック時: クリックした差分だけ範囲全体をスライド移動
            const deltaX = moveEvt.clientX - startX;
            const deltaSec = rect.width > 0 ? (deltaX / rect.width) * duration : 0;
            const newStart = Math.max(0, Math.min(duration - rangeLen, initialStart + deltaSec));
            this.appState.setRange(newStart, newStart + rangeLen);
            this.appState.setCurrentTime(newStart);
          } else {
            // 通常時: ドラッグ開始点〜現在点を選択範囲とする
            const currentTime = this.getTimeFromMouseEvent(moveEvt);
            const s = Math.min(initialTime, currentTime);
            const end = Math.max(initialTime, currentTime);
            this.appState.setRange(s, end);
            this.appState.setCurrentTime(currentTime);
          }
        }
      };

      const onMouseUp = (upEvt: MouseEvent) => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);

        if (!isRangeDragging) {
          // 単なるクリックだった場合はキャレットをシーク
          const clickTime = this.getTimeFromMouseEvent(upEvt);
          this.appState.setCurrentTime(clickTime);
        }
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // ③ 選択範囲ハイライト自体のドラッグ（範囲をまるごと左右スライド）
    this.rangeHighlightEl.addEventListener('mousedown', (e) => {
      if (e.target === this.inHandleEl || e.target === this.outHandleEl) return;
      e.stopPropagation();

      const startX = e.clientX;
      const initialStart = this.appState.getState().startTime;
      const initialEnd = this.appState.getState().endTime;
      const rangeLen = initialEnd - initialStart;
      const duration = this.appState.getState().duration;
      const rect = this.trackEl.getBoundingClientRect();

      this.rangeHighlightEl.classList.add('dragging');

      const onMouseMove = (moveEvt: MouseEvent) => {
        const deltaX = moveEvt.clientX - startX;
        const deltaSec = rect.width > 0 ? (deltaX / rect.width) * duration : 0;
        const newStart = Math.max(0, Math.min(duration - rangeLen, initialStart + deltaSec));
        const newEnd = newStart + rangeLen;
        this.appState.setRange(newStart, newEnd);
        this.appState.setCurrentTime(newStart);
      };

      const onMouseUp = () => {
        this.rangeHighlightEl.classList.remove('dragging');
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // ④ Inハンドル ドラッグ（個別微調整、ロック中は長さを維持して全体スライド）
    this.inHandleEl.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.isDraggingIn = true;
      const isLocked = this.appState.getState().isDurationLocked;
      const rangeLen = this.appState.getState().endTime - this.appState.getState().startTime;
      const duration = this.appState.getState().duration;

      const onMouseMove = (moveEvt: MouseEvent) => {
        if (this.isDraggingIn) {
          const time = this.getTimeFromMouseEvent(moveEvt);
          if (isLocked) {
            const clamped = Math.max(0, Math.min(duration - rangeLen, time));
            this.appState.setRange(clamped, clamped + rangeLen);
            this.appState.setCurrentTime(clamped);
          } else {
            this.appState.setStartTime(time);
            this.appState.setCurrentTime(time);
          }
        }
      };

      const onMouseUp = () => {
        this.isDraggingIn = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });

    // ⑤ Outハンドル ドラッグ（個別微調整、ロック中は長さを維持して全体スライド）
    this.outHandleEl.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.isDraggingOut = true;
      const isLocked = this.appState.getState().isDurationLocked;
      const rangeLen = this.appState.getState().endTime - this.appState.getState().startTime;
      const duration = this.appState.getState().duration;

      const onMouseMove = (moveEvt: MouseEvent) => {
        if (this.isDraggingOut) {
          const time = this.getTimeFromMouseEvent(moveEvt);
          if (isLocked) {
            const clamped = Math.max(rangeLen, Math.min(duration, time));
            this.appState.setRange(clamped - rangeLen, clamped);
            this.appState.setCurrentTime(clamped);
          } else {
            this.appState.setEndTime(time);
            this.appState.setCurrentTime(time);
          }
        }
      };

      const onMouseUp = () => {
        this.isDraggingOut = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  private getTimeFromMouseEvent(e: MouseEvent): number {
    const rect = this.trackEl.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const ratio = rect.width > 0 ? x / rect.width : 0;
    const duration = this.appState.getState().duration;
    return ratio * duration;
  }

  private updatePlayheadFromMouseEvent(e: MouseEvent): void {
    const time = this.getTimeFromMouseEvent(e);
    this.appState.setCurrentTime(time);
  }

  /**
   * 再生ヘッドが画面外にある場合にスクロール位置を調整
   */
  private scrollPlayheadIntoView(): void {
    const state = this.appState.getState();
    if (state.duration <= 0) return;

    const playheadRatio = state.currentTime / state.duration;
    const trackWidth = this.trackEl.offsetWidth;
    const playheadX = playheadRatio * trackWidth;

    const viewScrollLeft = this.viewportEl.scrollLeft;
    const viewWidth = this.viewportEl.clientWidth;

    // 画面外に出ていたら中央付近にスクロール
    if (playheadX < viewScrollLeft || playheadX > viewScrollLeft + viewWidth) {
      this.viewportEl.scrollLeft = Math.max(0, playheadX - viewWidth / 2);
    }
  }

  private updateRuler(duration: number, zoom: number): void {
    this.rulerEl.innerHTML = '';
    if (duration <= 0) return;

    // ズーム倍率に応じて目盛り数を増加（見やすく詳細化）
    const baseTicks = 8;
    const ticksCount = Math.round(baseTicks * zoom);
    const step = duration / ticksCount;

    for (let i = 0; i <= ticksCount; i++) {
      const time = i * step;
      const percent = (i / ticksCount) * 100;

      const tick = document.createElement('div');
      tick.className = 'ruler-tick';
      tick.style.left = `${percent}%`;
      tick.innerHTML = `
        <span>${VideoEngine.formatTime(time)}</span>
        <div class="ruler-tick-mark"></div>
      `;
      this.rulerEl.appendChild(tick);
    }
  }

  private onStateChange(state: AppStateData, changedKey?: keyof AppStateData): void {
    const duration = state.duration || 1;
    const zoom = state.timelineZoom || 1.0;

    // ズーム幅の適用
    this.contentEl.style.width = `${zoom * 100}%`;
    this.zoomSliderEl.value = zoom.toString();
    this.zoomBadgeEl.textContent = `${zoom.toFixed(1)}x`;

    const hasVideo = state.videoFile !== null;
    this.jumpInBtn.disabled = !hasVideo;
    this.jumpOutBtn.disabled = !hasVideo;
    this.zoomSliderEl.disabled = !hasVideo;

    if (changedKey === 'duration' || changedKey === 'timelineZoom' || changedKey === 'videoFile' || !changedKey) {
      this.updateRuler(state.duration, zoom);
    }

    if (changedKey === 'thumbnails' || !changedKey) {
      this.thumbnailStripEl.innerHTML = '';
      for (const thumb of state.thumbnails) {
        const img = document.createElement('img');
        img.src = thumb.dataUrl;
        img.draggable = false;
        this.thumbnailStripEl.appendChild(img);
      }
    }

    // In, Out, Range の位置計算 (0% - 100%)
    const inPercent = (state.startTime / duration) * 100;
    const outPercent = (state.endTime / duration) * 100;
    const playheadPercent = (state.currentTime / duration) * 100;

    // ハンドルとハイライトの位置更新（In/Outともに中央線がパーセント位置と完全一致）
    this.inHandleEl.style.left = `${inPercent}%`;
    this.outHandleEl.style.left = `${outPercent}%`;

    this.rangeHighlightEl.style.left = `${inPercent}%`;
    this.rangeHighlightEl.style.width = `${Math.max(0, outPercent - inPercent)}%`;

    if (state.isDurationLocked) {
      this.rangeHighlightEl.classList.add('locked');
      this.rangeHighlightEl.title = '時間ロック中: ドラッグでこの範囲のままスライド移動できます';
    } else {
      this.rangeHighlightEl.classList.remove('locked');
      this.rangeHighlightEl.title = 'ドラッグで選択範囲をスライド移動できます';
    }

    this.playheadEl.style.left = `${playheadPercent}%`;

    // 再生中の自動スクロール（ユーザーが手動スクロール中でない場合）
    if (state.isPlaying && !this.isUserScrolling && zoom > 1.0) {
      this.scrollPlayheadIntoView();
    }
  }
}
