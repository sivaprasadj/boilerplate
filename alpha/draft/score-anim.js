//
//
//

'use strict'
!function() {
  new Vue({
    el: '#app',
    data: {
      width: 1920,
      height: 1080,
      currentFrame: 0,
/*      
      clips: [
        'A', 'B', 'C', 'D', 'E'
      ],
      
*/
      clips: (
        'G C G G D7 D7 D7 D7 ' +
        'G C G G A7 D7 G  G7 ' +
        'C C G G D7 D7 G G7 ' +
        'C C G G D7 D7 G G '
      ).replace(/^\s+|\s+$/g, '').split(/\s+/g)

    },
    watch: {
      currentFrame: function(currentFrame) {
        this.render(this.$refs.cv.getContext('2d'), currentFrame);
      }
    },
    computed: {
      numFrames: function() {
        return this.clips.length * 54;
      }
    },
    methods: {
      drawDebugFrames: function(ctx) {

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;

        var div = 4;
        for (var i = 1; i < div; i += 1) {

          ctx.beginPath();
          ctx.moveTo(0, i * this.height / div);
          ctx.lineTo(this.width, i * this.height / div);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(i * this.width / div, 0);
          ctx.lineTo(i * this.width / div, this.height);
          ctx.stroke();
        }
      },
      render: function(ctx, currentFrame, publish) {

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        if (!publish) {
          this.drawDebugFrames(ctx);
        }

        var clips = this.clips;
        var clipPos = currentFrame / this.numFrames * clips.length;
        var clipIndex = ~~clipPos;
        var clipRatio = clipPos - clipIndex;
        var fontFamily = 'sans-serif';

        var width = 400;
        var height = 220;
        var hGap = 20;
        var y = this.height / 2 - height - hGap / 2;

        var drawText = function(text, x, y, fillStyle, strokeStyle) {
            ctx.fillStyle = fillStyle;
            ctx.fillText(text, x, y);
            ctx.lineWidth = 4;
            ctx.strokeStyle = strokeStyle;
            ctx.strokeText(text, x, y);
        };

        var drawCell = function(text, x, y, current) {

          ctx.textAlign = 'center';
          ctx.textBaseline  = 'middle';
          ctx.font = 'bold 200px ' + fontFamily;

          if (current) {
            drawText(text, x + width / 2, y + height / 2, '#f00', '#fff');
          } else {
            drawText(text, x + width / 2, y + height / 2, '#fff', '#000');
          }
        };

        var drawTranCell = function(text1, text2, x, y, ratio) {

          ctx.textAlign = 'center';
          ctx.textBaseline  = 'middle';
          ctx.font = 'bold 200px ' + fontFamily;

          drawText(text2, x + width / 2, y + height / 2,
            'rgba(255,255,255,' + ratio + ')',
            'rgba(0,0,0,' + ratio + ')');
          drawText(text1, x + width / 2, y + height / 2,
            'rgba(255,0,0,' + (1 - ratio) + ')',
            'rgba(255,255,255,' + (1 - ratio) + ')');
        };

        var threshold = 0.25;
        var cellClipIndex = ~~(clipIndex / 2) * 2;

        !function() {
          var x = this.width / 2 - ~~(width / 2);
          var currText = cellClipIndex < clips.length?
            clips[cellClipIndex] : '';
          var nextText = cellClipIndex + 2 < clips.length?
            clips[cellClipIndex + 2] : '';
          if (cellClipIndex != clipIndex) {
            drawTranCell(currText, nextText, x, y,
              clipRatio > threshold? 1 : clipRatio / threshold);
          } else {
            drawCell(currText, x, y, cellClipIndex == clipIndex);
          }
        }.bind(this)();

        cellClipIndex += 1;

        !function() {
          var x = this.width / 2 - ~~(width / 2);
          var currText = cellClipIndex < clips.length?
            clips[cellClipIndex] : '';
          var prevText = cellClipIndex - 2 >= 0?
            clips[cellClipIndex - 2] : '';
          if (cellClipIndex != clipIndex) {
            drawTranCell(prevText, currText, x, y + height + 20,
              clipRatio > threshold? 1 : clipRatio / threshold);
          } else {
            drawCell(currText,
              x, y + height + hGap, cellClipIndex == clipIndex);
          }
        }.bind(this)();

      },
      download_clickHandler: function() {

        var ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = this.width;
        ctx.canvas.height = this.height;

        var currentFrame = 0;
        var zip = new JSZip();

        var putFile = function() {
          if (currentFrame < this.numFrames) {
            this.render(ctx, currentFrame, true);
            ctx.canvas.toBlob(function(data) {
              var seq = '' + (currentFrame + 1);
              while (seq.length < 6) {
                seq = '0' + seq;
              }
              var filename = 'img' + seq + '.png';
              zip.file(filename, data);
              currentFrame += 1;
              if (currentFrame % 10 == 0) {
                console.log(filename + ' created');
              }
              putFile();
            });
          } else {
            var filename = 'test.zip';
            zip.generateAsync({type: 'blob'}).then(function(content) {
              saveAs(content, filename);
            });
          }

        }.bind(this);

        putFile();
      }
    },
    mounted: function() {
      console.log('mounted');
      this.render(this.$refs.cv.getContext('2d'), this.currentFrame);
    }
  });
}();
