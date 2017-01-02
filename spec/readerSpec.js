/*global zscript beforeAll expect*/

/**
 * Unit tests for reader
 */
describe('reader', function () {
    var scriptString = '(def x 1)', 
        reader = zscript.compiler.reader;

    describe('tokenize()', function () {
        it('tokenizes a script', function () {
            var tokens = reader.tokenize(scriptString);
            expect(tokens.isDone()).toBe(false);
        });
        
        it('tokenizes into an iterator with only one atom', function () {
            var tokens = reader.tokenize(scriptString);
            expect(tokens.isDone()).toBe(false);
            
            for(var x = 0; !tokens.isDone(); x = x + 1) {
                reader.readNextExpression(tokens);
            }
            expect(x).toBe(1);
        });
    });

    describe('readString()', function () {
        it('returns an ast and a done iterator', function () {
            var [ast, iterator] = reader.readString(scriptString);
            expect(ast.length).toBe(3);
            expect(iterator.isDone()).toBe(true);
        });
    });

});
