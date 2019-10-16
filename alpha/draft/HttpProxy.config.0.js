
var console = {
  log: function(msg) { $console.log('' + msg); },
  error: function(msg) { $console.error('' + msg); }
};

var init = function(config) {
//setup config
  for (var k in config) {
    $config.put(k, config[k]);
  }
  // setup events
  if (config.on) {
    for (var k in config.on) {
      $eventTarget.on(k, new Packages.HttpProxy.EventListener({
        handle : config.on[k]
      }));
    }
  }
};

init({
  // [required]

  // service port
  port: 8080,
  // bps for slow network emulation
  bps: 1 * 1024 * 1024,
  // direct connect
  directHosts: '*',
  // proxy server
  proxy: 'proxy.local:8080'
});
