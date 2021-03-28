
'use strict'

window.addEventListener('load', function() {

  var patterns = [
    {
      label: 'Single Stroke Roll',
      pattern: 'R32 L32 R32 L32 R32 L32 R32 L32 R32 L32 R32 L32 R32 L32 R32 L32',
      blen: 2
    },
    {
      label: 'Double Stroke Open Roll',
      pattern: 'R32 R32 L32 L32 R32 R32 L32 L32 R32 R32 L32 L32 R32 R32 L32 L32',
      blen: 2
    },
    {
      label: 'Five Stroke Roll',
      pattern: 'R32 R32 L32 L32 R8 L32 L32 R32 R32 L8',
      blen: 2
    },
    {
      label: 'Seven Stroke Roll',
      pattern: 'R32 R32 L32 L32 R32 R32 L16 R32 R32 L32 L32 R32 R32 L16',
      blen: 2
    },
    {
      label: 'Nine Stroke Roll',
      pattern: 'R32 R32 L32 L32 R32 R32 L32 L32 L4 L32 L32 R32 R32 L32 L32 R32 R32 L4',
      blen: 1
    },
    {
      label: 'Ten Stroke Roll',
      pattern: 'R32 R32 L32 L32 R32 R32 L32 L32 R16 L16 Q8 R32 R32 L32 L32 R32 R32 L32 L32 R16 L16 Q8',
      blen: 1
    },
    {
      label: 'Eleven Stroke Roll',
      pattern: 'R32 R32 L32 L32 R32 R32 L32 L32 R32 R32 L32 L32 R16 Q16 R32 R32 L32 L32 R32 R32 L32 L32 R32 R32 L32 L32 R16 Q16',
      blen: 1
    },
    {
      label: 'X',
      pattern: 'L4 R4 L4 R4',
      blen: 1
    },
    {
      label: 'X',
      pattern: 'L4 R4 L4 R4',
      blen: 1
    },
    {
      label: 'X',
      pattern: 'L2 R4 L4',
      blen: 1
    }
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

//  var numFrets = 4;
//  var fretPitch = 18;
//  var numStrings = 6;
//  var strPitch = 10;
//  var zeroFretGap = 6;
  var patSrtoke = '#000000';
 // var chordFill = '#000000';
  var fontFamily = 'Arial';
  var fontSize = 16;
 // var fontSizeSmall = ~~(fontSize * 0.75);
  var strokeWidth = 0.5;
 // var fretStrokeWidth = 1;
 // var openPosRate = 0.5 / 4 * 6;

//  var chordRadius  = fretPitch / 4;
  var patWidth = 400;
  var patHeight = 50;

  var appendPattern = function(x, y, patternName, pattern, beatLength) {

    var pat = $s('g').attrs({
      transform: 'translate(' + x + ' ' + y + ')' });
    svg.append(pat);

    !function() {
      pat.append($s('rect').attrs({
        x: 0, y: 0, width: patWidth, height: patHeight,
        fill: 'none', 'stroke-linecap': 'butt',
        'stroke-width': strokeWidth,
        stroke: '#fc6' }) );
    }();

    var x = 0;
    var pRe = /([A-Z]+)(\d+)/;
    pattern.split(/\s+/g).forEach(function(note, i) {
      if (note.match(pRe) ) {
        var n = RegExp.$1;
        var d = +RegExp.$2;
        console.log(note, n, d, i);
        if (n == 'L' || n == 'R') {
        var nx = x * patWidth * beatLength;
        pat.append($s('path').attrs({ d: pathBuilder().
          M(nx, 0).
          L(nx, patHeight).build(),
          fill: 'none', 'stroke-linecap': 'square',
          'stroke-width': strokeWidth, stroke: patSrtoke }) );
        }
        x += 1 / d;
      }
    });
/*
    for (var i = 0; i <= numFrets; i += 1) {
      fret.append($s('path').attrs({ d: pathBuilder().
        M(i * fretPitch, 0).
        L(i * fretPitch, fretHeight).
        build(), fill: 'none', 'stroke-linecap': 'butt',
        'stroke-width': shift == 0 && i == 0? strokeWidth * 5 : strokeWidth,
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
          M(-openPosRate * fretPitch - s, i * strPitch - s).
          L(-openPosRate * fretPitch + s, i * strPitch + s).
          build(), fill: 'none', 'stroke-linecap': 'square',
          'stroke-width': fretStrokeWidth * 0.5, stroke: fretSrtoke }) );
        fret.append($s('path').attrs({ d: pathBuilder().
          M(-openPosRate * fretPitch + s, i * strPitch - s).
          L(-openPosRate * fretPitch - s, i * strPitch + s).
          build(), fill: 'none', 'stroke-linecap': 'square',
          'stroke-width': fretStrokeWidth * 0.5, stroke: fretSrtoke }) );
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
          cx: -openPosRate * fretPitch, cy: i * strPitch,
          r: chordRadius - 1, fill: 'none',
          'stroke-width': fretStrokeWidth * 0.5, stroke: fretSrtoke }) );
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
        x: (i + 0.5) * fretPitch,
        y: fretHeight + chordRadius + fontSizeSmall,
        'text-anchor': 'middle',
        'font-family': fontFamily, 'font-size': fontSizeSmall });
      text.$el.textContent = '' + (i + 1 + shift);
      fret.append(text);
    }
*/
  !function() {
      var text = $s('text').attrs({
        x: 0,
        y: 0,
//        'text-anchor': 'middle',
        'font-family': fontFamily, 'font-size': fontSize });
      text.$el.textContent = patternName;
      pat.append(text);
  }();
  };

  var marginLeft = 20;
  var marginTop = 60;
  var hGap = 30;
  var vGap = 60;

  var width = (patWidth + hGap) * 2 -
    hGap + marginLeft * 2;
  var height = (patHeight + vGap) * ~~(patterns.length / 2) -
    vGap + marginTop * 2;

  var svgHolder = document.createElement('div');
  document.body.appendChild(svgHolder);
  var svg = $s('svg').attrs({
    width: width + 'px', height: height + 'px', xmlns: svgNamespace });
  svgHolder.appendChild(svg.$el);

  // bg
  svg.append($s('rect').attrs({
    x: 0, y: 0, width: width, height: height,
    fill: '#f0f0f0', stroke: '#00f' }));

  var x = marginLeft;
  var y = marginTop;
  for (var i = 0; i < patterns.length; i += 1) {
    appendPattern(x, y, patterns[i].label,
      patterns[i].pattern, patterns[i].blen);
    x += patWidth + hGap;
    if ( (i + 1) % 2 == 0) {
      x = marginLeft;
      y += patHeight + vGap;
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
