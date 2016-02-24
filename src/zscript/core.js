

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

// core_ns is namespace of type functions
export const namespace = new Map([
  ['+', (a, b) => a+b],

  ['str', (...a) => a.map(e => pr_str(e,0)).join('')],
  ['slurp', slurp]
]);
