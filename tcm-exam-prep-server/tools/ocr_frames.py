"""
视频帧 OCR 文字识别脚本
使用 PaddleOCR 逐帧识别中文 → 合并去重 → 输出信息稿

用法:
  python ocr_frames.py --frames <帧JSON> --output <输出文本路径>
"""
import argparse
import json
import os
import sys
import time


def merge_texts(entries: list) -> str:
    """合并 OCR 结果，去重相似行，生成信息稿"""
    seen = set()
    lines = []
    for entry in entries:
        text = entry["text"].strip()
        if not text or len(text) < 2:
            continue
        # 去重
        key = text[:20] if len(text) > 20 else text
        if key in seen:
            continue
        seen.add(key)
        lines.append(f"[{format_time(entry['time'])}] {text}")
    return "\n".join(lines)


def format_time(seconds: float) -> str:
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m}:{s:02d}"


def main():
    parser = argparse.ArgumentParser(description="视频帧 OCR")
    parser.add_argument("--frames", required=True, help="extract_frames.py 输出的 JSON 文件")
    parser.add_argument("--output", required=True, help="输出信息稿文本路径")
    parser.add_argument("--lang", default="ch", help="OCR 语言 (ch/en)")
    args = parser.parse_args()

    if not os.path.exists(args.frames):
        print(f"[OCR] 错误: 帧文件不存在: {args.frames}", file=sys.stderr)
        sys.exit(1)

    with open(args.frames, "r", encoding="utf-8") as f:
        data = json.load(f)

    frames = data.get("frames", [])
    if not frames:
        print("[OCR] 没有帧需要识别", file=sys.stderr)
        with open(args.output, "w", encoding="utf-8") as f:
            f.write("")
        return

    print(f"[OCR] 加载 PaddleOCR (首次运行会下载模型)...", file=sys.stderr)

    try:
        from paddleocr import PaddleOCR
    except ImportError:
        print("[OCR] PaddleOCR 未安装! 请运行: pip install paddleocr", file=sys.stderr)
        sys.exit(1)

    try:
        ocr = PaddleOCR(lang=args.lang, use_angle_cls=True, show_log=False)
    except Exception as e:
        print(f"[OCR] PaddleOCR 初始化失败: {e}", file=sys.stderr)
        sys.exit(1)

    print(f"[OCR] 开始识别 {len(frames)} 帧...", file=sys.stderr)
    start_time = time.time()

    results = []
    for i, frame in enumerate(frames):
        fpath = frame["file"]
        t = frame["time"]

        if not os.path.exists(fpath):
            continue

        try:
            ocr_result = ocr.ocr(fpath, cls=True)
        except Exception as e:
            print(f"[OCR] 帧 {i+1} 识别失败: {e}", file=sys.stderr)
            continue

        if not ocr_result or not ocr_result[0]:
            continue

        text_parts = []
        for line in ocr_result[0]:
            if line and len(line) >= 2:
                text_parts.append(line[1][0])

        text = " ".join(text_parts).strip()
        if text:
            results.append({"time": t, "text": text})

        # 进度
        if (i + 1) % 20 == 0 or i == len(frames) - 1:
            elapsed = time.time() - start_time
            pct = round((i + 1) / len(frames) * 100)
            print(f"[OCR] 进度 {pct}% | {i+1}/{len(frames)} 帧, 已识别 {len(results)} 段文字, 耗时 {elapsed:.0f}s", file=sys.stderr)

    info_draft = merge_texts(results)

    output_dir = os.path.dirname(args.output)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    with open(args.output, "w", encoding="utf-8") as f:
        f.write(info_draft)

    elapsed = time.time() - start_time
    print(f"[OCR] 完成! {len(results)} 段文字, 耗时 {elapsed:.0f}s", file=sys.stderr)
    print(f"[OCR] 输出: {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
