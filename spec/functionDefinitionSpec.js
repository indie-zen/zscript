// @flow
/*global describe zscript expect fit fdefine spyOn*/
const zscript = global.zscript;

/**
 * Complete end to end tests for ZScript
 */
describe('FunctionDefinition', function() {
  const compiler = zscript.compiler,
    compileString = compiler.compileString,
    toSymbol = zscript.types._symbol,
    toVector = zscript.types._vector;

  var zs;

  beforeEach(function() {
    zs = new zscript.Context();
  });

  describe('body', function() {

    describe('getEvalEnv', function () {
      it('resolves arguments as environment variables', function() {
        zs.loadScript(`
(def test
  (func [x y]
    (+ x y)))
  `);

        // funcCall is a function call to test using arguments 1 2
        let funcCall = compileString('(test 1 2)')[0].$model;      

        console.log('global:');
        console.log(zs.getEnv().toString());

        let evalEnv = funcCall.getEvalEnv(zs.getEnv());
        expect(evalEnv.get('test').$model).toBeTruthy();
      });
      
    });

    describe('evaluate', function() {

      /**
       * When the FunctionDefinition.body is evaluated, the arguments
       * are resolved as environment variables.
       * In this test, when test.body is evaluated, x and y are 
       * pased as environment variables to the function.
       **/
      it('resolves arguments as environment variables', function() {
        zs.loadScript(`
(def test
  (func [x y]
    (+ x y)))
  `);

        // funcCall is a function call to test using arguments 1 2
        let funcCall = compileString('(test 1 2)')[0].$model;
        expect(funcCall.constructor.name).toBe('FunctionCall');

        let funcDef = zs.getEnv().get('test').$model;
        expect(funcDef.constructor.name).toBe('FunctionDefinition');

        let funcBody = funcDef.getBody();
        console.log(funcBody);
        let originalFuncBodyEvaluate = funcBody.evaluate.bind(funcBody);

        spyOn(funcBody, 'evaluate').and.callFake(function(env) {
          expect(env.get('x')).toBe(1);
          expect(env.get('y')).toBe(2);
          return originalFuncBodyEvaluate(env);
        });

        let env = zs.getEnv();
        expect(funcCall.evaluate(env)).toBe(3);
      });

      it('does not corrupt the outer environment', function() {
        zs.loadScript(`
(def x 31)
(def y 33)
(def test
  (func [x y]
    (+ x y)))
  `);
        let env = zs.getEnv();
        // funcCall is a function call to test using arguments 1 2
        let funcCall = compileString('(test 1 2)')[0].$model;
        expect(env.get('x').$model).toBe(31);
        expect(env.get('y').$model).toBe(33);
        expect(funcCall.evaluate(env)).toBe(3);
        expect(env.get('x').$model).toBe(31);
        expect(env.get('y').$model).toBe(33);
      });

    });

  });

});
