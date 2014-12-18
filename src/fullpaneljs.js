/*
 * fullPanel.js
 * 
 *
 * Copyright (c) 2014 Jeffrey Nolte
 * Licensed under the MIT license.
 */

(function ($) {

  // Collection method.
  $.fn.fullpaneljs = function () {
    return this.each(function (i) {
      // Do something to each selected element.
      $(this).html('fullpaneljs' + i);
    });
  };

  // Static method.
  $.fullpaneljs = function (options) {
    // Override default options with passed-in options.
    options = $.extend({}, $.fullpaneljs.options, options);
    // Return the name of your plugin plus a punctuation character.
    return 'fullpaneljs' + options.punctuation;
  };

  // Static method default options.
  $.fullpaneljs.options = {
    punctuation: '.'
  };

  // Custom selector.
  $.expr[':'].fullpaneljs = function (elem) {
    // Does this element contain the name of your plugin?
    return $(elem).text().indexOf('fullpaneljs') !== -1;
  };

}(jQuery));
