'use strict'

!function() {
// 44 18
  window.addEventListener('load', function() {

    var components = {
      metronome: {
        template:
          '<svg xmlns="http://www.w3.org/2000/svg"' +
            ' style="x-display: none; overflow: hidden;"' +
            ' width="220" height="90"' +
            ' viewBox="0 0 220 90" >' +
            '<rect fill="#c0ccc0" stroke="none" x="0" y="0" width="220" height="90" />' +
            '<circle fill="#000" stroke="none" cx="25" cy="25" r="16" />' +
            '<circle fill="#000" stroke="none" cx="195" cy="25" r="16" />' +
            '<circle fill="#000" stroke="none" cx="110" cy="92" r="12" />' +
            '<g v-for="r in barRange()" :transform="barTran(r)">' +
              '<path fill="#000" stroke="none" d="M-1 -15L-4 -86L0 -90L4 -86L1 -15Z" />' +
            '</g>' +
          '</svg>',
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
          barRange: function() {
            var a = [];
            var l = 6;
            for (var i = -l; i <= l; i += 1) {
              a.push(i)
            }
            return a;
          },
          barTran: function(r) {
            return 'translate(110 92) rotate(' + (r * 7.75) + ')';
          },
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

    new Vue({
      el: '#app',
      components: components,
      data: {
        tempo: 120,
        beat: 4
      },
      methods: {
        start_clickHandler: function() {
          var metronome = this.$refs.metronome;
          if (!metronome.playing) {
            metronome.start();
          } else {
            metronome.stop();
          }
        },
        metronome_stepHandler: function(event) {
          if (event.step % (event.beat * event.div) ==  0) {
            console.log(event);
          } else if (event.step % event.div ==  0) {
            console.log('** ',  event);
          } 
        }
      }
    })
  });

}();
