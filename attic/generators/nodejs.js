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

    var test = new gutil.Test('test');

    test.cached(1, 2, 3);
    test.cached(1, 1, 1);

    var test2 = new gutil.Test('test2');

    test2.cachedWithParms(2, 3, 4);
    test2.cachedWithParms(1, 1, 1);
  }
}
