/*global zscript beforeAll expect*/

/**
 * Complete end to end tests for ZScript
 */
describe('zscript', function() {
  var toSymbol = zscript.types._symbol,
    toVector = zscript.types._vector,
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

  // Not functioning yet; need to fix.
  xit('constants can be evaluated', function() {
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

  it('evalutes a function calling another function with arguments', function() {
    loadScript(`
(def sum
  (func [x y]
    (+ x y)))
    
(def test
  (func []
    (sum 1 2)))

(def test2
  (func []
    (sum 11 13)))
    `, globalEnv);
    let test = zscript.env.getEnv(globalEnv, toSymbol('test'));
    expect(test.evaluate(globalEnv, [])).toBe(3);
    let test2 = zscript.env.getEnv(globalEnv, toSymbol('test2'));
    expect(test2.evaluate(globalEnv, [])).toBe(24);
  });

  it('evalutes a global function calling other functions', function () {
    loadScript(`
;;; Global function calling other functions
(def add100
  (func [x]
    (+ x 100)))

(def add200
  (func [x]
    (+ x 200)))

(def add300
  (func [x]
    (add200 (add100 x))))
    `, globalEnv);
    let add300 = zscript.env.getEnv(globalEnv, toSymbol('add300'));
    expect(add300.evaluate(globalEnv, [1])).toBe(301);
    expect(add300.evaluate(globalEnv, [23])).toBe(323);
  });

  it('supports positional destructuring', function () {
    loadScript(`
;;; Positional destructuring
(def sum_of_list_of_two
  (func
    [[a b]]
      (+ a b)))
      
(def test
  (func [x y]
    (sum_of_list_of_two [x y])))
    `, globalEnv);
    let test = zscript.env.getEnv(globalEnv, toSymbol('test'));
    expect(test.evaluate(globalEnv, [1, 2])).toBe(3);
  });
  
  it('supports map with a regular function', function () {
    loadScript(`
;;; Map with a regular function
(def inc_list
  (func
    [list]
      (map inc list) ))
      
(def inc
  (func
    [value]
      (+ value 1)))

(def test
  (func [x y]
    (inc_list [x y])))
    `, globalEnv);
    let test = zscript.env.getEnv(globalEnv, toSymbol('test'));
    expect(test.evaluate(globalEnv, [1, 2])).toEqual([2, 3]);
  });

  xit('supports map with a lambda function', function () {
    loadScript(`
;;; Map with a lambda function
(def double_list
  (func
    [list]
      (map (func [x](* x 2)))))
      
(def test
  (func [x y]
    (double_list [x y])))
    `, globalEnv);
    let test = zscript.env.getEnv(globalEnv, toSymbol('test'));
    expect(test.evaluate(globalEnv, [13, 23])).toEqual([26, 46]);
  });

});
