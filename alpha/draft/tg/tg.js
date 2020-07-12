'use strict'

!function() {

  var components = {

    metronome: {
      template: '<span style="display:none;"></span>',
      props: {
        tempo: { type: Number, default: 120 },
        beat: { type: Number, default: 4 }
      },
      data: function() {
        return {
          audioContext: null,
          reset: function() {}
        };
      },
      watch: {
        params: function() {}
      },
      computed: {
        params: function() {
          var tempo =  this.tempo;
          var beat = this.beat;
          var freq = 440 * Math.exp(/* E note */ 7 / 12 * Math.log(2) );
          var gain = 0.05;
          var div = 16 * Math.max(1, Math.ceil(120 / tempo) );
          var stepPerTime = div * tempo / 60;
          return {
            freq: freq,
            gain: gain,
            beat: beat,
            div: div,
            stepPerTime: stepPerTime
          }; 
        },
        playing: function() {
          return !!this.audioContext;
        }
      },
      methods: {
        start: function() {

          if (!this.audioContext) {

            var bufferSize = 8192;
            var numChannels = 1;
            var freq, gain, step, lastStep = -1;
            var outputBuffer, i, bufLen, c, chData;

            var sine = function() {
              var v = 0;
              return function(n) {
                v += Math.cos(n);
                return v;
              }
            }();
            var square = function(n) {
              return Math.sin(n) < 0? -1 : 1;
            };
            var wave = square;

            var audioContext = new AudioContext();
            var sampleRate = audioContext.sampleRate;
            var t = 0;
            var dt = 1 / sampleRate;

            this.reset = function() {
              t = 0;
            };

            var gainNode = audioContext.createGain();
            gainNode.gain.value = 1;
            gainNode.connect(audioContext.destination);

            var scriptNode = audioContext.
              createScriptProcessor(bufferSize, 0, numChannels);

            scriptNode.onaudioprocess = function(event) {

              outputBuffer = event.outputBuffer;
              bufLen = outputBuffer.length;
              chData = outputBuffer.getChannelData(0);

              for (i = 0; i < bufLen; i += 1) {

                step = Math.floor(t * this.params.stepPerTime);

                if (lastStep != step) {
                  freq = step % (this.params.beat * this.params.div) == 0?
                      this.params.freq * 2 : this.params.freq;
                  gain = step % this.params.div == 0? this.params.gain : 0;
                  lastStep = step;
                  this.$emit('step', { step: step,
                    beat: this.params.beat, div: this.params.div });
                }

                chData[i] = gain * wave(2 * Math.PI * freq * t);
                t += dt;
              }

            }.bind(this);

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
      }
    }
  };

  for (var k in components) {
    Vue.component(k, components[k]);
  }

}();
