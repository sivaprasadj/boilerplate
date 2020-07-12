'use strict'

!function() {

  window.addEventListener('load', function() {

    new Vue({
      el: '#app',
      data: {
        tempo: 120,
        beat: 4
      },
      components: {
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
