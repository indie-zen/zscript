// @flow
/*global zscript beforeAll expect fit fdefine spyOn*/
const zscript = global.zscript;

/**
 * Complete end to end tests for ZScript
 */
describe('zscript', function() {
  var zs;

  beforeEach(function() {
    zs = new zscript.Context();
  });

  describe('def', function() {

    it('defines a symbol the same way loadScript does', function() {
      zs.loadScript('(def x 1)');
      var x = zs.getNode('x');

      var y = zs.def('y');
      y.set(1);

      expect(x.getModel()).toBe(y.getModel());
      expect(x.isDirty()).toBe(y.isDirty());
    });

    it('defines a symbol for a constant', function() {
      zs.loadScript('(def x 1)');
      let x = zs.getNode('x');

      expect(x).toBeTruthy();
      expect(x.constructor.name).toBe('GraphNode');
    });

  });

  describe('loadScript', function() {
    it('defines a function calling a function using a function call as an argument', function() {
      zs.loadScript(`
(def test
  (func [x y z]
    (+ (+ x y) z)))
      `);

      var test = zs.get('test');
      // console.log('test is');
      // console.log(test);
      // console.log('The getModel().getBody() of test is');
      // console.log(test.getModel().getBody());
      // console.log('This  should be a function call to (+ x y)');
      var innerFuncCall = test.getBody().getArg(0);
      // console.log(innerFuncCall);
      expect(innerFuncCall.constructor.name).toBe('FunctionCall');
      expect(innerFuncCall.getName()).toBe(Symbol.for('+'));
      expect(innerFuncCall.getArg(0)).toBe(Symbol.for('x'));
      expect(innerFuncCall.getArg(1)).toBe(Symbol.for('y'));
    });

    it('defines a function that uses positional destructuring', function() {
      zs.loadScript(`
;;; Positional destructuring
(def sum_of_list_of_two
  (func
    [[a b]]
      (+ a b)))
    `);
      var func = zs.get('sum_of_list_of_two');
      expect(func.constructor.name).toBe('FunctionDefinition');
      // console.log(func);

      // TODO Finish
    });

    it('defines a function call that passes a vector as an argument', function() {
      zs.loadScript(`
;;; Array as an argument
(def test
  (func [x y]
    (sum_of_list_of_two [x y])))
    `);
      var funcCall = zs.get('test').getBody();
      var arg = funcCall.getArg(0);
      // console.log(arg);
      expect(zscript.types.getType(arg)).toBe('vector');
      expect(arg[0].getModel()).toBe(Symbol.for('x'));
      expect(arg[1].getModel()).toBe(Symbol.for('y'));
    });

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
    (lambda2)))
    `);
      var response = zs.evaluate('(test)'),
        responses = response[0],
        childEnv = response[1];
      // console.log(responses);
      expect(responses[0]).toBe(2);
    });

    it('evaluates function call with extra unused parameters', function() {
      zs.loadScript(`
;;; Simple lambda function
(def lambda2
  (func
    []
      (func [] (+ 1 1))))

(def test
  (func []
    (lambda2 [1 2])))
    `);
      var response = zs.evaluate('(test)'),
        responses = response[0],
        childEnv = response[1];
      // console.log(responses);
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
    `);
      var responses = zs.evaluate('(add100 1)(add200 23)')[0];
      expect(responses[0]).toBe(101);
      expect(responses[1]).toBe(223);
    });

    it('evaluates two function calls that call other functions', function() {
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

    it('constants can be evaluated', function() {
      zs.loadScript('(def x 1)');
      var x = zs.getEnv().get('x');
      expect(x.constructor.prototype.hasOwnProperty('evaluate')).toBe(true);
    });

    it('functions can be evaluated', function() {
      zs.loadScript(`
(def sum
  (func [x y]
    (+ x y)))
    `);
      var sum = zs.getEnv().get('sum');
      expect(sum.constructor.prototype.hasOwnProperty('evaluate')).toBe(true);
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
      // console.log('Parsed positional destructuring.');
      // console.log(zs.getEnv().get('test'));

      var funcCall = zs.getEnv().get('test').getModel().getBody();
      // console.log('Function call:');
      // console.log(funcCall);

      // console.log('Argument');
      var arg = funcCall.getArg(0);
      // console.log(arg);
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
    (lambda2 [1 2])))
    `);
      expect(zs.evaluate('(test)')[0][0]).toEqual(2);
    });

    // Re-uses a function call and a function definition but with different 
    // values for arguments to make sure memoization doesn't interfere with 
    // isDirty subscription optimization
    it('memoizes function calls properly', function() {
      zs.loadScript(`
(def add 
  (func [x y]
    (+ x y)))

(def add3
  (func [x y]
    (add (+ 1 x) (+ y 2))))

(def test
  (func [x y]
    (add3 x y)))
    `);
      expect(zs.evaluate('(test 3 5)')[0][0]).toBe(11);
      expect(zs.evaluate('(test 11 13)')[0][0]).toBe(27);
    });

  });

  describe('require', function() {
    it('loads a file into a namespace', function() {
      zs.require('test', 'spec/test.zs');
      expect(zs.get('test.xyz')).toBe(13);
    });
  });

});
