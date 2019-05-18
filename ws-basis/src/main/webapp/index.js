//
// index.js
//

'use strict';

window.addEventListener('load', function() {

  //http://localhost:9880/ws-basis/
  var url = location.href.
    replace(/^http([s]?\:\/\/.+)\/[^\/]*$/, 'ws$1') + '/ws-ep';

  var opts = {
    HEARTBEAT_TIMEOUT : 10000,
    OFFLINE_TIMEOUT : 30000
  };

  var app = createWsApp({
    url : url,
    login : { action : 'login', user : 'anonymous' }
  });

  app.actions.login = function(data) {
    model.sid = data.sid;
    sendGeom();
  };

  app.actions.broadcast = function(data) {
    if (data.geom) {

      var client = model.clients[data.sid] || (model.clients[data.sid] = {});
      client.sid = data.sid;
      client.date = data.date;
      client.geom = data.geom;

      var clients = {};
      for (var sid in model.clients) {
        var client = model.clients[sid];
        if (data.date - client.date < opts.OFFLINE_TIMEOUT) {
          clients[sid] = client;
        } else {
          console.log('timeout:' + sid);
        }
      }
      model.clients = clients;

      log.textContent = JSON.stringify(model.clients, null, 2);
      miniView.trigger('update', model);
    }
  };

  var model = {
    sid : null,
    clients : {},
    left : 0,
    top : 0,
    getGeom : function() {
      return {
        left : this.left,
        top : this.top,
        width : window.innerWidth,
        height : window.innerHeight,
      }
    }
  };

  var sendGeom = function() {
    app.send({ action : 'broadcast', geom : model.getGeom() });
  };

  var timer = function(task, timeout) {
    var alive = false;
    var handler = function() {
      if (!alive) {
        return;
      }
      try {
        if (app.isAlive() ) {
          task();
        }
      } finally {
        window.setTimeout(handler, timeout)
      }
    }
    return {
      start : function() {
        alive = true;
        handler();
      },
      stop : function() {
        alive = false;
      }
    }
  };

  var heartbeat = timer(sendGeom, opts.HEARTBEAT_TIMEOUT);

  var observeWindowSize = function() {
    var lastSize = { width : 0, height : 0 };
    return timer(function() {
      var geom = model.getGeom();
      if (lastSize == null ||
          geom.width != lastSize.width ||
          geom.height != lastSize.height) {
        lastSize = geom;
        sendGeom();
      }
    }, 500);
  }();

  var util = {
    extend : function() {
      var o = arguments[0];
      for (var i = 1; i < arguments.length; i += 1) {
        var a = arguments[i];
        for (var k in a) {
          o[k] = a[k];
        }
      }
      return o;
    }
  };

  var createEventTarget = function() {
    var map = {};
    var listeners = function(type) {
      return map[type] || (map[type] = []);
    };
    return {
      trigger : function(type, detail) {
        var ctx = this;
        listeners(type).forEach(function(listener) {
          listener.call(ctx, { type : type }, detail);
        });
        return this;
      },
      on : function(type, listener) {
        listeners(type).push(listener);
        return this;
      },
      off : function(type, listener) {
        map[type] = listeners(type).filter(function(l) {
          return listener != l;
        });
        return this;
      }
    };
  };

  var elm = function(tagName, attrs) {
    return $(document.createElement(tagName) );
  };

  var svgElm = function(tagName, attrs) {
    return $(document.createElementNS(
        'http://www.w3.org/2000/svg', tagName) );
  };

  var $ = function(elm) {
    return {
      $el : elm,
      attrs : function(attrs) {
        for (var k in attrs) {
          elm.setAttribute(k, '' + attrs[k]);
        }
        return this;
      },
      style : function(attrs) {
        for (var k in attrs) {
          elm.style[k] = '' + attrs[k];
        }
        return this;
      },
      props : function(attrs) {
        for (var k in attrs) {
          elm[k] = '' + attrs[k];
        }
        return this;
      },
      append : function(e) {
        elm.appendChild(e.$el);
        return this;
      },
      remove : function() {
        elm.parentNode.removeChild(elm);
        return this;
      },
      on : function(t, l) { elm.addEventListener(t, l); return this; },
      off : function(t, l) { elm.removeEventListener(t, l); return this; }
    };
  };

  var mainView = function() {

    var model = util.extend(createEventTarget(), {
      
    });

    var setSize = function(size) {
      svg.attrs(size);
      bgRect.attrs(size);
    };

    var bgRect = svgElm('rect').
    attrs({ x : 0, y : 0, stroke : 'none', fill : 'rgba(0,0,0,0.05)' });
    var svg = svgElm('svg').style({
      position : 'absolute', left : '0px', top : '0px' }).append(bgRect).
      on('mousedown', function(event) {
        var mousemoveHandler = function(event) {

        };
        var mouseupHandler = function(event) {

          $(document).off('mousemove', mousemoveHandler).
            off('mouseup', mouseupHandler)
        };

        event.preventDefault();
        var dragPoint = { x : event.pageX, y : event.pageY };
        console.log(dragPoint);
        $(document).on('mousemove', mousemoveHandler).
          on('mouseup', mouseupHandler)
      });

    document.body.appendChild(svg.$el);

    setSize({ width : 400, height : 400 });

    return model;
  }();

  var miniView = function() {

    var model = util.extend(createEventTarget(), {
      width : 100,
      height : 70,
      rects : {}
    }).on('update', function(event, detail) {

      var rects = {};
      for (var sid in model.rects) {
        if (detail.clients[sid]) {
          rects[sid] = model.rects[sid];
        } else {
          model.rects[sid].remove();
        }
      }
      model.rects = rects;

      for (var sid in detail.clients) {

        var rect = rects[sid];
        if (!rect) {
          rect = svgElm('rect').style({
            pointerEvents : 'none',
            stroke : sid == detail.sid? '#f00' : '#000',
            strokeWidth : 1, fill : 'none' });
          rects[sid] = rect;
          (sid == detail.sid? g2 : g1).append(rect);
        }

        var client = detail.clients[sid];
        rect.left = client.geom.left;
        rect.top = client.geom.top;
        rect.width = client.geom.width;
        rect.height = client.geom.height;
      }

      updateRects();
    });

    var updateRects = function() {
      var scale = model.width / 10000;
      for (var sid in model.rects) {
        var rect = model.rects[sid];
        rect.attrs({
          x : Math.floor(rect.left * scale) + 0.5,
          y : Math.floor(rect.top * scale) + 0.5,
          width : Math.floor(rect.width * scale),
          height : Math.floor(rect.height * scale)
        });
      }
    };

    var setSize = function(size) {
      svg.attrs(size);
      bgRect.attrs(size);
    };

    var bgRect = svgElm('rect').
      attrs({ x : 0, y : 0, stroke : 'none', fill : 'rgba(0,0,0,0.05)' });
    var g1 = svgElm('g');
    var g2 = svgElm('g');
    var svg = svgElm('svg').style({
      position : 'absolute', left : '0px', top : '0px' }).
      append(bgRect).append(g1).append(g2);
    document.body.appendChild(svg.$el);

    setSize({ width : model.width, height : model.height });

    return model;
  }();

  var ctrls = elm('div').style({ position : 'absolute',
    right : '4px', bottom : '4px', padding : '4px',
    backgroundColor : 'rgba(0,0,0,0.05)' });
  document.body.appendChild(ctrls.$el);

  var createButton = function(label, clickHandler) {
    var button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', clickHandler);
    ctrls.$el.appendChild(button);
  };

  createButton(' reset ', function() {
    if (confirm('reset database?') ) {
      location.href = 'admin';
    }
  });
  createButton(' data ', function() {
    app.ajax({ url : 'clb' }).done(function(data){
      console.log(data);
    });
  });
  createButton(' broadcast ', function() {
    app.send({ action : 'broadcast', data : { msg : 'BROADCAST' } });
  });
  createButton(' putData ', function() {
    app.send({ action : 'putData', data : { msg : 'PUTDATA' } });
  });

  var log = document.createElement('pre');
  ctrls.$el.appendChild(log);

  $(document.body).style({
    overflow : 'hidden', padding : '0px', margin : '0px' })

  // start timers...
  heartbeat.start();
  observeWindowSize.start();

});
