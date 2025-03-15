#!/bin/bash

# Check if a file was provided
if [ -z "$1" ]; then
  echo "Usage: $0 <mkv_file>"
  exit 1
fi

MKV_FILE="$1"
OUTPUT_DIR="subtitles"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Get the base filename without extension
FILENAME=$(basename "$MKV_FILE" .mkv)

# Extract subtitle tracks
echo "Extracting subtitles from $MKV_FILE..."

# Get list of subtitle tracks
TRACKS=$(ffprobe -v error -select_streams s -show_entries stream=index:stream_tags=language,title -of csv=p=0 "$MKV_FILE")

# Extract each subtitle track
echo "$TRACKS" | while IFS="," read -r index language title; do
  if [ -n "$index" ]; then
    # Clean up the title for filename
    clean_title=$(echo "$title" | tr -cd '[:alnum:]._-' | tr '[:upper:]' '[:lower:]' || echo "track")
    output_file="$OUTPUT_DIR/${FILENAME}_${language}_${clean_title}.ass"
    
    echo "Extracting track $index ($language - $title) to $output_file"
    ffmpeg -i "$MKV_FILE" -map 0:$index -c:s copy "$output_file"
  fi
done

echo "Extraction complete. Subtitles saved to $OUTPUT_DIR/" 