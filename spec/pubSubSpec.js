/*global zscript beforeAll expect spyOn fit fdescribe jasmine*/

/**
 * Pub / Sub JavaScript integration
 */
describe('zscript pub/sub', function() {
  var zs;

  beforeEach(function() {
    zs = new zscript.Context();
  });

  describe('subscribe', function() {

    it('can subscribe to a simple node', function() {
      var listener = jasmine.createSpy('listener');
      zs.loadScript('(def x 1)');
      var x = zs.env.get('x');

      function callback(newValue, details) {
        return listener(newValue);
      }
      zs.subscribe('(x)', callback);
      var subs = x.getSubscribersAsArray();
      expect(subs.length).toBe(1);

      // x is subscribed by '(x)' function call, which is then
      // subscribed by callback() function
      expect(subs[0].getSubscribersAsArray()[0]).toBe(callback);
    });

    it('can subscribe to a simple function call', function() {
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
      var subs = x.getSubscribersAsArray();

      // x is subscribed by 'lambda(x)' function call, which is then
      // subscribed by the (test) function call, which is then
      // subscribed by callback() function

      // First level is (x) function call
      console.log('First level subscription:');
      var sub0 = subs[0];
      console.log(sub0);

      // Second level is the lambda function definition (func [] (x))
      console.log('Second level subscription:');
      var sub1 = sub0.getSubscribersAsArray()[0];
      console.log(sub1);

      // Third level is the (test) function call
      console.log('Third level subscription:');
      var sub2 = sub1.getSubscribersAsArray()[0];
      console.log(sub2);
      expect(sub2.$model.name).toBe(Symbol.for('test'));

      // Fourth level is the zs.subscribe callback
      console.log('Fourth level subscription:');
      var sub3 = sub2.getSubscribersAsArray()[0];
      console.log(sub3);

      expect(sub3).toBe(callback);

      console.log(x);
    })

    it('can subscribe to a function call with arguments', function() {
      var listener = jasmine.createSpy('listener');

      // Publish a new value; the returned listener is a function that
      // is called with the new value.
      zs.loadScript('(def x 1)');
      var x = zs.env.get('x');

      zs.loadScript(`
(def test
  (func []
    (+ x 1)))
    `);

      function callback(newValue, details) {
        return listener(newValue);
      }
      zs.subscribe('(test)', callback);

      var sub = x,
        depth = 1;

      function nextDeeperSubscription(description) {
        console.log(`Subscription level: ${depth} - ${description}`);
        sub = sub.getSubscribersAsArray()[0];
        console.log(sub);
        depth = depth + 1;
      }

      nextDeeperSubscription('x node');
      nextDeeperSubscription('(+ x 1) function call');
      nextDeeperSubscription('(func [] (+ x 1)) function definition');
      nextDeeperSubscription('(test) function call');
      nextDeeperSubscription('zs.subscribe');
      expect(sub).toBe(callback);
    });
  });

  it('publishes a computed value when a simple dependency changes', function() {
    var listener = jasmine.createSpy('listener');

    // Publish a new value; the returned listener is a function that
    // is called with the new value.
    zs.loadScript('(def x 1)');
    var x = zs.env.get('x');

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
    console.log('After publish');
    console.log(x);

    // Expect to get the initial value
    expect(listener).toHaveBeenCalledWith(14);
    expect(listener.calls.count()).toEqual(1);
    
    x.publish(33);
    expect(listener).toHaveBeenCalledWith(34);
    expect(listener.calls.count()).toEqual(2);
  });


  xit('publishes the initial value at first subscription', function() {
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

  xit('publishes a new value when a simple dependency changes', function() {
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

  xit('publishes a new value for each dependency change', function() {
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

  // TODO Write a test that re-uses a function call and a function definition
  // but with different values for arguments to make sure memoization doesn't
  // interfere with isDirty subscription optimization

});
