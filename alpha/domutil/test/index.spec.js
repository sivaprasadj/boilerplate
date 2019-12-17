!function() {

  'use strict';

  var assertEquals = function(expected, actual) {
    if (expected !== actual) {
      throw 'expected' + JSON.stringify(expected) +
      ' but ' + JSON.stringify(actual);
    }
  }

  var $ = domutil.$;
  var html = domutil.html;
  var svg = domutil.svg;

  console.log(html('div').$el.tagName);
  console.log(svg('svg').$el.tagName);

  var svg = html('div');
  var count = 0;
  var test_handler = function(event, detail) {
    count += 1;
  };
  svg.on('test', test_handler);
  assertEquals(0, count);
  svg.trigger('test', {});
  assertEquals(1, count);
  svg.off('test', test_handler);
  svg.trigger('test', {});
  assertEquals(1, count);

  $(document).on('mousedown', function(event) {
    console.log('mousedown');
  });
  $(document).off('mousedown', function(event) {
    console.log('mousedown2');
  });

  $(window).on('load', function() {
    var div = html('div');
    div.style({color:'red'}).
      props({textContent:'hi'}).
      attrs({'x-test': 'tets'});
    document.body.appendChild(div.$el);
  });

}();
