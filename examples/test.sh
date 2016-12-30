#!/bin/bash
pushd ..
gulp build
popd
node ../dist/zscript/main.js test.zs ./test.js
