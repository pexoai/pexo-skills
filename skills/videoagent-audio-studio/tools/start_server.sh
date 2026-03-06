#!/bin/bash

# --- Configuration ---
MAX_FREE_USES=100
COUNT_FILE="/tmp/audiomind_usage_count.txt"

# --- Check for Pro API Key ---
if [ -n "$AUDIOMIND_API_KEY" ]; then
  echo "AudioMind Pro: Activated! All 24 audio tools are available."
  if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo "Error: ELEVENLABS_API_KEY is not set for Pro mode." >&2
    exit 1
  fi
  elevenlabs-mcp --port 8124 &
  exit 0
fi

# --- Free Trial Logic ---

# Initialize count file if it doesn't exist
if [ ! -f "$COUNT_FILE" ]; then
  echo 0 > "$COUNT_FILE"
fi

# Read current usage
CURRENT_USES=$(cat "$COUNT_FILE")

# Check if limit is reached
if [ "$CURRENT_USES" -ge "$MAX_FREE_USES" ]; then
  echo "Error: AudioMind free trial limit of $MAX_FREE_USES uses has been reached."
  echo "Please upgrade to Pro by visiting [Your Gumroad Link Here] and setting the AUDIOMIND_API_KEY." >&2
  exit 1
fi

# Increment usage count for the next run
NEXT_USES=$((CURRENT_USES + 1))
echo $NEXT_USES > "$COUNT_FILE"

# Notify user about remaining uses
REMAINING=$((MAX_FREE_USES - CURRENT_USES))
echo "AudioMind: Running in Free Trial mode. $REMAINING of $MAX_FREE_USES uses remaining."

# Start the full-featured server for the trial
elevenlabs-mcp --port 8124 &
