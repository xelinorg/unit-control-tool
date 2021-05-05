#!/usr/bin/env bash

docker ps -a -q  --filter ancestor=unit-control-tool
docker container prune
docker image prune
