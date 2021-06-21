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
        'A', 'B', 'C', 'D', 'E', 'F'
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
        return this.clips.length * 16;
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

        var drawCell = function(text, x, y, current) {

          ctx.textAlign = 'center';
          ctx.textBaseline  = 'middle';
          ctx.font = 'bold 200px ' + fontFamily;

          if (current) {
            ctx.fillStyle = '#fff';
            ctx.fillText(text, x + width / 2, y + height / 2);
          } else {
            ctx.lineWidth = 4;
            ctx.strokeStyle = '#fff';
            ctx.strokeText(text, x + width / 2, y + height / 2);
          }
        };

        var drawTranCell = function(text1, text2, x, y, ratio) {

          ctx.textAlign = 'center';
          ctx.textBaseline  = 'middle';
          ctx.font = 'bold 200px ' + fontFamily;

          ctx.fillStyle = 'rgba(255,255,255,' + (1 - ratio) + ')';
          ctx.fillText(text1, x + width / 2, y + height / 2);
          ctx.lineWidth = 4;
          ctx.strokeStyle = 'rgba(255,255,255,' + ratio + ')';
          ctx.strokeText(text2, x + width / 2, y + height / 2);
        };

        var threshold = 0.25;
        var cellClipIndex = ~~(clipIndex / 2) * 2;
        if (clipIndex < clips.length) {
          var x = this.width / 2 - ~~(width / 2);
          var text = clips[cellClipIndex];
          if (cellClipIndex != clipIndex && cellClipIndex + 2 < clips.length) {
            drawTranCell(text, clips[cellClipIndex + 2], x, y,
              clipRatio > threshold? 1 : clipRatio / threshold);
          } else {
            drawCell(text, x, y, cellClipIndex == clipIndex);
          }
        }

        cellClipIndex += 1;
        if (cellClipIndex < clips.length) {
          var x = this.width / 2 - ~~(width / 2);
          var text = clips[cellClipIndex];
          if (cellClipIndex != clipIndex && cellClipIndex - 2 > 0) {
            drawCell(text, x, y + height + 20, cellClipIndex == clipIndex);
            drawTranCell(clips[cellClipIndex - 2], text, x, y + height + 20,
              clipRatio > threshold? 1 : clipRatio / threshold);
          } else {
            drawCell(text, x, y + height + hGap, cellClipIndex == clipIndex);
          }
        }

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
              zip.file('img' + seq + '.png', data);
              currentFrame += 1;
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
