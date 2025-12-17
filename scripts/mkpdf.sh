#!/usr/bin/zsh

md_file_path=$(realpath $1)
pdf_output_dir=$(realpath $2)
pdf_title=$3

base_dir=$(cd $(dirname $0) && pwd) # base dir of this script
css_path=$MD2PDF_CSS_PATH
port=8080

if [ -z "$1" ]; then
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
  local input_file="$1"
  local output_dir="$2"
  local title="$3"
  local css=""
  if [ -e "$css_path" ]; then
    css=$(cat "$css_path")
  else
    echo "CSS file was not found."
  fi

  if [ -z $title ]; then
    title="$(basename -s .md $input_file)"
  fi

  local titleSlug=$(echo "$title" | sed 's/ /_/g')

  local output_file="$output_dir/$titleSlug".pdf

  echo "output_dir: $output_dir"

  local md=$(cat $input_file)

  curl -X POST http://localhost:$port/convert \
    -H "Content-Type: application/json" \
    --data-binary "$(
  jq -n \
    --arg markdown "$md" \
    --arg title "$title" \
    --arg css "$css" \
    '{ markdown: $markdown, title: $title, css: $css }'
  )" \
  -o "$output_file"

  echo "$output_file"
}

# Start to build pdf
makePdf $md_file_path $pdf_output_dir $pdf_title 

