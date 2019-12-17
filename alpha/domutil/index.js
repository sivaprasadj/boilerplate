var domutil = function() {

  'use strict';

  var objectWrapper = function(_this, $el) {
    Object.defineProperty(_this, 'on', {
      get: function() {
        return function(type, listener) {
          $el.addEventListener(type, listener);
          return _this;
        };
      }
    });
    Object.defineProperty(_this, 'off', {
      get: function() {
        return function(type, listener) {
          $el.removeEventListener(type, listener);
          return _this;
        };
      }
    });
    return _this;
  };

  var eventTarget = function(_this, tagName, factory) {
    var map = {};
    var listeners = function(t) {
      return map[t] || (map[t] = []);
    }
    Object.defineProperty(_this, 'trigger', {
      get: function() {
        return function(type, detail) {
          var event = { type: type };
          listeners(type).forEach(function(l) {
            l.call(_this, event, detail);
          });
          return _this;
        };
      }
    });
    Object.defineProperty(_this, 'on', {
      get: function() {
        return function(type, listener) {
          listeners(type).push(listener);
          return _this;
        };
      }
    });
    Object.defineProperty(_this, 'off', {
      get: function() {
        return function(type, listener) {
          map[type] = listeners(type).filter(function(l) {
            return l != listener;
          });
          return _this;
        };
      }
    });
    return _this;
  };

  var dom = function(_this, tagName, factory, children) {
    eventTarget(_this);
    var $el = factory(tagName);
    (children || []).forEach(function(child) {
      $el.appendChild(child.$el);
    });
    Object.defineProperty(_this, '$el', {
      get: function() { return $el; }
    });
    Object.defineProperty(_this, 'attrs', {
      get: function() {
        return function(attrs) {
          for (var k in attrs) {
            $el.setAttribute(k, attrs[k]);
          }
          return _this;
        };
      }
    });
    Object.defineProperty(_this, 'props', {
      get: function() {
        return function(props) {
          for (var k in props) {
            $el[k] = props[k];
          }
          return _this;
        };
      }
    });
    Object.defineProperty(_this, 'style', {
      get: function() {
        return function(style) {
          for (var k in style) {
            $el.style[k] = style[k];
          }
          return _this;
        };
      }
    });
    return _this;
  };

  var htmlFactory = function(tagName) {
    return document.createElement(tagName);
  };
  var html = function(tagName, children) {
    var _this = {};
    dom(_this, tagName, htmlFactory, children);
    return _this;
  };

  var svgFactory = function(tagName) {
    return document.createElementNS('http://www.w3.org/2000/svg', tagName);
  };
  var svg = function(tagName, children) {
    var _this = {};
    dom(_this, tagName, svgFactory, children);
    return _this;
  };

  return {
    $: function(o) { return objectWrapper({}, o); },
    html: html,
    svg: svg
  };
}();
