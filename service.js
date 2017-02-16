var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'Node.js - Save View',
  description: 'Node server to support Mapbox-GL-JS Save view',
  script: 'C:\\clientdata\\PortOfPortland\\Mapbox-GL-JS-save-view\\server.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();