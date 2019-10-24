
var console = {
  log: function(msg) { $console.log('' + msg); },
  error: function(msg) { $console.error('' + msg); }
};

var init = function(config) {

  var EventListener = Packages.httpproxy.event.EventListener;

  //setup config
  for (var k in config) {
    $config.put(k, config[k]);
  }
  // setup events
  if (config.on) {
    for (var k in config.on) {
      $eventTarget.on(k, new EventListener({
        handle : config.on[k]
      }));
    }
  }
};

init({
  // service port
  port: 8080,
  // bps for slow network emulation
  bps: 100 * 1024 * 1024,
  on: {
    beginsession: function(event) {
      var detail = event.getDetail();
      detail.put('enableLog', true);
    },
    getproxy: function(event) {
      var detail = event.getDetail();
      var console = detail.get('console');
      detail.put('proxy', 'DIRECT');
    },
    beforerequest: function(event) {
      var detail = event.getDetail();
      var console = detail.get('console');
    },
    beforeresponse: function(event) {
      var detail = event.getDetail();
      var console = detail.get('console');
      var responseHeader = detail.get('responseHeader');
      var cookies = responseHeader.getHeaderValues('set-cookie');
      for (var i = 0; i < cookies.length; i += 1) {
        var cookie = cookies[i].match(/^([^=;]+)=([^=;]*)(;.*)?$/);
        if (cookie) {
          var name = cookie[1];
          var value = cookie[2];
        }
      }
    }
  }
});