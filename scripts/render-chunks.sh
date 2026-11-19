#!/usr/bin/env bash
# Resumable HQ final render in chunks (post-fx episodes take ~7.5 s/frame here, i.e. hours).
#   bash scripts/render-chunks.sh <CompositionId> <slug> <totalFrames> [maxChunksThisRun]
# Needs `build/` (npx remotion bundle src/index.ts --out-dir=build) and a finished preview render
# out/<slug>-preview.mp4, whose audio track is reused (same composition, same mix).
# Each 240-frame chunk lands in out/<slug>-parts/part-NN.mp4; re-run to resume, finished chunks are
# skipped. Pass maxChunksThisRun (e.g. 3 ≈ 90 min) to keep one run inside a 2 h background job.
# When every chunk exists it joins them and writes out/<slug>-final.mp4.
set -u
cd "$(dirname "$0")/.."
ID=$1; SLUG=$2; TOTAL=$3; MAX=${4:-99}
CHUNK=240
PARTS=out/$SLUG-parts
AUDIO=out/$SLUG-preview.mp4
LOG=$PARTS/progress.log
mkdir -p "$PARTS"
done_now=0
i=0
for ((s = 0; s < TOTAL; s += CHUNK)); do
  e=$((s + CHUNK - 1)); [ $e -ge $TOTAL ] && e=$((TOTAL - 1))
  part=$(printf "%s/part-%02d.mp4" "$PARTS" $i)
  if [ ! -s "$part" ]; then
    if [ $done_now -ge $MAX ]; then echo "paused after $done_now chunks $(date +%T)" | tee -a "$LOG"; exit 0; fi
    echo "chunk $i ($s-$e) start $(date +%T)" | tee -a "$LOG"
    # --timeout: four HQ tabs warming up at once can stall the first frame past the 30 s default.
    if npx remotion render build "$ID" "$PARTS/tmp.mp4" --gl=swangle --props='{"hq":true}' --concurrency=4 \
        --crf=15 --jpeg-quality=95 --frames=$s-$e --muted --timeout=180000 > "$PARTS/render.log" 2>&1; then
      mv "$PARTS/tmp.mp4" "$part"; done_now=$((done_now + 1))
      echo "chunk $i done $(date +%T)" | tee -a "$LOG"
    else
      echo "chunk $i FAILED" | tee -a "$LOG"; tail -5 "$PARTS/render.log" | tee -a "$LOG"; exit 1
    fi
  fi
  i=$((i + 1))
done

ls "$PARTS"/part-*.mp4 | sed "s|^$PARTS/|file '|; s|$|'|" > "$PARTS/list.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$PARTS/list.txt" -c copy "$PARTS/video.mp4" \
  && ffmpeg -v error -y -i "$PARTS/video.mp4" -i "$AUDIO" -map 0:v -map 1:a -c copy -shortest "out/$SLUG-final.mp4" \
  && echo "ALL DONE $(date +%T) -> out/$SLUG-final.mp4" | tee -a "$LOG" || { echo "join FAILED" | tee -a "$LOG"; exit 1; }
