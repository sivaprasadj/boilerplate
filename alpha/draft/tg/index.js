'use strict'

!function() {

  var _2PI = 2 * Math.PI;

  var components = {

    osc: {
      template: '<span style="display:none;"></span>',
      props: {
        freq: { type: Number, default: 440 }
      },
      data: function() {
        return {
          v: 0
        }
      },
      methods: {
        out: function(t) {
          this.v += 0.01 * Math.cos(_2PI * this.freq * t);
          return this.v;
        }
      }
    },

    player: {
      template: '<span style="display:none;"></span>',
      props: {
        channels: { type: String, default: function() { return ''; } }
      },
      data: function() {
        return {
          audioContext: null
        };
      },
      methods: {
        start: function() {
          if (!this.audioContext) {

            var audioContext = new AudioContext();

            var bufferSize = 8192;
            var sampleRate = audioContext.sampleRate;
            var t = 0;
            var dt = 1 / sampleRate;

            var gainNode = audioContext.createGain();
            gainNode.gain.value = 0.2;
            gainNode.connect(audioContext.destination);
            var parse = function(channels) {
              return channels.replace(/^\s+|\s+$/g, '').
                  split(/[\s,]+/g).map(function(path) {
                var ref = path.split(/\./g);
                return this.$parent.$refs[ref[0]][ref[1]];
              }.bind(this) );
            }.bind(this);

            var channels = parse(this.channels);

            var outputBuffer, outputData, i, bufLen, c, numChannels;
            // no input, 2 output.
            var scriptNode = audioContext.
              createScriptProcessor(bufferSize, 0, numChannels);
            numChannels = channels.length;

            console.log(sampleRate, numChannels);

            scriptNode.onaudioprocess = function(event) {
              outputBuffer = event.outputBuffer;
              bufLen = outputBuffer.length;
              for (i = 0; i < bufLen; i += 1) {
                for (c = 0; c < numChannels; c += 1) {
                  outputBuffer.getChannelData(c)[i] = channels[c](t);
                }
                t += dt;
              }
            };
            scriptNode.connect(gainNode);

            this.audioContext = audioContext;
          }
        },
        stop: function() {
          if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
          }
        }
      },
      mounted: function() {
      }
    }
  };

  window.addEventListener('load', function() {

    new Vue({
      el: '#app',
      components: components,
      data: {
        playing: false
      },
      methods: {
        test_clickHandler: function() {
          this.playing = !this.playing;
          if (this.playing) {
            this.$refs.p1.start();
          } else {
            this.$refs.p1.stop();
          }
        }
      },
      mounted: function() {
        console.log('mounted.');
      }
    })
  });

}();
