#!/bin/bash
pushd ..
gulp build
popd
node ../dist/zscript/main.js simple.zs ./test.js
