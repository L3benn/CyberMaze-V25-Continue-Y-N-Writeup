#!/bin/bash

echo "Building CTF challenge..."

docker stop continueyorn 2>/dev/null || true
docker rm continueyorn 2>/dev/null || true

docker rmi continueyorn 2>/dev/null || true

docker build -t continueyorn .

echo "Starting container in foreground..."
docker run --name=continueyorn -p 4002:4002 continueyorn
