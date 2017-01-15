/*global zscript beforeAll expect fit fdefine*/

/**
 * Complete end to end tests for ZScript
 */
describe('zscript', function() {
  var zs;

  const toSymbol = zscript.types._symbol,
    toVector = zscript.types._vector;

  beforeEach(function() {
    zs = new zscript.Context();
  });

  it('defines a symbol for a constant', function() {
    zs.loadScript('(def x 1)');
    let x = zs.env.get('x');

    // TODO This should NOT be a number, but rather something that resolves
    // to a number.
    console.log(typeof x);

    expect(x).toBeTruthy();
  });

  // Not functioning yet; need to fix.
  xit('constants can be evaluated', function() {
    zs.loadScript('(def x 1)');
    var x = zs.env.get('x');
    expect(x.constructor.prototype.hasOwnProperty('evaluate')).toBe(true);
  });

  it('functions can be evaluated', function() {
    zs.loadScript(`
(def sum
  (func [x y]
    (+ x y)))
    `);
    var sum = zs.env.get('sum');
    expect(sum.constructor.prototype.hasOwnProperty('evaluate')).toBe(true);
  });

  it('evaluates a simple global function', function() {
    zs.loadScript(`
(def sum
  (func [x y]
    (+ x y)))
    `);
    expect(zs.evaluate('(sum 1 2)')[0][0]).toBe(3);
    expect(zs.evaluate('(sum 11 13)')[0][0]).toBe(24);
  });

  it('evalutes a function calling another function with arguments', function() {
    zs.loadScript(`
(def sum
  (func [x y]
    (+ x y)))
    
(def test
  (func []
    (sum 1 2)))

(def test2
  (func []
    (sum 11 13)))
    `);
    expect(zs.evaluate('(test)')[0][0]).toBe(3);
    expect(zs.evaluate('(test2)')[0][0]).toBe(24);
  });

  it('evalutes a global function calling other functions', function() {
    zs.loadScript(`
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
    `);
    expect(zs.evaluate('(add300 1)')[0][0]).toBe(301);
    expect(zs.evaluate('(add300 23)')[0][0]).toBe(323);
  });

  it('supports positional destructuring', function() {
    zs.loadScript(`
;;; Positional destructuring
(def sum_of_list_of_two
  (func
    [[a b]]
      (+ a b)))
      
(def test
  (func [x y]
    (sum_of_list_of_two [x y])))
    `);
    expect(zs.evaluate('(test 1 2)')[0][0]).toBe(3);
  });

  it('supports map with a regular function', function() {
    zs.loadScript(`
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
    `);
    expect(zs.evaluate('(test 1 2)')[0][0]).toEqual([2, 3]);
  });

  xit('supports map with a lambda function', function() {
    zs.loadScript(`
;;; Map with a lambda function
(def double_list
  (func
    [list]
      (map (func [x](* x 2)))))
      
(def test
  (func [x y]
    (double_list [x y])))
    `);
    expect(zs.evaluate('(test 13 23)')[0][0]).toEqual([26, 46]);
  });

  it('supports a simple lambda function', function() {
    zs.loadScript(`
;;; Simple lambda function
(def lambda2
  (func
    []
      (func [] (+ 1 1))))
      
(def test
  (func []
    (lambda2 [x y])))
    `);
    expect(zs.evaluate('(test)')[0][0]).toEqual(2);
  });

  describe('evaluate', function() {
    it('evaluates function call', function() {
      zs.loadScript(`
;;; Simple lambda function
(def lambda2
  (func
    []
      (func [] (+ 1 1))))
      
(def test
  (func []
    (lambda2 [x y])))
    `);
      var response = zs.evaluate('(test)'),
        responses = response[0],
        childEnv = response[1];
      console.log(responses);
      expect(responses[0]).toBe(2);
    });

    it('evaluates two function calls', function() {
      zs.loadScript(`
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
    `);
      var responses = zs.evaluate('(add300 1)(add300 23)')[0];
      expect(responses[0]).toBe(301);
      expect(responses[1]).toBe(323);
    });

  });
});
