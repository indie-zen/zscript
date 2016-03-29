#!/bin/bash
gulp build
node dist/zscript/main.js onetest.zs ./test.js
