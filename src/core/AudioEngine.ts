/**
 * Web Audio API を用いた音声波形（ピークデータ）の高速抽出エンジン
 * 外部ライブラリ不要で、ブラウザネイティブの高速C++デコーダを活用
 */

export class AudioEngine {
  private static audioCtx: AudioContext | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    return this.audioCtx;
  }

  /**
   * 動画ファイルから音声波形ピーク値（0.0 〜 1.0）の配列を抽出
   * @param file 対象の動画ファイル
   * @param targetSamples タイムライン用のサンプル数（デフォルト 1200点）
   */
  public static async extractPeaks(file: File, targetSamples: number = 1200): Promise<number[]> {
    try {
      // ファイルのArrayBufferを取得
      const arrayBuffer = await file.arrayBuffer();

      // AudioContextでデコード
      const audioCtx = this.getAudioContext();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }

      // decodeAudioData は ArrayBuffer を消費（detach）する場合があるため slice して渡す
      const bufferCopy = arrayBuffer.slice(0);
      const audioBuffer = await audioCtx.decodeAudioData(bufferCopy);

      const channelCount = audioBuffer.numberOfChannels;
      if (channelCount === 0) return [];

      // チャンネル0（左またはモノラル）のPCMデータを取得
      const channelData = audioBuffer.getChannelData(0);
      const totalLength = channelData.length;
      if (totalLength === 0) return [];

      const blockSize = Math.floor(totalLength / targetSamples);
      if (blockSize <= 0) return [];

      const peaks: number[] = new Array(targetSamples);
      let maxPeak = 0.001;

      for (let i = 0; i < targetSamples; i++) {
        const start = i * blockSize;
        const end = Math.min(start + blockSize, totalLength);

        // ブロック内の最大振幅を探索
        let peak = 0;
        // サンプリングステップ（パフォーマンスのため16サンプルごとにチェック）
        const step = Math.max(1, Math.floor(blockSize / 32));
        for (let j = start; j < end; j += step) {
          const val = Math.abs(channelData[j]);
          if (val > peak) peak = val;
        }

        peaks[i] = peak;
        if (peak > maxPeak) {
          maxPeak = peak;
        }
      }

      // 振幅の最大値に合わせて視認しやすいよう適度にノーマライズ (0.05 〜 1.0)
      const normFactor = 1.0 / maxPeak;
      for (let i = 0; i < targetSamples; i++) {
        peaks[i] = Math.min(1.0, peaks[i] * normFactor);
      }

      return peaks;
    } catch (err) {
      // 音声ストリームが存在しない動画や、非対応形式の場合は安全に空配列を返す
      console.warn('Audio waveform extraction skipped or not available for this file:', err);
      return [];
    }
  }
}
