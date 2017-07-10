// @flow
/*global beforeAll describe zscript expect fit fdefine spyOn*/

const zscript = global.zscript;

/**
 * Unit tests for env
 */
describe('env', function () {
    var globalEnv;
    
    beforeAll(function () {
        globalEnv = zscript.newEnv();
    })

    it('stores a value', function () {
        zscript.setEnv(globalEnv, 'x', 1);
        expect(zscript.getEnv(globalEnv, 'x')).toBe(1);
    });
    
});
