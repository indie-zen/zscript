#!/bin/bash
gulp build
node dist/zscript/main.js simple.zs ./test.js
