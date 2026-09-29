import { AppState, AppStateData } from '../state/AppState';
import { VideoEngine } from '../core/VideoEngine';

export class Timeline {
  private container: HTMLElement;
  private rulerEl: HTMLElement;
  private trackEl: HTMLElement;
  private thumbnailStripEl: HTMLElement;
  private rangeHighlightEl: HTMLElement;
  private inHandleEl: HTMLElement;
  private outHandleEl: HTMLElement;
  private playheadEl: HTMLElement;
  private appState: AppState;

  private isDraggingIn = false;
  private isDraggingOut = false;
  private isDraggingPlayhead = false;

  constructor() {
    this.appState = AppState.getInstance();

    this.container = document.createElement('div');
    this.container.className = 'timeline-card';

    this.rulerEl = document.createElement('div');
    this.rulerEl.className = 'timeline-ruler';

    this.trackEl = document.createElement('div');
    this.trackEl.className = 'timeline-track-container';

    this.thumbnailStripEl = document.createElement('div');
    this.thumbnailStripEl.className = 'thumbnail-strip';

    this.rangeHighlightEl = document.createElement('div');
    this.rangeHighlightEl.className = 'timeline-range-highlight';

    this.inHandleEl = document.createElement('div');
    this.inHandleEl.className = 'timeline-handle timeline-handle-in';
    this.inHandleEl.title = '開始点 (In)';

    this.outHandleEl = document.createElement('div');
    this.outHandleEl.className = 'timeline-handle timeline-handle-out';
    this.outHandleEl.title = '終了点 (Out)';

    this.playheadEl = document.createElement('div');
    this.playheadEl.className = 'timeline-playhead';
    this.playheadEl.innerHTML = '<div class="playhead-head"></div>';

    this.init();
  }

  public getElement(): HTMLElement {
    return this.container;
  }

  private init(): void {
    this.trackEl.appendChild(this.thumbnailStripEl);
    this.trackEl.appendChild(this.rangeHighlightEl);
    this.trackEl.appendChild(this.inHandleEl);
    this.trackEl.appendChild(this.outHandleEl);
    this.trackEl.appendChild(this.playheadEl);

    this.container.appendChild(this.rulerEl);
    this.container.appendChild(this.trackEl);

    this.setupEvents();
    this.appState.subscribe((state, key) => this.onStateChange(state, key));
  }

  private setupEvents(): void {
    // タイムラインクリックでシーク
    this.trackEl.addEventListener('mousedown', (e) => {
      if (e.target === this.inHandleEl || e.target === this.outHandleEl) return;
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
    });

    // Inハンドル ドラッグ
    this.inHandleEl.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.isDraggingIn = true;

      const onMouseMove = (moveEvt: MouseEvent) => {
        if (this.isDraggingIn) {
          const time = this.getTimeFromMouseEvent(moveEvt);
          this.appState.setStartTime(time);
          this.appState.setCurrentTime(time);
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

    // Outハンドル ドラッグ
    this.outHandleEl.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      this.isDraggingOut = true;

      const onMouseMove = (moveEvt: MouseEvent) => {
        if (this.isDraggingOut) {
          const time = this.getTimeFromMouseEvent(moveEvt);
          this.appState.setEndTime(time);
          this.appState.setCurrentTime(time);
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

  private updateRuler(duration: number): void {
    this.rulerEl.innerHTML = '';
    if (duration <= 0) return;

    // ルーラー目盛りの計算（約6〜10分割）
    const ticksCount = 8;
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

    if (changedKey === 'duration' || changedKey === 'videoFile' || !changedKey) {
      this.updateRuler(state.duration);
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

    this.inHandleEl.style.left = `${inPercent}%`;
    this.outHandleEl.style.left = `${outPercent}%`;

    this.rangeHighlightEl.style.left = `${inPercent}%`;
    this.rangeHighlightEl.style.width = `${Math.max(0, outPercent - inPercent)}%`;

    this.playheadEl.style.left = `${playheadPercent}%`;
  }
}
