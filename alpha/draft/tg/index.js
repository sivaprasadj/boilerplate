'use strict'

!function() {

  window.addEventListener('load', function() {

    var components = {
      metronome: {
        template:
          '<span style="display:none;"></span>',
        props: {
          beat: { type: Number, default: 4 },
          gain: { type: Number, default: -40 },
          tempo: { type: Number, default: 120 },
          mute: { type: Boolean, default: false }
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
            var beat = this.beat;
            var tempo =  this.tempo;
            var mute = this.mute;
            var freq = 440 * Math.exp(/* E note */ 7 / 12 * Math.log(2) );
            var vol = mute? 0 : Math.exp(this.gain / 20 * Math.log(10) );
            var numUnitsPerStep = 16 * Math.max(1, Math.ceil(120 / tempo) );
            var stepPerTime = numUnitsPerStep * tempo / 60;
            return {
              freq: freq, beat: beat, vol: vol,
              numUnitsPerStep: numUnitsPerStep,
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
              var freq, vol, step, lastStep = -1;
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
                    freq = step % (this.params.beat * this.params.numUnitsPerStep) == 0?
                        this.params.freq * 2 : this.params.freq;
                    vol = step % this.params.numUnitsPerStep == 0? this.params.vol : 0;
                    lastStep = step;
                    this.$emit('step', { step: step,
                      beat: this.params.beat, numUnitsPerStep: this.params.numUnitsPerStep });
                  }

                  chData[i] = vol * wave(2 * Math.PI * freq * t);
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
      },
      metronomeView: {
        template:
          '<svg xmlns="http://www.w3.org/2000/svg"' +
            ' style="x-display: none; overflow: hidden;"' +
            ' width="220" height="90"' +
            ' viewBox="0 0 220 90" >' +
            '<rect fill="#c0ccc0" stroke="none"' +
              ' x="0" y="0" width="220" height="90" />' +
            '<circle ref="barAx" fill="#000" stroke="none" :opacity="cOp"' +
              ' cx="110" cy="92" r="12" />' +
            '<g v-for="bar in bars" :transform="bar.tran">' +
              '<path ref="bars" fill="#000" stroke="none" :opacity="bar.op"' +
                ' d="M-0.5 -15L-5 -84L0 -90L5 -84L0.5 -15Z" />' +
            '</g>' +
            '<circle ref="lPoint" fill="#000" stroke="none" :opacity="lOp"' +
              ' cx="25" cy="25" r="16" />' +
            '<circle ref="rPoint" fill="#000" stroke="none" :opacity="rOp"' +
              ' cx="195" cy="25" r="16" />' +
          '</svg>',
        data: function() {
          return {
            active: false, cOp: '0', lOp: '0', rOp: '0', bars: []
          };
        },
        mounted: function() {
          var defaultOpacity = '0.1';
          this.cOp = this.lOp = this.rOp = defaultOpacity;
          var bars = [];
          var l = 6;
          for (var i = -l; i <= l; i += 1) {
            bars.push({
              n: i,
              tran: 'translate(110 92) rotate(' + (i * 7.75) + ')',
              op: defaultOpacity
            });
          }
          this.bars = bars;


          var onframe = function() {
            if (this.active) {
              window.requestAnimationFrame(onframe);
            }
          }.bind(this);

          this.active = true;
          window.requestAnimationFrame(onframe);
        },
        beforeDestroy: function() {
          this.active = false;
        }
      }
    };

    new Vue({
      el: '#app',
      components: components,
      data: {
        beat: 4,
        gain: -30,
        tempo: 120,
        mute: false,
        playing: false
      },
      methods: {
        start_clickHandler: function() {
          var metronome = this.$refs.metronome;
          if (!metronome.playing) {
            metronome.start();
          } else {
            metronome.stop();
          }
          this.playing = metronome.playing;
        }
      },
      mounted: function() {
        this.$refs.metronome.$on('step', function(event) {
          if (event.step % event.numUnitsPerStep == 0) {
            console.log(event);
          }
        });
      }
    })
  });

}();
