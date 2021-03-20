
'use strict'

window.addEventListener('load', function() {

  var chords = [
    { label: 'C',     chord: [3, 0, 0, 0] },
    { label: 'Cm',    chord: [3, 3, 3, 0] },
    { label: 'C7',    chord: [1, 0, 0, 0] },
    { label: 'CM7',   chord: [2, 0, 0, 0] },
    { label: 'Cm7',   chord: [3, 3, 3, 3] },
    { label: 'Cdim',  chord: [3, 2, 3, 2] },
    { label: 'C6',    chord: [0, 0, 0, 0] },
    { label: 'Caug',  chord: [3, 0, 0, 1] },
    { label: 'Csus4', chord: [3, 1, 0, 0] }
  ];

  var svgNamespace = 'http://www.w3.org/2000/svg';

  var $s = function(tagName) {
    return {
      $el:document.createElementNS(svgNamespace, tagName),
      attrs: function(attrs) {
        for (var k in attrs) {
          this.$el.setAttribute(k, '' + attrs[k]);
        }
        return this;
      },
      append: function(elm) {
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

  var black = '#000000';
  var white = '#ffffff';
  var fontFamily = 'Arial';
  var fontSize = 16;
  var fontSizeSmall = ~~(fontSize * 0.75);
  var strokeWidth = 0.5;

  var wKeyHeight = 60;
  var bKeyHeight = wKeyHeight * 0.6;
  var wKeyPitch = 12;
  var bKeyPitch = wKeyPitch * 0.7;
  var numKeys = 11;

  var chordRadius  = wKeyPitch / 4;

  var keysWidth = wKeyPitch * numKeys;
  var keysHeight = wKeyHeight;

  var appendKeys = function(x, y, chordName, chord, shift) {
    shift = shift || 0;
    var keys = $s('g').attrs({
      transform: 'translate(' + x + ' ' + y + ')' });
    svg.append(keys);

    keys.append($s('path').attrs({ d: pathBuilder().
      M(0, 0).L(wKeyPitch * numKeys, 0).build(),
      fill: 'none', 'stroke-linecap': 'square',
      'stroke-width': strokeWidth, stroke: black }) );
    keys.append($s('path').attrs({ d: pathBuilder().
      M(0, wKeyHeight).L(wKeyPitch * numKeys, wKeyHeight).build(),
      fill: 'none', 'stroke-linecap': 'square',
      'stroke-width': strokeWidth, stroke: black }) );

    for (var i = 0; i <= numKeys; i += 1) {
      keys.append($s('path').attrs({ d: pathBuilder().
        M(wKeyPitch * i, 0).L(wKeyPitch * i, wKeyHeight).build(),
        fill: 'none', 'stroke-linecap': 'square',
        'stroke-width': strokeWidth, stroke: black }) );
    }

    var bkPat = [ 0, 1, 1, 0, 1, 1, 1 ];
    for (var i = 1; i < numKeys; i += 1) {
      if (bkPat[(i + 3) % bkPat.length] == 1) {
        keys.append($s('rect').attrs({
           x: wKeyPitch * i - bKeyPitch / 2,
           y: 0, width: bKeyPitch, height: bKeyHeight,
           stroke: 'none', fill: black }) );
      }
    }

    if (chordName.match(/^([A-G])(#?)(.*)$/) ) {

      var t1 = RegExp.$1;
      var t2 = RegExp.$2;
      var t3 = RegExp.$3;

      var appendText = function(s, fontSize, x, y) {
        var text = $s('text').attrs({ x: x, y: y,
          'font-family': fontFamily, 'font-size': fontSize });
        text.$el.textContent = s;
        keys.append(text);
        return text.$el.getBBox().width;
      };

      var x = 0;
      var y = -(chordRadius + 6);

      if (!t2) {

        x += appendText(t1, fontSize, x, y);

      } else {

        var sGap = ~~(fontSizeSmall / 2);
        var base = 'A'.charCodeAt(0);
        var t4 = String.fromCharCode(
            (t1.charCodeAt(0) - base + 1) % 7 + base);

        x += appendText(t1, fontSize, x, y);
        x += appendText(t2, fontSizeSmall, x, y - sGap);
        x += appendText('/', fontSize, x, y);
        x += appendText(t4, fontSize, x, y);
        x += appendText('b', fontSizeSmall, x, y - sGap);
      }

      x += appendText(t3, fontSizeSmall, x, y);
    }
  };

  var marginLeft = 20;
  var marginTop = 60;
  var hGap = 20;
  var vGap = 60;

  var width = (keysWidth + hGap) * 9 -
    hGap + marginLeft * 2;
  var height = (keysHeight + vGap) * ~~(chords.length / 9) -
    vGap + marginTop * 2;

  var svgHolder = document.createElement('div');
  document.body.appendChild(svgHolder);
  var svg = $s('svg').attrs({
    width: width + 'px', height: height + 'px', xmlns: svgNamespace });
  svgHolder.appendChild(svg.$el);

  // bg
  /*
  svg.append($s('rect').attrs({
    x: 0, y: 0, width: width, height: height,
    fill: '#f0f0f0', stroke: '#00f' }));
  */

  var x = marginLeft;
  var y = marginTop;
  for (var i = 0; i < chords.length; i += 1) {
    appendKeys(x, y, chords[i].label,
        chords[i].chord, chords[i].shift);
    x += keysWidth + hGap;
    if ( (i + 1) % 9 == 0) {
      x = marginLeft;
      y += keysHeight + vGap;
    }
  }

  var button = document.createElement('button');
  button.textContent = ' download ';
  button.addEventListener('click', function() {
    var content = svgHolder.innerHTML;
    content = content.replace(/^\s+|\s+$/g, '');
    var dataURL = 'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(content);
    var a = document.createElement('a');
    a.href = dataURL;
    a.download = 'chords.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
  document.body.appendChild(button);
});
