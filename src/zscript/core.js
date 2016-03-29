

// String functions
export function slurp(f) {
    if (typeof require !== 'undefined') {
        return require('fs').readFileSync(f, 'utf-8')
    } else {
        var req = new XMLHttpRequest()
        req.open('GET', f, false)
        req.send()
        if (req.status == 200) {
            return req.responseText
        } else {
            throw new Error(`Failed to slurp file: ${f}`)
        }
    }
}

export var packages = {};

export function find_package(packageName) {
  if(packageName in packages) {
    return packages[packageName];
  }
  // Punt and hope that packageName is a file name
  return packageName;
}

function pairs(args) {
  var results = [];
  args.forEach( (item, index) => {
    if (index % 2 === 0) {
      results.push([args[index], args[index + 1]]);
    }
  });
  return results;
}

// core_ns is namespace of type functions
export const namespace = new Map([
  ['+', (a, b) => {
    console.log(`Adding ${a} and ${b}`);
    return a+b; }],
  ['*', (a, b) => a*b],

  ['str', (...a) => a.map(e => pr_str(e,0)).join('')],
  ['slurp', slurp],
  ['find_package', find_package],
  ['pairs', pairs],
]);
