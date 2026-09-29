import './styles/main.css';
import { AppState } from './state/AppState';
import { FFmpegEngine } from './core/FFmpegEngine';
import { Header } from './ui/Header';
import { VideoPlayer } from './ui/VideoPlayer';
import { Timeline } from './ui/Timeline';
import { Controls } from './ui/Controls';
import { ExportPanel } from './ui/ExportPanel';
import { StatusBar } from './ui/StatusBar';
import { HelpModal } from './ui/HelpModal';

class MovieCutterApp {
  private appEl: HTMLElement;
  private appState: AppState;
  private ffmpegEngine: FFmpegEngine;
  private fileInput: HTMLInputElement;

  private header!: Header;
  private videoPlayer!: VideoPlayer;
  private timeline!: Timeline;
  private controls!: Controls;
  private exportPanel!: ExportPanel;
  private statusBar!: StatusBar;
  private helpModal!: HelpModal;

  constructor() {
    this.appEl = document.getElementById('app') || document.body;
    this.appState = AppState.getInstance();
    this.ffmpegEngine = FFmpegEngine.getInstance();

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'video/*,audio/*,image/*';
    this.fileInput.style.display = 'none';
    document.body.appendChild(this.fileInput);

    this.initUI();
    this.initEvents();
    this.initFFmpeg();
  }

  private initUI(): void {
    this.helpModal = new HelpModal();

    this.header = new Header({
      onOpenHelp: () => this.helpModal.open(),
      onSelectFile: () => this.triggerFileInput(),
    });

    this.videoPlayer = new VideoPlayer({
      onSelectFile: () => this.triggerFileInput(),
    });

    this.timeline = new Timeline();
    this.controls = new Controls();

    this.exportPanel = new ExportPanel({
      getVideoElement: () => this.videoPlayer.getVideoElement(),
    });

    this.statusBar = new StatusBar();

    // DOMへの追加
    this.appEl.appendChild(this.header.getElement());

    const workspace = document.createElement('main');
    workspace.className = 'main-workspace';
    workspace.appendChild(this.videoPlayer.getElement());
    workspace.appendChild(this.timeline.getElement());
    workspace.appendChild(this.controls.getElement());
    workspace.appendChild(this.exportPanel.getElement());

    this.appEl.appendChild(workspace);
    this.appEl.appendChild(this.statusBar.getElement());
    document.body.appendChild(this.helpModal.getElement());
  }

  private initEvents(): void {
    this.fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        this.videoPlayer.loadMediaFile(target.files[0]);
      }
    });
  }

  private triggerFileInput(): void {
    this.fileInput.value = '';
    this.fileInput.click();
  }

  private async initFFmpeg(): Promise<void> {
    try {
      this.appState.setFFmpegStatus('loading', 'FFmpegエンジンを準備中...');
      await this.ffmpegEngine.load();
      this.appState.setFFmpegStatus('ready', '準備完了！動画を選択してください。');
    } catch (err: any) {
      console.warn('FFmpeg lazy load failed or postponed:', err);
      this.appState.setFFmpegStatus(
        'error',
        'FFmpegの読み込みに失敗しました（初回保存時に再試行します）'
      );
    }
  }
}

// アプリケーション初期化
window.addEventListener('DOMContentLoaded', () => {
  new MovieCutterApp();
});
