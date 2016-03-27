#!/bin/bash
gulp build
node dist/zscript/main.js test.zs ./test.js
