var Device = require('../');

var SerialPortFactory = require('serialport');
var SerialPort = SerialPortFactory.SerialPort;

var path = '/dev/tty.usbmodem1411';
var options = { baudrate: 115200 };


var serialPort = new SerialPort(path, options, function(err){
  console.log('open', err);

  Device.sync(serialPort, function(err){
    console.log('synced', err);

    Device.findWifi(serialPort, 60000, function(err, results){

      console.log(err, results);
    });

  });

});
