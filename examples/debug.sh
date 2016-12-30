#!/bin/bash
pushd ..
gulp build
popd
node ../dist/zscript/main.js debug.zs ./test.js
