#!/usr/bin/zsh

base_dir=$(cd $(dirname $0) && pwd) # base dir of this script
md_file_path=$1
pdf_title=$2
css_path=$MD2PDF_CSS_PATH
port=8080

if [ -z "$md_file_path" ]; then
  echo "mkpdf <markdown-file-path> [pdf-title]"
  exit 1
fi

# Check connection to service...
curl -o - -s -I http://localhost:$port > /dev/null

if [ "$?" -eq 7 ]; then
  echo "Starting md2pdf-server..."
  # Curl error: Cannot connect to localhost.
  $("$base_dir"/app_init.sh > /dev/null)

  sleep 2 # Wait for server to start before connecting...
fi

makePdf() {
  local md="$1"
  local title="$2"
  local css="$css_path"

  md_base_dir=$(cd $(dirname $0) && pwd) # base dir of the shell that called the script. But why?
  echo "Making pdf... $md"
  echo "Base dir: $base_dir"
  echo "makePdf Base dir: $md_base_dir"

  if [ -z $title ]; then
    title="$(basename -s .md $md)"
  fi

  local titleSlug=$(echo "$title" | sed 's/ /_/g')

  local output_dir="$md_base_dir/$(dirname $md)"
  local output_file="$output_dir/$titleSlug".pdf

  curl -X POST http://localhost:$port/convert \
    -H "Content-Type: application/json" \
    --data-binary "$(
  jq -n \
    --arg markdown "$(cat "$md")" \
    --arg title "$title" \
    --arg css "$(cat "$css")" \
    '{ markdown: $markdown, title: $title, css: $css }'
  )" \
  -o "$output_file"

  echo "$output_file"
}

# Start to build pdf
makePdf $md_file_path $pdf_title 

