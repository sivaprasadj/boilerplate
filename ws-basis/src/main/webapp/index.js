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
    console.log('login-act', data);
  };

  app.actions.broadcast = function(data) {
    console.log('ja,', data);
  };

  var createButton = function(label, action) {
    var button = document.createElement('button');
    button.textContent = label;
    button.addEventListener('click', function(event) {
      action();
    });
    document.body.appendChild(button);
  };

  var heartbeat = function() {
    try {
      if (app.isAlive() ) {
        app.send({ action : 'broadcast', data : {
          type : 'heartbeat',
          w : window.innerWidth,
          h : window.innerHeight } });
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

});
