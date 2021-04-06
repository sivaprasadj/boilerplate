
'use strict'

window.addEventListener('load', function() {

  var patternGroups = [
    {
      label: '',
      patterns: [
        {
          label: 'Single Stroke Roll',
          pattern: 'b0-32-7 b1-32-3 b2-32-3 R32 L32 R32 L32' +
                ' | b1-32-3 b2-32-3 R32 L32 R32 L32' +
                ' | b0-32-7 b1-32-3 b2-32-3 R32 L32 R32 L32' +
                ' | b1-32-3 b2-32-3 R32 L32 R32 L32',
          blen: 1
        },
        {
          label: 'Double Stroke Open Roll',
          pattern: 'b0-32-7 b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b0-32-7 b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b1-32-3 b2-32-3 R32 R32 L32 L32',
          blen: 1
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Five Stroke Roll',
          pattern: 'b0-32-4 b1-32-3 b2-32-3 R32 R32 L32 L32 R8' +
                ' | b0-32-4 b1-32-3 b2-32-3 L32 L32 R32 R32 L8',
          blen: 1
        },
        {
          label: 'Seven Stroke Roll',
          pattern: 'b0-32-6 b1-32-3 b2-32-3 R32 R32 L32 L32 b1-32-2 b2-32-1 R32 R32 L16' +
                ' | b0-32-6 b1-32-3 b2-32-3 R32 R32 L32 L32 b1-32-2 b2-32-1 R32 R32 L16',
          blen: 1
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Nine Stroke Roll',
          pattern: 'b0-32-7 b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b1-32-3 b2-32-3 R32 R32 L32 L32 R4' +
                ' | b0-32-7 b1-32-3 b2-32-3 L32 L32 R32 R32' +
                ' | b1-32-3 b2-32-3 L32 L32 R32 R32 L4',
          blen: 1
        },
        {
          label: 'Ten Stroke Roll',
          pattern: 'b0-32-7 b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b0-32-1 b1-32-1 R32 L32 Q16' +
                ' | b0-32-7 b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b0-32-1 b1-32-1 R32 L32 Q16',
          blen: 1
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Eleven Stroke Roll',
          pattern: 'b0-32-7 b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b0-32-2 b1-32-2 b2-32-1 R32 R32 L16 Q8' +
                ' | b0-32-7 b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b1-32-3 b2-32-3 R32 R32 L32 L32' +
                ' | b0-32-2 b1-32-2 b2-32-1 R32 R32 L16 Q8',
          blen: 1
        },
        {
          label: '',
          pattern: '',
          blen: 1
        }
      ]
    },
    {
      label: 'Single Paradiddle',
      patterns: [
        {
          label: 'Standard',
          pattern: 'b0-16-3 b1-16-3 R16 L16 R16 R16' +
                ' | b0-16-3 b1-16-3 L16 R16 L16 L16',
          blen: 2
        },
        {
          label: 'Reverse',
          pattern: 'b0-16-3 b1-16-3 R16 R16 L16 R16' +
                ' | b0-16-3 b1-16-3 L16 L16 R16 L16',
          blen: 2
        },
        {
          label: 'Inward',
          pattern: 'b0-16-3 b1-16-3 R16 L16 L16 R16' +
                ' | b0-16-3 b1-16-3 L16 R16 R16 L16',
          blen: 2
        },
        {
          label: 'Delayed',
          pattern: 'b0-16-3 b1-16-3 R16 L16 R16 L16' +
                ' | b0-16-3 b1-16-3 L16 R16 L16 R16',
          blen: 2
        }
      ]
    },
    {
      label: 'Double Paradiddle',
      // ^6
      patterns: [
        {
          label: 'Standard',
          pattern: 't6 b0-16-5 b1-16-5 R16 L16 R16 L16 R16 R16' +
                ' | t6 b0-16-5 b1-16-5 L16 R16 L16 R16 L16 L16',
          blen: 2
        },
        {
          label: 'Reverse',
          pattern: 't6 b0-16-5 b1-16-5 R16 R16 L16 R16 L16 R16' +
                ' | t6 b0-16-5 b1-16-5 L16 L16 R16 L16 R16 L16',
          blen: 2
        },
        {
          label: 'Inward',
          pattern: 't6 b0-16-5 b1-16-5 R16 L16 R16 R16 L16 R16' +
                ' | t6 b0-16-5 b1-16-5 L16 R16 L16 L16 R16 L16',
          blen: 2
        },
        {
          label: 'Delayed',
          pattern: 't6 b0-16-5 b1-16-5 R16 L16 R16 L16 R16 L16' +
                ' | t6 b0-16-5 b1-16-5 L16 R16 L16 R16 L16 R16',
          blen: 2
        }
      ]
    },
    {
      label: 'Triple Paradiddle',
      patterns: [
        {
          label: 'Standard',
          pattern: 'b0-32-7 b1-32-7 b2-32-7 R32 L32 R32 L32 | R32 L32 R32 R32' +
                ' | b0-32-7 b1-32-7 b2-32-7 L32 R32 L32 R32 | L32 R32 L32 L32',
          blen: 2
        },
        {
          label: 'Reverse',
          pattern: 'b0-32-7 b1-32-7 b2-32-7 R32 L32 R32 L32 | R32 R32 L32 R32' +
                ' | b0-32-7 b1-32-7 b2-32-7 L32 R32 L32 R32 | L32 L32 R32 L32',
          blen: 2
        },
        {
          label: 'Inward',
          pattern: 'b0-32-7 b1-32-7 b2-32-7 R32 L32 R32 L32 | R32 L32 L32 R32' +
                ' | b0-32-7 b1-32-7 b2-32-7 L32 R32 L32 R32 | L32 R32 R32 L32',
          blen: 2
        },
        {
          label: 'Delayed',
          pattern: 'b0-32-7 b1-32-7 b2-32-7 R32 L32 R32 L32 | R32 L32 R32 L32' +
                ' | b0-32-7 b1-32-7 b2-32-7 L32 R32 L32 R32 | L32 R32 L32 R32',
          blen: 2
        }
      ]
    },
    {
      label: 'Paradiddle-Diddle',
      // ^6
      patterns: [
        {
          label: 'Standard',
          pattern: 't6 b0-16-5 b1-16-5 R16 L16 R16 R16 L16 L16' +
                ' | t6 b0-16-5 b1-16-5 R16 L16 R16 R16 L16 L16',
          blen: 2
        },
        {
          label: 'Reverse',
          pattern: 't6 b0-16-5 b1-16-5 R16 R16 L16 L16 R16 L16' +
                ' | t6 b0-16-5 b1-16-5 R16 R16 L16 L16 R16 L16',
          blen: 2
        },
        {
          label: 'Inward',
          pattern: 't6 b0-16-5 b1-16-5 R16 L16 L16 R16 R16 L16' +
                ' | t6 b0-16-5 b1-16-5 R16 L16 L16 R16 R16 L16',
          blen: 2
        },
        {
          label: 'Delayed',
          pattern: 't6 b0-16-5 b1-16-5 R16 R16 L16 R16 L16 L16' +
                ' | t6 b0-16-5 b1-16-5 R16 R16 L16 R16 L16 L16',
          blen: 2
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Flam',
          pattern: 'l1 R4 r1 L4',
          blen: 2
        },
        {
          label: 'Flam Accent',
          pattern: 'b0-8-2 l1 R8 L8 R8' +
                ' | b0-8-2 r1 L8 R8 L8',
          blen: 1
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Flam Tap',
          pattern: 'b0-16-3 b1-16-3 l1 R16 R16 r1 L16 L16' +
                ' | b0-16-3 b1-16-3 l1 R16 R16 r1 L16 L16',
          blen: 2
        },
        {
          label: 'Flamacue',
          pattern: 'b0-16-3 b1-16-3 l1 R16 L16 R16 L16 | l1 R4',
          blen: 2
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Flam Paradiddle',
          pattern: 'b0-16-3 b1-16-3 l1 R16 L16 R16 R16' +
                ' | b0-16-3 b1-16-3 r1 L16 R16 L16 L16',
          blen: 2
        },
        {
          label: 'Single Flammed Mill',
          pattern: 'b0-16-3 b1-16-3 l1 R16 R16 L16 R16' +
                ' | b0-16-3 b1-16-3 r1 L16 L16 R16 L16',
          blen: 2
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Flam Paradiddle-Diddle',
          pattern: 't6 b0-16-5 b1-16-5 l1 R16 L16 R16 R16 L16 L16' +
                ' | t6 b0-16-5 b1-16-5 r1 L16 R16 L16 L16 R16 R16',
          blen: 2
        },
        {
          label: 'Pataflafla',
          pattern: 'b0-16-3 b1-16-3 l1 R16 L16 R16 r1 L16' +
                ' | b0-16-3 b1-16-3 l1 R16 L16 R16 r1 L16',
          blen: 2
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Swiss Army Triplet',
          // ^3
          pattern: 't3 b0-16-5 b1-16-2 l1 R16 R16 r1 L16' +
                ' | t3 b1-16-2 l1 R16 R16 r1 L16',
          blen: 2
        },
        {
          label: 'Inverted Flam Tap',
          pattern: 'b0-16-3 b1-16-3 l1 R16 L16 L16 R16' +
                ' | b0-16-3 b1-16-3 l1 R16 L16 L16 R16',
          blen: 2
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Flam Drag',
          pattern: 'b0-8-2 l1 R8 b1-16-1 L16 L16 R8' +
                ' | b0-8-2 r1 L8 b1-16-1 R16 R16 L8',
          blen: 1
        },
        {
          label: '',
          pattern: '',
          blen: 2
        }
      ]
    },

    {
      label: '',
      patterns: [
        {
          label: 'Drag',
          pattern: 'l2 R4 r2 L4',
          blen: 2
        },
        {
          label: 'Single Drag Tap',
          pattern: 'b0-8-1 l2 R8 L8' +
                ' | b0-8-1 r2 L8 R8',
          blen: 2
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Double Drag Tap',
          pattern: 'b0-8-2 l2 R8 l2 R8 L8' +
                ' | b0-8-2 r2 L8 r2 L8 R8',
          blen: 1
        },
        {
          label: 'Lesson 25',
          pattern: 'b0-16-2 b1-16-1 l2 R16 L16 R8' +
                ' | b0-16-2 b1-16-1 l2 R16 L16 R8',
          blen: 2
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Single Dragadiddle',
          // x
          pattern: 'b0-16-3 b1-16-3 r1 R16 L16 R16 R16' +
                ' | b0-16-3 b1-16-3 l1 L16 R16 L16 L16',
          blen: 2
        },
        {
          label: 'Drag Paradiddle #1',
          pattern: 'b0-16-5 R8 b1-16-3 l2 R16 L16 R16 R16' +
                ' | b0-16-5 L8 b1-16-3 r2 L16 R16 L16 L16',
          blen: 1
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Drag Paradiddle #2',
          pattern: 'b0-8-1 R8 l2 R8 b0-16-3 b1-16-3 l2 R16 L16 R16 R16' +
                ' | b0-8-1 L8 r2 L8 b0-16-3 b1-16-3 r2 L16 R16 L16 L16',
          blen: 1
        },
        {
          label: 'Single Ratamacue',
          // ^3
          pattern: 't3 b0-16-3 b1-16-2 l2 R16 L16 R16 L8' +
                ' | t3 b0-16-3 b1-16-2 r2 L16 R16 L16 R8',
          blen: 1
        }
      ]
    },
    {
      label: '',
      patterns: [
        {
          label: 'Double Ratamacue',
          // ^3
          pattern: 'b0-8-1 l2 R8 t3 b0-16-2 b1-16-2 l2 R16 L16 b0-16-1 R16 L8' +
                ' | b0-8-1 r2 L8 t3 b0-16-2 b1-16-2 r2 L16 R16 b0-16-1 L16 R8',
          blen: 1
        },
        {
          label: 'Triple Ratamacue',
          // ^3
          pattern: 'b0-16-2 l2 R8 l2 R8 | t3 b0-16-3 b1-16-2 l2 R16 L16 R16 L8' +
                ' | b0-16-2 r2 L8 r2 L8 | t3 b0-16-3 b1-16-2 r2 L16 R16 L16 R8',
          blen: 1
        }
      ]
    },
    {
      label: 'AAA',
      patterns: [
      ]
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

  var debug = true;
  var patStroke = '#000000';
  var patStrokeR = '#ffffff';
  var fontFamily = 'Arial';
  var fontSize = 16;
  var fontSizeSmall = fontSize * 0.75;
  var strokeWidth = 0.5;

  var globalPatWidth = 800;
  var patHeight = 60;

  var notePath = 'M 0 0c 0 5 -7.333 5.333 -7.333 1.667' +
    'C -7.334 -2.334 0 -4.667 0 0z';

  var appendPattern = function(x, y,
      patWidth, patternName, pattern, beatLength) {

    var pat = $s('g').attrs({
      transform: 'translate(' + x + ' ' + y + ')' });
    svg.append(pat);

    if (debug) {
      pat.append($s('rect').attrs({
        x: 0, y: 0, width: patWidth, height: patHeight,
        fill: 'none', 'stroke-linecap': 'butt',
        'stroke-width': strokeWidth,
        stroke: '#fc6' }) );
    }

    var appendNote = function(label, x, y) {
      var text = $s('text').attrs({ x: x, y: y, 'text-anchor': 'middle',
        'font-family': fontFamily, 'font-size': fontSizeSmall,
        fill: patStroke, stroke: 'none' });
      text.$el.textContent = label;
      pat.append(text);
      if (label == 'R') {
      } else if (label == 'L') {
      } else if (label == 'l') {
      } else if (label == 'r') {
      } else {
        throw new label;
      }
    };

    var x = 0;
    var t = 0;
    var tRe = /t(\d+)/;
    var bRe = /b(\d+)-(\d+)-(\d+)/;
    var pRe = /([RLQrl])(\d+)/;

    pattern.split(/[\s|]+/g).forEach(function(note, i) {

      var nx = x * patWidth * beatLength;

      var y1 = patHeight * 0.2;
      var y2 = patHeight * 0.8;
      var fr = 0.28;

      if (note.match(pRe) ) {

        var n = RegExp.$1;
        var d = +RegExp.$2;

        if (n == 'l' || n == 'r') {

          var fx = nx - 2;
          for (var i = 0; i < d; i += 1) {
            fx -= 10;
            var yn = y2 + 1.5;
            pat.append($s('path').attrs({ d: pathBuilder().
              M(fx, (y1 + yn) / 2).
              L(fx, yn).build(),
              fill: 'none', 'stroke-linecap': 'square',
              'stroke-width': strokeWidth, stroke: patStroke }) );
            pat.append($s('path').attrs({ d: notePath,
              transform: 'translate(' + fx + ' ' + yn + ') scale(0.6)',
              fill: patStroke, 'stroke-width': strokeWidth, stroke: patStroke
            }) );
            appendNote(n.toUpperCase(),
              fx - fontSizeSmall * fr, patHeight + fontSizeSmall);
          }

        } else {

          if (n == 'L' || n == 'R') {
  
            pat.append($s('path').attrs({ d: pathBuilder().
              M(nx, y1).
              L(nx, y2).build(),
              fill: 'none', 'stroke-linecap': 'square',
              'stroke-width': strokeWidth, stroke: patStroke }) );
            pat.append($s('path').attrs({ d: notePath,
              transform: 'translate(' + nx + ' ' + y2 + ')',
              fill: patStroke, 'stroke-width': strokeWidth, stroke: patStroke
            }) );
            appendNote(n, nx - fontSizeSmall * fr, patHeight + fontSizeSmall);
  
          } else if (n == 'Q') {

            pat.append($s('path').attrs({ d: pathBuilder().
              M(nx, y1).
              L(nx, y2).build(),
              fill: 'none', 'stroke-linecap': 'square',
              'stroke-width': strokeWidth * 4, stroke: 'red' }) );
          }
          if (t > 0) {
            x += 1 / d * 2 / 3;
            t -= 1;
          } else {
            x += 1 / d;
          }
        }

      } else if (note.match(tRe) ) {

        t = +RegExp.$1;
        console.log(note, t);

      } else if (note.match(bRe) ) {

        var bh = 3;
        var pos = +RegExp.$1;
        var d = +RegExp.$2;
        var len = +RegExp.$3;
        if (t > 0) {
          len = len * 2 / 3;
        }
        pat.append($s('rect').attrs({
          x: nx, y: y1 + bh * 2.4 * pos,
          width: patWidth / d * len * beatLength,
          height: bh,
          fill: patStroke, 'stroke-width': strokeWidth, stroke: patStroke }) );
      }
    });

    !function() {
        var text = $s('text').attrs({
          x: 0,
          y: -fontSize * 0.2,
  //        'text-anchor': 'middle',
          'font-family': fontFamily, 'font-size': fontSize });
        text.$el.textContent = patternName;
        pat.append(text);
    }();
  };

  var appendPatternGroup = function(x, y, groupName, patterns) {

    var patGrp = $s('g').attrs({
      transform: 'translate(' + x + ' ' + y + ')' });
    svg.append(patGrp);

    if (debug) {
      patGrp.append($s('rect').attrs({
        x: 0, y: 0,
        width: globalPatWidth,
        height: patHeight + vGapPat,
        fill: 'none', 'stroke-linecap': 'butt',
        'stroke-width': strokeWidth, stroke: '#66c' }) );
    }

    !function() {
        var text = $s('text').attrs({
          x: 0,
          y: -fontSize * 0.2,
  //        'text-anchor': 'middle',
          'font-family': fontFamily, 'font-size': fontSize });
        text.$el.textContent = groupName;
        patGrp.append(text);
    }();

    var patWidth = (globalPatWidth + hGap) / patterns.length - hGap;
    for (var i = 0; i < patterns.length; i += 1) {
      appendPattern(
        x,
        y + vGapPat,
        patWidth,
        patterns[i].label,
        patterns[i].pattern, patterns[i].blen);
      x += patWidth + hGap;
    }

  };

  var marginLeft = 40;
  var marginRight = 30;
  var marginTop = 60;
  var marginBottom = 60;

  var hGap = 50;
  var vGap = 80;
  var vGapPat = 20;

  var width = globalPatWidth + marginLeft + marginRight;
  var height = (patHeight + vGap) * patternGroups.length -
    vGap + marginTop + marginBottom;

  var svgHolder = document.createElement('div');
  document.body.appendChild(svgHolder);
  var svg = $s('svg').attrs({
    width: width + 'px', height: height + 'px', xmlns: svgNamespace });
  svgHolder.appendChild(svg.$el);

  // bg
  if (debug) {
    svg.append($s('rect').attrs({
      x: 0, y: 0, width: width, height: height,
      fill: '#f0f0f0', stroke: '#00f' }));
  }

  var x = marginLeft;
  var y = marginTop;
  for (var i = 0; i < patternGroups.length; i += 1) {
    var patterns = patternGroups[i].patterns;
    appendPatternGroup(x, y, patternGroups[i].label, patterns);
    y += patHeight + vGap;
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
    a.download = 'drum-patterns.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
  document.body.appendChild(button);
});
