#!/bin/bash
# Keep the dev server alive
while true; do
  if ! pgrep -f "next dev" > /dev/null 2>&1; then
    echo "$(date): Restarting dev server..." >> /home/z/my-project/dev.log
    cd /home/z/my-project && bun run dev >> /home/z/my-project/dev.log 2>&1 &
  fi
  sleep 15
done
