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

    zs.subscribe('(test)', listener);
    // Expect to get called with the initial value
    expect(listener).toHaveBeenCalledWith(13);
    expect(listener.calls.count()).toEqual(1);
  });

  xit('publishes a new value when a simple dependency changes', function () {
    var listener = jasmine.createSpy('listener');

    // Publish a new value; the returned listener is a function that
    // is called with the new value.
    var x = zs.def('x');
    zs.loadScript(`
(def test
  (func []
    (x)))
    `);

    function callback(newValue, details) {
      return listener(newValue);
    }
    zs.subscribe('(test)', callback);

    x.publish(13);

    // Expect to get the initial value
    expect(listener).toHaveBeenCalledWith(13);
    expect(listener.calls.count()).toEqual(1);
  });

  xit('publishes a new value for each dependency change', function () {
    var listener = jasmine.createSpy('listener');

    // Publish a new value; the returned listener is a function that
    // is called with the new value.
    var x = zs.def('x');
    zs.loadScript(`
(def test
  (func []
    (x)))
    `);

    function callback(newValue, details) {
      return listener(newValue);
    }
    
    zs.subscribe('(test)', callback);

    x.publish(13);
    expect(listener).toHaveBeenCalledWith(13);
    expect(listener.calls.count()).toEqual(1);

    x.publish(23);
    expect(listener).toHaveBeenCalledWith(23);
    expect(listener.calls.count()).toEqual(2);

    x.publish(51);
    expect(listener).toHaveBeenCalledWith(51);
    expect(listener.calls.count()).toEqual(3);
  });

  xit('publishes a computed value when a simple dependency changes', function () {
    var listener = jasmine.createSpy('listener');

    // Publish a new value; the returned listener is a function that
    // is called with the new value.
    var x = zs.def('x');
    zs.loadScript(`
(def test
  (func []
    (+ x 1)))
    `);

    function callback(newValue, details) {
      return listener(newValue);
    }
    zs.subscribe('(test)', callback);

    // FIXME this causes a stack overflow because of a circular reference;
    x.publish(13);

    // Expect to get the initial value
    expect(listener).toHaveBeenCalledWith(14);
    expect(listener.calls.count()).toEqual(1);
  });

});
