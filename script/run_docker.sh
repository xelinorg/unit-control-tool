#!/usr/bin/env bash

docker run -d \
  --mount type=bind,src="$(pwd)/build/config.json",dst=/docker-entrypoint.d/config.json \
  -p 36936-36963:36936-36963 \
  --env UCT_MODE=unit-http  unit-control-tool
