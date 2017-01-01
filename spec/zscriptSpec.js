/*global zscript beforeAll expect*/

describe('zscript', function() {
  var toSymbol = zscript.types._symbol,
    globalEnv;

  beforeEach(function() {
    globalEnv = zscript.env.newEnv();
  });

  function loadScript(scriptString, env) {
    env = env || globalEnv;
    var tokens = zscript.compiler.reader.tokenize(scriptString);
    while (!tokens.isDone()) {
      var ast = zscript.compiler.reader.readNextExpression(tokens);
      zscript.compiler.compileScript(ast, env);
    }
  }

  it('defines a symbol for a constant', function() {
    loadScript('(def x 1)', globalEnv);
    let x = zscript.env.getEnv(globalEnv, toSymbol('x'));

    // TODO This should NOT be a number, but rather something that resolves
    // to a number.
    console.log(typeof x);

    expect(x).toBeTruthy();
  });

  it('constants can be evaluated', function() {
    loadScript('(def x 1)', globalEnv);
    var x = zscript.env.getEnv(globalEnv, toSymbol('x'));
    expect(x.constructor.prototype.hasOwnProperty('evaluate')).toBe(true);
  });

  it('functions can be evaluated', function() {
    loadScript(`
(def sum
  (func [x y]
    (+ x y)))
    `, globalEnv);
    var sum = zscript.env.getEnv(globalEnv, toSymbol('sum'));
    expect(sum.constructor.prototype.hasOwnProperty('evaluate')).toBe(true);
  });

  it('evaluates a simple global function', function() {
    loadScript(`
(def sum
  (func [x y]
    (+ x y)))
    `, globalEnv);
    let sum = zscript.env.getEnv(globalEnv, toSymbol('sum'));
    expect(sum.evaluate(globalEnv, [1, 2])).toBe(3);
    expect(sum.evaluate(globalEnv, [11, 13])).toBe(24);
  });

  
});
