/*global zscript beforeAll expect spyOn, jasmine*/

/**
 * Pub / Sub JavaScript integration
 */
describe('zscript pub/sub', function() {
  var zs;

  beforeEach(function() {
    zs = new zscript.Context();
  });

  it('publishes the initial value at first subscription', function () {
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

  it('publishes a new value when a simple dependency changes', function () {
    var listener = jasmine.createSpy('listener');

    // Publish a new value; the returned listener is a function that
    // is called with the new value.
    var eventSink = zs.publishValue('x', 13);
    zs.loadScript(`
(def test
  (func []
    (x)))
    `);

    zs.subscribe('test', listener);
    // Expect to get the initial value
    expect(listener).toHaveBeenCalledWith(13);
  });

});
