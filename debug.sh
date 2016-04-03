#!/bin/bash
gulp build
node dist/zscript/main.js debug.zs ./test.js
