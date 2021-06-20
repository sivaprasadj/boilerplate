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
      numFrames: 12,
      currentFrame: 0,
      clips: [
        'A', 'B', 'C', 'D', 'E', 'F'
      ]
    },
    computed: {
    },
    watch: {
      currentFrame: function(currentFrame) {
        this.render(this.$refs.cv.getContext('2d'), currentFrame);
      }
    },
    methods: {
      getClipList: function(currentFrame) {
        var maxClips= 4;
        var index = +currentFrame + 1;
        var clips = this.clips;
        var clipList = [
          {
            x: 10,
            y: 10,
            width: 200,
            height: 50,
            text: 'X' + index
          },
          {
            x: 250,
            y: 10,
            width: 200,
            height: 50,
            text: 'Y' + index
          }
        ];
        return clipList;
      },
      render: function(ctx, currentFrame) {

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.fillStyle = 'rgba(0,0,255,1)';
        ctx.fillRect(0, 0, 100, 100);
        ctx.fillStyle = 'rgba(0,0,255,0.5)';
        ctx.fillRect(100, 100, 100, 100);

        ctx.textAlign = 'center';
        ctx.textBaseline  = 'middle';
        ctx.font = 'bold 48px sans-serif';

        this.getClipList(currentFrame).forEach(function(clip) {

          ctx.fillStyle = '#0cf';
          ctx.fillRect(clip.x, clip.y, clip.width, clip.height);

          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 4;
          ctx.strokeRect(clip.x, clip.y, clip.width, clip.height);

          ctx.fillStyle = '#fff';
          ctx.fillText(clip.text,
              clip.x + clip.width / 2,
              clip.y + clip.height / 2);
        });

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
              zip.file(currentFrame + '.png', data);
              window.setTimeout(putFile, 0);
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
