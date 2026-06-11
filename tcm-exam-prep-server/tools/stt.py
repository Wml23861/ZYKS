"""
语音转文字脚本 — 使用 faster-whisper (CTranslate2)
替代 whisper.cpp，CPU 推理快 2-4 倍

用法:
  python stt.py --audio <音频文件> --model <模型名> --output <输出JSON> [--language zh]
"""
import argparse
import json
import sys
import time
import os

def format_time(seconds: float) -> str:
    """秒数转 HH:MM:SS 格式"""
    h = int(seconds // 3600)
    m = int((seconds % 3600) // 60)
    s = int(seconds % 60)
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"

def main():
    parser = argparse.ArgumentParser(description="faster-whisper STT")
    parser.add_argument("--audio", required=True, help="输入音频文件路径")
    parser.add_argument("--model", default="large-v3", help="Whisper 模型名 (tiny/base/small/medium/large-v3)")
    parser.add_argument("--output", required=True, help="输出 JSON 文件路径")
    parser.add_argument("--language", default="zh", help="语言代码")
    parser.add_argument("--device", default="cpu", help="计算设备 (cpu/cuda)")
    parser.add_argument("--compute_type", default="int8", help="推理精度 (int8/float16/float32)")
    parser.add_argument("--threads", type=int, default=0, help="CPU 线程数 (0=自动)")
    parser.add_argument("--no-vad", action="store_true", help="禁用 VAD 加速处理")
    args = parser.parse_args()

    cpu_threads = args.threads or os.cpu_count() or 4
    num_workers = max(1, cpu_threads // 2)

    if not os.path.exists(args.audio):
        print(f"错误: 音频文件不存在: {args.audio}", file=sys.stderr)
        sys.exit(1)

    print(f"[STT] 加载模型: {args.model} (device={args.device}, compute_type={args.compute_type}, threads={cpu_threads})", file=sys.stderr)

    from faster_whisper import WhisperModel

    try:
        model = WhisperModel(
            args.model,
            device=args.device,
            compute_type=args.compute_type,
            cpu_threads=cpu_threads,
            num_workers=num_workers,
            download_root=os.path.join(os.path.dirname(os.path.abspath(__file__)), "faster-whisper-models"),
        )
    except Exception as e:
        print(f"[STT] 模型加载失败: {e}", file=sys.stderr)
        print(f"[STT] 提示: 首次使用会从 HuggingFace 下载模型，请确保网络通畅", file=sys.stderr)
        sys.exit(1)

    print(f"[STT] 开始转写: {args.audio}", file=sys.stderr)

    start_time = time.time()

    try:
        transcribe_opts = {
            "language": args.language,
            "beam_size": 5,
            "best_of": 5,
        }
        if not args.no_vad:
            transcribe_opts["vad_filter"] = True
            transcribe_opts["vad_parameters"] = dict(min_silence_duration_ms=500)

        segments_result, info = model.transcribe(args.audio, **transcribe_opts)

        print(f"[STT] 检测到语言: {info.language} (概率: {info.language_probability:.2f})", file=sys.stderr)
        print(f"[STT] 音频时长: {info.duration:.0f} 秒", file=sys.stderr)

        segments = []
        total_text = ""
        for seg in segments_result:
            segments.append({
                "start": round(seg.start),
                "end": round(seg.end),
                "text": seg.text.strip(),
            })
            total_text += seg.text
            # 输出进度
            elapsed = time.time() - start_time
            progress_pct = min(99, round(seg.end / info.duration * 100))
            print(f"[STT] 进度 {progress_pct}% | {format_time(seg.end)} / {format_time(info.duration)}", file=sys.stderr)

        elapsed = time.time() - start_time
        rtf = elapsed / info.duration if info.duration > 0 else 0
        print(f"[STT] 转写完成! {len(segments)} 个分段, 耗时 {elapsed:.0f}秒, RTF={rtf:.2f}x", file=sys.stderr)

        # 输出为 whisper.cpp 兼容 JSON 格式
        result = {
            "transcription": segments,
            "info": {
                "language": info.language,
                "duration": info.duration,
                "rtf": round(rtf, 2),
            },
        }

        output_dir = os.path.dirname(args.output)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)

        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print(f"[STT] 输出已保存: {args.output}", file=sys.stderr)

    except Exception as e:
        print(f"[STT] 转写失败: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
