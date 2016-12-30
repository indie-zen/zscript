#!/bin/bash
pushd ..
gulp build
popd
node ../dist/zscript/main.js onetest.zs ./test.js
