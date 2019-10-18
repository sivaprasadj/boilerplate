
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
    getproxy: function(e) {
      var detail = e.getDetail();
      detail.put('proxy', 'DIRECT');
    },
    beforerequest: function(e) {
    },
    beforeresponse: function(e) {
    }
  }
});
