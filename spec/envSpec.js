/*global zscript beforeAll expect*/

/**
 * Unit tests for env
 */
describe('env', function () {
    var env, globalEnv;
    
    beforeAll(function () {
        env = zscript.env;
        globalEnv = env.newEnv();
    })

    it('stores a value', function () {
        env.setEnv(globalEnv, 'x', 1);
        expect(env.getEnv(globalEnv, 'x')).toBe(1);
    });
    
});
