var fs = require('fs');
var path = require('path');

import * as gutil from '../gen_utils.js';

export default class NodeJSGenerator {
  constructor() {
    this.root = './gen';
  }

  generate() {
    var fileName = path.join(this.root, 'hello.js');
    var fd = fs.openSync(fileName, 'w')
    fs.writeFileSync(fd,
'console.log("Hello, world!");\n'
    );
    fs.closeSync(fd);

    var test = new gutil.Test;
    test.cached();
    test.cached();

    test.cached2(1, 2, 3);
    test.cached2(1, 1, 1);
  }
}
