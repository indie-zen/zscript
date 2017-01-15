/*global zscript beforeAll expect spyOn fit fdescribe jasmine*/

/**
 * Pub / Sub JavaScript integration
 */
describe('zscript pub/sub', function() {
  var zs;

  beforeEach(function() {
    zs = new zscript.Context();
  });

  xit('publishes the initial value at first subscription', function () {
    var listener = jasmine.createSpy('listener');

    // Publish the initial value before the subscription
    zs.publishValue('x', 13);
    zs.loadScript(`
(def test
  (func []
    (x)))
    `);

    zs.subscribe('test', listener);
    // Expect to get called with the initial value
    expect(listener).toHaveBeenCalledWith(13);
    expect(listener.calls.count()).toEqual(1);
  });

  xit('publishes a new value when a simple dependency changes', function () {
    var listener = jasmine.createSpy('listener');

    // Publish a new value; the returned listener is a function that
    // is called with the new value.
    var x = zs.def('x');
    x.publish(13);
    zs.loadScript(`
(def test
  (func []
    (x)))
    `);

    // TODO this fails because env.get('test') returns a function rather than a node;
    // TODO all functions, function calls, arguments, etc must be wrapped with nodes.
    zs.subscribe('test', listener);
    // Expect to get the initial value
    expect(listener).toHaveBeenCalledWith(13);
  });

});
