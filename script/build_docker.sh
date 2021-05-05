#!/usr/bin/env bash

BUILD_DIR=build
rm -rf $BUILD_DIR
mkdir $BUILD_DIR
cp -r container/* build/
cp src/index.js build/unit-control-tool
cp package.json build/unit-control-tool
cd $BUILD_DIR

docker build --tag=unit-control-tool .
