//
// index.js
//

'use strict';

window.addEventListener('load', function() {

  //http://localhost:9880/ws-basis/
  var url = location.href.
    replace(/^http([s]?\:\/\/.+)\/[^\/]*$/, 'ws$1') + '/ws-ep';

  var app = createWsApp({
    url : url,
    login : { action : 'login', user : 'anonymous' }
  });

  app.actions.login = function(data) {
    console.log(data);
  };

  app.actions.broadcast = function(data) {
    var client = model.clients[data.sid] || (model.clients[data.sid] = {});
    client.sid = data.sid;
    client.date = data.date;
    log.textContent = JSON.stringify(model.clients, null, 2);
  };

  var createButton = function(label, action) {
    var button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', function(event) {
      action();
    });
    document.body.appendChild(button);
  };

  var model = {
    left : 0,
    top : 0,
    getGeom : function() {
      return {
        type : 'geom',
        left : this.left,
        top : this.top,
        width : window.innerWidth,
        height : window.innerHeight,
      }
    },
    clients : {}
  };

  var heartbeat = function() {
    try {
      if (app.isAlive() ) {
        app.send({ action : 'broadcast', data : model.getGeom() });
      }
    } finally {
      window.setTimeout(heartbeat, 10000);
    }
  };
  heartbeat();

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
  document.body.appendChild(log);

});
