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
    },
    numRe: /^([\+\-]?)([0-9]+)(\.[0-9]+)?$/,
    isNumber: function(value) {
      return value.match(this.numRe);
    }
  };

  var components = {};
  var mixins = {};

  components['mycomp'] ={
      template: '<div class="mycomp"></div>'
  };

  mixins['input-base'] ={
    template: '<input type="text"' +
      ' :class="styleClass"' +
      ' @input="inputHandler"' +
      ' @focus="focusHandler"' +
      ' @blur="blurHandler"' +
      ' />',
    props: { value : {} },
    data: function() {
      return {
        _value: null,
        styleClass: '',
        inputOpts: {
          format: function(value) {
            return value === null? '' : '' + value;
          },
          parse: function(dispVal) {
            dispVal = util.trim(dispVal);
            return dispVal.length == 0? null : dispVal;
          },
          // test if can parse.
          isValid: function(dispVal) {
            return true;
          }
        }
      };
    },
    watch: {
      value: function(newVal) {
        this.setValue(newVal);
      }
    },
    methods: {
      setValue: function(value) {
        this.$el.value = this.inputOpts.format(this._value = value);
      },
      inputHandler: function(event) {
        var value = this.$el.value;
        if (this.inputOpts.isValid(value) ) {
          this.$emit('input', this.inputOpts.parse(value) );
        }
      },
      focusHandler: function(event) {
      },
      blurHandler: function(event) {
        var value = this.$el.value;
        if (!this.inputOpts.isValid(value) ) {
          // revert
          this.setValue(this._value);
        }
      }
    },
    mounted: function() {
      this.setValue(this.value);
    }
  };

  components['number-input'] ={
    mixins: [ mixins['input-base'] ],
    beforeMount: function() {
      this.styleClass = 'number-input';
      this.inputOpts = {
        format: function(value) {
          return value === null? '' : '' + value;
        },
        parse: function(dispVal) {
          dispVal = util.trim(dispVal);
          return dispVal.length == 0? null : +dispVal;
        },
        isValid: function(dispVal) {
          dispVal = util.trim(dispVal);
          return dispVal.length == 0 || util.isNumber(dispVal);
        }
      };
    }
  };

  !function() {
    for (var k in components) {
      Vue.component(k, components[k]);
    }
  }();

}();

