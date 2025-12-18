#!/usr/bin/zsh

base_dir=$(cd $(dirname $0) && pwd) # base dir of this script
port=8080

OUTPUT=""

# Helpers
is_dir() { [ -d "$1" ]; }
is_file() { [ -f "$1" ]; }

# ----------------------------
# Usage
# ----------------------------
usage() {
  cat <<'EOF'
mkpdf — render Markdown to PDF (HTML/CSS via headless Chromium)

USAGE
  mkpdf [OPTIONS] <input>
  mkpdf <input> --css <file>
  mkpdf <input> --output <file|dir>

INPUT
  <input>: a Markdown file path (README.md)

OUTPUT
  Default: <input-basename>.pdf in the current directory
  Override: -o, --output <file|dir>

OPTIONS (render)
  -o, --output <path|dir|->
  -t, --title <string>            Title (default: filename)

STYLING
  --css <file>                    Stylesheet (not repeatable)

GENERAL
  -h, --help                      Show this help

EOF
}

# The 'getopt' command is used with command substitution $(...) to reformat arguments.
parsed_args=$(getopt -n $0 -o t:o:S:h --long title:,output:,css:,help -- "$@")
valid_args=$?
if [ "$valid_args" != "0" ]; then
  exit 1
fi

# The reformatted arguments are assigned back to the positional parameters
eval set -- "$parsed_args"

while :
do
  case "$1" in
    -t | --title)
      pdf_title="$2"
      shift 2
      ;;
    -o | --output)
      OUTPUT=$(realpath "$2")
      shift 2
      ;;
    -S | --css)
      css_path=$(realpath "$2")
      shift 2
      ;;
    -h | --help)
      usage
      shift
      ;;
    --) shift; break ;; # End of all options
    *) echo "Internal error!" ; exit 1 ;;
  esac
done

if [ "$#" -eq 0 ]; then
  usage
  exit 1
fi

if [ "$#" -gt 0 ]; then
  md_file_path=$(realpath "$1"); shift
fi

if [ "$#" -gt 0 ]; then
  echo "unexpected extra arguments: $*"
  exit 1
fi

# Check connection to service...
curl -o - -s -I http://localhost:$port > /dev/null

if [ "$?" -eq 7 ]; then
  # Curl error: Cannot connect to localhost.

  # Start the app in its docker container
  echo "Starting mkpdf-server..."

  container_name='mkpdf-server'

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
  local output_file="$2"
  local title="$3"
  local css=""
  if [ -e "$css_path" ]; then
    css=$(cat "$css_path")
  fi

  if [ -z $title ]; then
    title="$(basename -s .md $input_file)"
  fi

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

if [ -z $md_file_path ]; then
  echo "No input file path found."
  exit 1
fi


set_output() {
  local out=$OUTPUT

  local in_file=$md_file_path
  local in_dir="$(dirname $in_file)"
  local in_base="$(basename $in_file)"
  local in_stem="${in_base%.*}"

  # is 'out' an empty string?
  if [ -z $out ]; then
    OUTPUT="$in_dir/${in_stem}.pdf"
    return 0
  fi

  # is 'out' a directory?
  if is_dir "$out"; then
    OUTPUT="$out/${in_stem}.pdf"
    return 0
  fi

  # ensure that '.pdf' extension exists
  o_base="$(basename $out)"
  OUTPUT="$(dirname $out)/${o_base%.*}.pdf"
}

# Set output path
set_output

# Start to build pdf
makePdf $md_file_path $OUTPUT $pdf_title

