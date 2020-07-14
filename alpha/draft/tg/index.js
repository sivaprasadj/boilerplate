'use strict'

!function() {

  window.addEventListener('load', function() {

    var components = {
      metronome: {
        template: '<span style="display:none;">metronome</span>',
        props: {
          beat: { type: Number, default: 4 },
          tempo: { type: Number, default: 120 },
          gain: { type: Number, default: -40 },
          mute: { type: Boolean, default: false }
        },
        data: function() {
          return {
            audioContext: null,
            reset: function() {}
          };
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
              beat: beat, tempo: tempo, freq: freq, vol: vol,
              numUnitsPerStep: numUnitsPerStep,
              stepPerTime: stepPerTime
            }; 
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
                  }

                  chData[i] = vol * wave(2 * Math.PI * freq * t);
                  t += dt;
                }

              }.bind(this);

              scriptNode.connect(gainNode);
              this.audioContext = audioContext;
              var _met = this;
              this.$emit('start', {
                getTimestamp: function() { return t; },
                getBeat: function() { return _met.params.beat; },
                getTempo: function() { return _met.params.tempo; }
              });
            }
          },
          stop: function() {
            if (this.audioContext) {
              this.audioContext.close();
              this.audioContext = null;
              this.$emit('stop');
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
        props: {
          intf: { type: Object, default: null }
        },
        data: function() {
          return {
            active: false, cOp: '0', lOp: '0', rOp: '0', bars: []
          };
        },
        mounted: function() {

          var activeOpacity = '1';
          var defaultOpacity = '0.05';

          this.cOp = this.lOp = this.rOp = defaultOpacity;

          var bars = [];
          !function() {
            var l = 6;
            for (var i = -l; i <= l; i += 1) {
              bars.push({
                n: i,
                tran: 'translate(110 92) rotate(' + (i * 7.75) + ')',
                op: defaultOpacity
              });
            }
          }();
          this.bars = bars;

          var intf, beat, tempo;

          var frmT0 = 0, lastTs = 0, t, ts;
          var tranT, bt, i, op;
          var cOp, lOp, rOp;

          var onframe = function(frmT) {
            if (this.intf) {

              intf = this.intf;
              ts = intf.getTimestamp();
              beat = intf.getBeat();
              tempo = intf.getTempo();
              if (lastTs != ts) {
                frmT0 = frmT;
                lastTs = ts;
              }

              t =  ts + (frmT - frmT0) / 1000;

              tranT = (t * tempo / 120) % 1;
              if (tranT < 0.5) {
                lOp = activeOpacity;
                rOp = defaultOpacity;
              } else {
                lOp = defaultOpacity;
                rOp = activeOpacity;
              }
              cOp = activeOpacity;

              if (this.lOp !== lOp) this.lOp = lOp;
              if (this.rOp !== rOp) this.rOp = rOp;
              if (this.cOp !== cOp) this.cOp = cOp;

              bt = tranT * 2;
              if (bt >= 1) {
                bt = 2 - bt;
              }
              for (i = 0; i < bars.length; i += 1) {
                op = i == ~~(bt * bars.length)? activeOpacity : defaultOpacity;
                if (bars[i].op !== op) {
                  bars[i].op = op;
                };
              }
            } else {
              this.cOp = this.lOp = this.rOp = defaultOpacity;
              for (i = 0; i < bars.length; i += 1) {
                bars[i].op = defaultOpacity;
              }
            }

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
        playing: false,
        intf: null
      },
      methods: {
        start_clickHandler: function() {
          var metronome = this.$refs.metronome;
          if (!this.playing) {
            metronome.start();
          } else {
            metronome.stop();
          }
        },
        metronome_startHandler: function(intf) {
          this.playing = true;
          this.intf = intf;
        },
        metronome_stopHandler: function(intf) {
          this.playing = false;
          this.intf = null;
        }
      },
      mounted: function() {
      }
    })
  });

}();
