
'use strict'

window.addEventListener('load', function() {

  var chords = [
    { label: 'C',     chord: [0, 1, 0, 2, 3, -1] },
    { label: 'Cm',    chord: ['3_4', 4, 5, 5, 0, -1], shift: 2 },
    { label: 'C7',    chord: [0, 1, 3, 2, 3, -1] },
    { label: 'CM7',   chord: [0, 0, 0, 2, 3, -1] },
    { label: 'Cm7',   chord: ['3_4', 0, 0, 0, 0, -1], shift: 2 },
    { label: 'Cdim',  chord: ['2_2', 0, 0, 0, 0, -1], shift: 1 },
    { label: 'Cadd9', chord: [0, 0, 0, 0, 0, -1] },
    { label: 'Csus4', chord: ['1_1', 0, 0, 0, 0, -1] },
    { label: 'Caug',  chord: [-1, '1_1', 0, 0, 0, -1] },

    { label: 'X',     chord: [0, 0, 0, 0, 0, 0] },
    { label: 'Xm',    chord: [0, 0, 0, 0, 0, 0] },
    { label: 'X7',    chord: [0, 0, 0, 0, 0, 0] },
    { label: 'XM7',   chord: [0, 0, 0, 0, 0, 0] },
    { label: 'Xm7',   chord: [0, 0, 0, 0, 0, 0] },
    { label: 'Xdim',  chord: [0, 0, 0, 0, 0, 0] },
    { label: 'Xadd9', chord: [0, 0, 0, 0, 0, 0] },
    { label: 'Xsus4', chord: [0, 0, 0, 0, 0, 0] },
    { label: 'Xaug',  chord: [0, 0, 0, 0, 0, 0] }
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

  var numFrets = 4;
  var fretPitch = 18;
  var numStrings = 6;
  var strPitch = 12;
  var zeroFretGap = 4;
  var fretSrtoke = '#000000';
  var chordFill = '#000000';
  var fontFamily = 'Arial';
  var fontSize = 16;
  var fontSizeSmall = ~~(fontSize * 0.75);
  var strokeWidth = 0.5;
  var fretStrokeWidth = 1;

  var chordRadius  = fretPitch / 4;
  var fretWidth = fretPitch * (numFrets + 0.5);
  var fretHeight = strPitch * (numStrings - 1);

  var appendFret = function(x, y, chordName, chord, shift) {
    shift = shift || 0;
    var fret = $s('g').attrs({
      transform: 'translate(' + x + ' ' + y + ')' });
    svg.append(fret);
    if (shift == 0) {
      fret.append($s('path').attrs({ d: pathBuilder().
        M(-zeroFretGap, 0).L(-zeroFretGap, fretHeight).build(),
        fill: 'none', 'stroke-linecap': 'square',
        'stroke-width': strokeWidth, stroke: fretSrtoke }) );
    }
    for (var i = 0; i <= numFrets; i += 1) {
      fret.append($s('path').attrs({ d: pathBuilder().
        M(i * fretPitch, 0).
        L(i * fretPitch, fretHeight).
        build(), fill: 'none', 'stroke-linecap': 'butt',
        'stroke-width': shift == 0 && i == 0? strokeWidth * 4 : strokeWidth,
        stroke: fretSrtoke }) );
    }
    for (var i = 0; i < numStrings; i += 1) {
      fret.append($s('path').attrs({ d: pathBuilder().
        M(-zeroFretGap, i * strPitch).
        L(fretWidth, i * strPitch).
        build(), fill: 'none', 'stroke-linecap': 'square',
        'stroke-width': strokeWidth, stroke: fretSrtoke }) );
    }
    var open = [];
    for (var i = 0; i < chord.length; i += 1) {
      open.push(0);
    }
    for (var i = 0; i < chord.length; i += 1) {
      if (typeof chord[i] == 'string') {
        if (chord[i].match(/^(\d+)_(\d+)$/) ) {
          var c1 = +RegExp.$1;
          var c2 = +RegExp.$2;
          fret.append($s('rect').attrs({
            x: (c1 - 0.5 - shift) * fretPitch - chordRadius,
            y: i * strPitch,
            width: chordRadius * 2, height: c2 * strPitch,
            fill: chordFill, stroke: 'none' }) );
          fret.append($s('circle').attrs({
            cx: (c1 - 0.5 - shift) * fretPitch, cy: i * strPitch,
            r: chordRadius, fill: chordFill, stroke: 'none' }) );
          fret.append($s('circle').attrs({
            cx: (c1 - 0.5 - shift) * fretPitch, cy: (i + c2) * strPitch,
            r: chordRadius, fill: chordFill, stroke: 'none' }) );
          for (var j = 0; j <= c2; j += 1) {
            open[i + j] = 1;
          }
        }
      } else if (chord[i] == -1) {
        var s = chordRadius - 2;
        fret.append($s('path').attrs({ d: pathBuilder().
          M(-0.5 * fretPitch - s, i * strPitch - s).
          L(-0.5 * fretPitch + s, i * strPitch + s).
          build(), fill: 'none', 'stroke-linecap': 'square',
          'stroke-width': fretStrokeWidth, stroke: fretSrtoke }) );
        fret.append($s('path').attrs({ d: pathBuilder().
          M(-0.5 * fretPitch + s, i * strPitch - s).
          L(-0.5 * fretPitch - s, i * strPitch + s).
          build(), fill: 'none', 'stroke-linecap': 'square',
          'stroke-width': fretStrokeWidth, stroke: fretSrtoke }) );
      } else if (chord[i] > 0) {
        fret.append($s('circle').attrs({
          cx: (chord[i] - 0.5 - shift) * fretPitch, cy: i * strPitch,
          r: chordRadius, fill: chordFill, stroke: 'none' }) );
        open[i] = 1;
      }
    }
    for (var i = 0; i < chord.length; i += 1) {
      if (chord[i] == 0 && open[i] != 1) {
        fret.append($s('circle').attrs({
          cx: (- 0.5) * fretPitch, cy: i * strPitch,
          r: chordRadius - 1, fill: 'none',
          'stroke-width': fretStrokeWidth, stroke: fretSrtoke }) );
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
        fret.append(text);
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

    for (var i = 0; i < numFrets; i += 1) {
      var text = $s('text').attrs({
        x: (i + 0.5) * fretPitch + fretPitch * 0.5, /* dbg */
        y: fretHeight + chordRadius + fontSizeSmall,
        'text-anchor': 'middle',
        'font-family': fontFamily, 'font-size': fontSizeSmall });
      text.$el.textContent = '' + (i + 1 + shift);
      fret.append(text);
    }
  };

  var marginLeft = 20;
  var marginTop = 60;
  var hGap = 20;
  var vGap = 60;

  var width = (fretWidth + hGap) * 9 -
    hGap + marginLeft * 2;
  var height = (fretHeight + vGap) * ~~(chords.length / 9) -
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
    appendFret(x, y, chords[i].label,
        chords[i].chord, chords[i].shift);
    x += fretWidth + hGap;
    if ( (i + 1) % 9 == 0) {
      x = marginLeft;
      y += fretHeight + vGap;
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
