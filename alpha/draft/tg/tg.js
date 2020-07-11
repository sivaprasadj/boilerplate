'use strict'

!function() {

  var _2PI = 2 * Math.PI;

  var parseInput = function(input) {
    if (typeof input == 'function') {
      return input;
    }
    var n = +input;
    if (typeof n == 'number' && !isNaN(n) ) {
      return function() { return n; };
    }
    return function() { return 0; };
  };

  var components = {

    osc: {
      template: '<span style="display:none;"><slot /></span>',
      props: {
        freq: { type: Object, default: 440 },
        gain: { type: Object, default: 0 }
      },
      data: function() {
        return {
          mounted: false,
          value: 0
        };
      },
      watch: {
        params: function() {
          var freq = parseInput(this.freq);
          var gain = parseInput(this.gain);
          var out = function(t) {
            this.value += Math.exp(gain(t) ) * Math.cos(_2PI * freq(t) * t);
            return this.value;
          }.bind(this);
          this.$emit('input', out);
        }
      },
      computed: {
        params: function() {
          return [ this.mounted, this.freq, this.gain ];
        }
      },
      mounted: function() {
        this.mounted = true;
      }
    },

    player: {
      template: '<span style="display:none;"><slot /></span>',
      props: {
        channels: { type: Array, default: function() { return []; } },
        gain: { type: Number, default: function() { return 0.002; } }
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
            var sampleRate = audioContext.sampleRate;
            var t = 0;
            var dt = 1 / sampleRate;

            var gainNode = audioContext.createGain();
            gainNode.gain.value = this.gain;
            gainNode.connect(audioContext.destination);

            var bufferSize = 8192;
            var channels = this.channels;
            var numChannels = channels.length;

            var outputBuffer, i, bufLen, c, chData;
            var scriptNode = audioContext.
              createScriptProcessor(bufferSize, 0, numChannels);

            scriptNode.onaudioprocess = function(event) {
              outputBuffer = event.outputBuffer;
              bufLen = outputBuffer.length;
              chData = [];
              for (c = 0; c < numChannels; c += 1) {
                chData.push(outputBuffer.getChannelData(c) );
              }
              for (i = 0; i < bufLen; i += 1) {
                for (c = 0; c < numChannels; c += 1) {
                  chData[c][i] = channels[c](t);
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

  for (var k in components) {
    Vue.component(k, components[k]);
  }

}();
