/*global zscript beforeAll expect*/

describe('zscript', function () {
    var toSymbol = zscript.types._symbol;
    
    function loadScript(scriptString, env) {
        var tokens = zscript.compiler.reader.tokenize(scriptString);
        while(!tokens.isDone()) {
            var ast = zscript.compiler.reader.readNextExpression(tokens);
            zscript.compiler.compileScript(ast, env);
        }
    }
    
    it('defines a symbol for a constant', function () {
        let env = zscript.env.newEnv();
        loadScript('(def x 1)', env);
        let x = zscript.env.getEnv(env, toSymbol('x'));
        console.log(typeof x);
        
        expect(x).toBeTruthy();
    });
});
