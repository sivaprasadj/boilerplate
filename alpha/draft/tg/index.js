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
            '<rect fill="#c0ccc0" stroke="none"' +
              ' x="0" y="0" width="220" height="90" />' +
            '<circle ref="barAx" fill="#000" stroke="none" opacity="0"' +
              ' cx="110" cy="92" r="12" />' +
            '<g v-for="r in barRange()" :transform="barTran(r)">' +
              '<path ref="bars" fill="#000" stroke="none" opacity="0"' +
                ' d="M-0.5 -15L-5 -84L0 -90L5 -84L0.5 -15Z" />' +
            '</g>' +
            '<circle ref="lPoint" fill="#000" stroke="none" opacity="0"' +
              ' cx="25" cy="25" r="16" />' +
            '<circle ref="rPoint" fill="#000" stroke="none" opacity="0"' +
              ' cx="195" cy="25" r="16" />' +
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

              !function() {

                var on = '1.0';
                var off = '0.05';

                this.$refs.barAx.setAttribute('opacity', on);

                var bars = this.$refs.bars;

                // reset bars
                var barState = {};
                !function() {
                  for (var b = 0; b < bars.length; b += 1) {
                    bars[b].setAttribute('opacity', barState[b] = off);
                  }
                }();

                var step;
                var s0, lastS0 = null;
                var s1, lastS1 = null;

                var onframe = function(ft) {

                  step = t * this.params.stepPerTime;
                  s0 = Math.floor(step / this.params.div) % 2 == 0;
                  s1 = Math.floor(step / this.params.div *
                      bars.length) % (bars.length * 2);

                  if (s1 < bars.length) {
                  } else {
                    s1 = bars.length * 2 - 1 - s1;
                  }

                  if (lastS0 !== s0) {
                    if (s0) {
                      this.$refs.lPoint.setAttribute('opacity', on);
                      this.$refs.rPoint.setAttribute('opacity', off);
                    } else {
                      this.$refs.lPoint.setAttribute('opacity', off);
                      this.$refs.rPoint.setAttribute('opacity', on);
                    }
                    lastS0 = s0;
                  }

                  if (lastS1 !== s1) {
                    for (var b = 0; b < bars.length; b += 1) {
                      var state = b == s1? on : off;
                      if (barState[b] !== state) {
                        bars[b].setAttribute('opacity', barState[b] = state);
                      }
                    }
                    lastS1 = s1;
                  }

                  if (this.audioContext) {
                    window.requestAnimationFrame(onframe);
                  }

                }.bind(this);

                window.requestAnimationFrame(onframe);

              }.bind(this)();

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
        }
      }
    })
  });

}();
