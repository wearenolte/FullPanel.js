(function($) {
  /*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      throws(block, [expected], [message])
  */

  module('jQuery#fullpanel', {
    // This will run before each test in this module.
    setup: function() {
      this.el = $('.fullpane-wrapper');
    }
  });


  test('does exist', function() {
      expect(1);
      ok(this.el, "exists");
    //strictEqual($.awesome(), 'awesome.', 'should be awesome');
    //strictEqual($.awesome({punctuation: '!'}), 'awesome!', 'should be thoroughly awesome');
  });


}(jQuery));
