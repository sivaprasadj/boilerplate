
'use strict'

window.addEventListener('load', function() {

  var $s = function(tagName) {
    return {
      $el:document.createElementNS('http://www.w3.org/2000/svg', tagName),
      attrs: function(attrs) {
        for (var k in attrs) {
          this.$el.setAttribute(k, '' + attrs[k]);
        }
        return this;
      },
      append(elm) {
        this.$el.appendChild(elm.$el);
        return this;
      }
    };
  };
  var pathBuilder = function() {
    var path = '';
    return {
      M: function(x, y) {
        path += 'M';
        path += x;
        path += ' ';
        path += y;
        return this;
      },
      L: function(x, y) {
        path += 'L';
        path += x;
        path += ' ';
        path += y;
        return this;
      },
      build: function() {
        return path;
      }
    };
  };

  var numFrets = 5;
  var fretWidth = 20;
  var numStrings = 4;
  var strPitch = 10;
  var pad = 5;

  var width = fretWidth * numFrets;
  var height = strPitch * numStrings;

  var svg = $s('svg').attrs({
    width: (width + pad * 2) + 'px',
    height: (height + pad * 2) + 'px' });
  var fretB = $s('g').attrs({ transform:
    'translate(' + pad + ' ' + pad + ')' });
  svg.append(fretB);
  for (var i = 0; i <= numFrets; i += 1) {
    fretB.append($s('path').attrs({ d: pathBuilder().
      M(i * fretWidth, 0).
      L(i * fretWidth, height).
      build(), fill: 'none', stroke: 'black' }) );
  }
  for (var i = 0; i <= numStrings; i += 1) {
    fretB.append($s('path').attrs({ d: pathBuilder().
      M(0, i * strPitch).
      L(width, i * strPitch).
      build(), fill: 'none', stroke: 'black' }) );
  }

  document.body.appendChild(svg.$el);

});
