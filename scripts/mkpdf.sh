#!/usr/bin/zsh

base_dir=$(cd $(dirname $0) && pwd) # base dir of this script
port=8080

# The 'getopt' command is used with command substitution $(...) to reformat arguments.
# Short options string "ab:h"
# Long options string "alpha,bravo:,help" (colon indicates required argument)
parsed_args=$(getopt -n $0 -o f:t:o:s:h --long file:,title:,output-dir:,styles:,help -- "$@")
valid_args=$?
if [ "$valid_args" != "0" ]; then
  exit 1
fi

# The reformatted arguments are assigned back to the positional parameters
eval set -- "$parsed_args"

while :
do
  case "$1" in
    -f | --file)
      md_file_path=$(realpath "$2")
      shift 2
      ;;
    -t | --title)
      pdf_title="$2"
      shift 2
      ;;
    -o | --output-dir)
      pdf_output_dir=$(realpath "$2")
      shift 2
      ;;
    -s | --styles)
      css_path=$(realpath "$2")
      shift 2
      ;;
    -h | --help)
      echo "md2pdf"
      shift
      ;;
    --) shift; break ;; # End of all options
    *) echo "Internal error!" ; exit 1 ;;
  esac
done

# Access non-option arguments here
for param in "$@"; do
    echo "Remaining parameter: $param"
done

# Check connection to service...
curl -o - -s -I http://localhost:$port > /dev/null

if [ "$?" -eq 7 ]; then
  # Curl error: Cannot connect to localhost.

  # Start the app in its docker container
  echo "Starting md2pdf-server..."

  container_name='md2pdf-server'

  id=$(docker ps | grep $container_name | awk '{ print $1 }')

  if [ -z "$id" ]; then
    echo "Building docker container: $container_name"
    dockerfile_dir="$(dirname $(dirname $(readlink -f $0)))"

    docker build -t "$container_name" "$dockerfile_dir"
  fi

  docker run --rm -d -p $port:$port "$container_name"

  sleep 3 # Wait for server to start before connecting...
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

