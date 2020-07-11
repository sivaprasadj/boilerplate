'use strict'

!function() {

  window.addEventListener('load', function() {

    new Vue({
      el: '#app',
      data: {
        playing: false,
        lfo: null,
        outL: null,
        outR: null,
        cout: null
      },
      components: {
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
      }
    })
  });

}();
