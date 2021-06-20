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
      clips: [
        'A', 'B', 'C', 'D', 'E', 'F'
      ],
      maxClips: 4
    },
    watch: {
      currentFrame: function(currentFrame) {
        this.render(this.$refs.cv.getContext('2d'), currentFrame);
      }
    },
    computed: {
      numFrames: function() {
        return this.clips.length;
      }
    },
    methods: {
      render: function(ctx, currentFrame) {

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.strokeStyle = '#ff0';
        ctx.lineWidth = 4;

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

        var clips = this.clips;
        var maxClips = this.maxClips;
//        var grpIndex = ~~( (currentFrame + maxClips - 1) / maxClips) + 1;

        var y = 700;
        var width = 200;
        var height = 100;

        for (var i = 0; i < maxClips; i += 1) {
          var clipFrame = ~~(currentFrame / maxClips) * maxClips + i;
          if (clipFrame < clips.length) {

            var x = this.width / 2 + i * width - ~~(maxClips * width / 2);
            var text = clips[clipFrame];

            if (clipFrame == currentFrame) {
              ctx.fillStyle = 'rgba(255,255,255,0.5)';
              ctx.fillRect(x, y, width, height);
            }
  
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.strokeRect(x, y, width, height);
  
            ctx.textAlign = 'center';
            ctx.textBaseline  = 'middle';
            ctx.font = 'bold 48px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.fillText(text, x + width / 2, y + height / 2);
          }
        }



      },
      download_clickHandler: function() {

        console.log('download');

        var ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = this.width;
        ctx.canvas.height = this.height;

        var currentFrame = 0;
        var zip = new JSZip();

        var putFile = function() {
          currentFrame += 1;
          if (currentFrame < this.numFrames) {
            this.render(ctx, currentFrame);
            ctx.canvas.toBlob(function(data) {
              var seq = '' + currentFrame;
              while (seq.length < 3) {
                seq = '0' + seq;
              }
              zip.file('img' + seq + '.png', data);
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
