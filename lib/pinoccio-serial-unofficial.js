'use strict';
var async = require('async');
var Bitlash = require('bitlash-js');
var util = require('util');

/*
  port open serialport object
  troop object with troopId, scoutId and token
  returns error
*/
function configureScout(port, options, done){

  async.series([

    function(cbStep){
      var cmd = {
        timeout: 10000,
        cmd: 'hq.settoken("' + options.token + '")'
      };

      Bitlash.send(port, cmd, cbStep);

    },
    function(cbStep){
      var cmd = {
        timeout: 10000,
        cmd: 'mesh.config(' + options.scoutId + ', ' + options.troopId + ', 20)'
      };

      Bitlash.send(port, cmd, cbStep);

    },
    function(cbStep){
      var cmd = {
        timeout: 10000,
        cmd: 'mesh.setkey("' + options.token.substring(0, 16) + '")'
      };

      Bitlash.send(port, cmd, cbStep);

    }
  ], function(err){

    done(err);
  });

}

/*
  port open serialport object
  options serialport options object
  returns error, open serialport object
*/
function sync(port, done){
  Bitlash.send(port, function(err){
    if(err){
      return done(err);
    }
    done();
  });
}

/*
  port open serialport object
  cmds command object, or array of command objects to send
  timeout time between sending commands, can help when pinoccio stutters and loses characters while processing last command
  returns error, array of strings, including an empty array if the command has no response
*/
function send(port, cmds, timeout, done){
  if (cmds && cmds.constructor !== Array){
    cmds = [cmds];
  }

  var cmd;
  var results = [];

  async.whilst (
    function() {
      //shift undefined value if empty?
      cmd = cmds.shift();
      return (typeof cmd === 'object');
    },
    function(cbStep) {
      Bitlash.send(port, cmd, function(err, data){
        if(err){
          return done(err);
        }

        if(!data){
          data = [];
        }
        results.push(data);

        //found that multitasking of collecting user input can be flaky
        //as it processes the last command so 1 second delay before sending next command
        setTimeout(cbStep, timeout);
      });
    },
    function(err) {

      //check why it failed
      //some types of errors mean need to invalidate connection
      //any serial errors
      //timeout probably
      //do I have a way to check the type of error or do you just check string equality?
      // if(something){
      //   port.close();
      //   serialPorts.splice(connectionId, 1);
      // }

      //but not
      //invalid command 
      //Prompt not at end
      done(err, results);
    });
}

/*
  port open serialport object
  timeout Number of milliseconds to attempt scan
  returns error, array of strings enumerating wifi access points
*/
function findWifi(port, timeout, done){

  var timedout = false;
  var list;

  var opt = {
    timeout: (timeout < 20000 ? timeout : 20000),
    cmd: 'wifi.list'
  };

  var intervalId = setTimeout(function() { timedout = true; }, timeout);

  async.whilst (
    function() {
      return (!list || timedout);
    },
    function(cbStep) {
      Bitlash.send(port, opt, function(err, results){
        if (err) {
          return cbStep(err);
        }

        if(typeof results === 'object' && results.length > 1 && results[0] !== 'Error: Scan failed')
        {
          list = results;
        }

        cbStep();

      });
    },
    function(err) {
      clearTimeout(intervalId);
      done(err, list);
    });
}

/*
  port open serialport object
  ssid string wifi ssid
  pass string of password
  timeout Numer of milliseconds to wait for connect to return successful
  returns error
*/
function programWifi(port, ssid, pass, timeout, done){

  async.series([
    function(cbStep){
      var opt = {
        timeout: 10000,
        cmd: util.format('wifi.config("%s", "%s")', ssid, pass)
      };

      Bitlash.send(port, opt, cbStep);
    },
    function(cbStep){
      var opt = {
        timeout: 2000,
        cmd: 'wifi.reassociate'
      };

      Bitlash.send(port, opt, cbStep);
    },
    function(cbStep){
      waitWifi(port, timeout, cbStep);
    },
  ],
  function(err) {
      done(err);
    });
}

/*
  port open serialport object
  timeout Number of milliseconds to wait for connect to return successful
  returns error
*/
function waitWifi(port, timeout, done){
  var timedout = false;
  var connected = false;

  var opt = {
    timeout: 2000,
    cmd: 'wifi.report'
  };

  setTimeout(function() { timedout = true; }, timeout);

  async.whilst (
    function() {
      return !(connected || timedout);
    },
    function(cbStep) {
      Bitlash.send(port, opt, function(err, results){
        if (err) {
          return cbStep(err);
        }

        // console.log(results[0]);
        if(results[0].indexOf('"connected":true') > 0){
          connected = true;
        }
        
        cbStep();
      });
    },
    function(err) {
      if(err){
        return done(err);
      }

      if(timedout){
        return done(new Error('timed out'));
      }

      done();
    });
}

module.exports = {
  sync: sync,
  send: send,
  findWifi: findWifi,
  programWifi: programWifi,
  configureScout: configureScout
};