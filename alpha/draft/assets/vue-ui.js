'use strict'
!function() {

  var util = {
    trimRe: /^[\s\u3000]+|[\s\u3000]+$/,
    trim: function(value) {
      return typeof value == 'string'?
          value.replace(this.trimRe,'') : value;
    },
    rtrimRe: /[\s\u3000]+$/,
    rtrim: function(value) {
      return typeof value == 'string'?
          value.replace(this.rtrimRe,'') : value;
    }
  };

  var components = {};

  components['mycomp'] ={
      template: '<div class="mycomp"></div>'
  };

  components['number-input'] ={
      template: '<input type="text" class="number-input"' +
        ' @input="inputHandler"' +
        ' @blur="blurHandler"' +
        ' />',
      props: {
        value: { type: Number, default: null }
      },
      data: function() {
        return {
          lastValue: null
        };
      },
      watch: {
        value : function(newVal) {
          this.$el.value = this.format(this.lastValue = newVal);
        }
      },
      methods: {
        format: function(value) {
          return value === null? '' : '' + value;
        },
        parse: function(value) {
          value = util.trim(value);
          return value.length == 0? null : +value;
        },
        isValid: function(value) {
          // test if can parse.
          value = util.trim(value);
          return value.length == 0 || !isNaN(+value);
        },
        inputHandler: function(event) {
          var value = this.$el.value;
          if (this.isValid(value) ) {
            this.$emit('input', this.lastValue = this.parse(value) );
          }
        },
        blurHandler: function(event) {
          this.$el.value = this.format(this.lastValue);
        }
      }
  };

  !function() {
    for (var k in components) {
      Vue.component(k, components[k]);
    }
  }();

}();

