// @flow
/*global beforeAll describe zscript expect fit fdefine spyOn*/

const zscript = global.zscript;

/**
 * Unit tests for env
 */
describe('env', function () {
    var globalEnv;
    
    beforeAll(function () {
        globalEnv = new zscript.Environment();
    })

    it('stores a value', function () {
        globalEnv.set('x', 1);
        expect(globalEnv.get('x')).toBe(1);
    });
    
});
