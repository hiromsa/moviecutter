# 動画処理エンジン仕様書 (Video Engine Specification)

## 1. 動画切り取り (Trimming / Cutting)
- **エンジン**: FFmpeg.wasm (`@ffmpeg/ffmpeg`)
- **切り出しコマンド**:
  ```bash
  ffmpeg -ss <startTime> -to <endTime> -i <inputName> -c copy -avoid_negative_ts make_zero <outputName>
  ```
  ※ `-c copy` により再エンコード（デコード＆エンコード）をスキップし、キーフレーム単位の超高速ストリームコピーを実現。
  ※ 精密な切り取りを要する場合のオプション（再エンコードモード）も将来的に拡張可能な設計とする。

## 2. フレームキャプチャ (Frame Capture)
- HTML5 Canvas を使用して、指定タイムスタンプの `<video>` フレームをネイティブGPUデコードから直接PNG/JPEGとして取得。
- AI生成（Image-to-Video / 続きの動画生成）での利用を考慮し、最高解像度（動画本来の幅・高さ）でロスレスPNG保存をサポート。
- 最終フレーム（Last Frame）ワンクリック抽出機能を提供。

## 3. タイムラインサムネイル (Timeline Thumbnails)
- 動画読み込み時、バックグラウンドの非表示ビデオ/オフスクリーンCanvasを用いて、動画全体から一定間隔（例: 10〜20枚）のサムネイルを軽量プレビュー用に生成し、タイムラインに並べる。
