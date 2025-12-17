#!/usr/bin/zsh

port=8080

# Start the app in its docker container
container_name='md2pdf-server'

id=$(docker ps | grep $container_name | awk '{ print $1 }')

if [ -z "$id" ]; then
  echo "Building docker container: $container_name"
  docker build -t "$container_name" "$HOME/workspace/md2pdf"
fi

docker run --rm -d -p $port:$port "$container_name"
