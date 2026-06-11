"""
视频关键帧抽取脚本
用 ffmpeg 每 N 秒抽一帧 → 感知哈希去重 → 输出唯一帧列表

用法:
  python extract_frames.py --video <视频路径> --output <输出目录> [--interval 3] [--threshold 8]
"""
import argparse
import json
import os
import subprocess
import sys
import tempfile


def dhash(image_path: str, hash_size: int = 8) -> str:
    """计算图像的感知哈希（dhash），用于去重"""
    try:
        from PIL import Image
    except ImportError:
        print("[FRAMES] PIL 未安装，跳过哈希去重", file=sys.stderr)
        return "no_pil"

    img = Image.open(image_path).convert("L")
    img = img.resize((hash_size + 1, hash_size), Image.LANCZOS)

    diff = []
    for row in range(hash_size):
        for col in range(hash_size):
            left = img.getpixel((col, row))
            right = img.getpixel((col + 1, row))
            diff.append("1" if left > right else "0")

    return "".join(diff)


def hamming_distance(h1: str, h2: str) -> int:
    """两个哈希串的汉明距离"""
    if len(h1) != len(h2):
        return 999
    return sum(c1 != c2 for c1, c2 in zip(h1, h2))


def main():
    parser = argparse.ArgumentParser(description="关键帧抽取")
    parser.add_argument("--video", required=True, help="输入视频路径")
    parser.add_argument("--output", required=True, help="输出 JSON 文件路径")
    parser.add_argument("--interval", type=float, default=3, help="抽帧间隔（秒），默认 3")
    parser.add_argument("--threshold", type=int, default=8, help="哈希去重阈值，默认 8")
    args = parser.parse_args()

    if not os.path.exists(args.video):
        print(f"[FRAMES] 错误: 视频不存在: {args.video}", file=sys.stderr)
        sys.exit(1)

    # 创建临时目录
    frames_dir = args.output + ".frames"
    os.makedirs(frames_dir, exist_ok=True)

    # 用 ffmpeg 抽帧
    print(f"[FRAMES] 抽取帧中 (间隔 {args.interval}s)...", file=sys.stderr)

    cmd = [
        "ffmpeg", "-y",
        "-i", args.video,
        "-vf", f"fps=1/{args.interval}",
        "-q:v", "2",  # 高质量 JPEG
        "-progress", "pipe:1",
        "-nostats",
        os.path.join(frames_dir, "frame_%06d.jpg"),
    ]

    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
        text=True,
    )

    total_frames = 0
    for line in proc.stdout:
        line = line.strip()
        if line.startswith("frame="):
            total_frames = int(line.split("=")[1])
            print(f"[FRAMES] 已抽取 {total_frames} 帧...", file=sys.stderr)

    proc.wait()

    if proc.returncode != 0:
        print(f"[FRAMES] ffmpeg 错误 (exit {proc.returncode})", file=sys.stderr)
        sys.exit(1)

    # 去重
    frame_files = sorted([
        f for f in os.listdir(frames_dir) if f.endswith(".jpg")
    ])

    if not frame_files:
        print("[FRAMES] 未抽取到任何帧", file=sys.stderr)
        result = {"frames": [], "count": 0}
        with open(args.output, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False)
        print(f"[FRAMES] 输出已保存: {args.output}", file=sys.stderr)
        return

    print(f"[FRAMES] 去重中 ({len(frame_files)} 帧)...", file=sys.stderr)

    unique_frames = []
    seen_hashes = []

    for i, fname in enumerate(frame_files):
        fpath = os.path.join(frames_dir, fname)
        h = dhash(fpath)

        if h == "no_pil":
            # 无法计算哈希，全部保留
            t = i * args.interval
            unique_frames.append({"file": fpath, "time": t})
            continue

        is_dup = False
        for seen in seen_hashes:
            if hamming_distance(h, seen) <= args.threshold:
                is_dup = True
                break

        if not is_dup:
            seen_hashes.append(h)
            t = i * args.interval
            unique_frames.append({"file": fpath, "time": t})
        else:
            # 删除重复帧
            try:
                os.remove(fpath)
            except OSError:
                pass

        if (i + 1) % 50 == 0 or i == len(frame_files) - 1:
            print(f"[FRAMES] 去重进度 {i+1}/{len(frame_files)} (保留 {len(unique_frames)})", file=sys.stderr)

    result = {
        "frames": unique_frames,
        "count": len(unique_frames),
        "total_extracted": total_frames,
    }

    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False)

    print(f"[FRAMES] 完成! 保留 {len(unique_frames)}/{total_frames} 帧", file=sys.stderr)
    print(f"[FRAMES] 输出: {args.output}", file=sys.stderr)


if __name__ == "__main__":
    main()
