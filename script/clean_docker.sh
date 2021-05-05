#!/usr/bin/env bash

docker kill $(docker ps -a -q  --filter ancestor=unit-control-tool)
docker container prune
docker image prune
