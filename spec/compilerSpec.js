/*global zscript beforeAll expect fit fdescribe*/

/**
 * compiler unit tests
 * 
 */
describe('compiler', function() {
  var compiler = zscript.compiler,
    compileString = compiler.compileString;

  describe('compileScript', function() {
    it('compiles a single function call', function () {
      var scripts = compileString('(test)');
      expect(scripts.length).toBe(1);
    });

    it('compiles two function calls', function () {
      var scripts = compileString('(test)(lambda)');
      expect(scripts.length).toBe(2);
    });

    it('wraps a function call with a node', function() {
      var scriptString = '(test)',
        script = compileString(scriptString)[0];
        expect(script.constructor.name).toBe('GraphNode');
    });

    it('constructs a function call with arguments', function () {
      let script = compileString('(test 1 2)')[0];
      expect(script.getModel().constructor.name).toBe('FunctionCall');
      expect(script.getModel().getArg(0)).toBe(1);
      expect(script.getModel().getArg(1)).toBe(2);
    });

  });

  
});