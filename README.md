#pinoccio-serial-unofficial

Uses my [bitlash-js](https://github.com/jacobrosenthal/bitlash-js) to send commands, find wifi, program wifi, configure scouts and more.

#install
Technically has a dependency on serialport so if something else in your project isnt using it, youll need to grab that too.
```
npm install serialport pinoccio-serial-unofficial
```

#use
Open a node-serialport object and pass it in for each of the commands. You'll want to sync first after open which just sends a return character waiting for the > prompt. Theres an example searching for wifi in the examples folder.

#api
```js
/*
  port open serialport object
  timeout Number of milliseconds to wait for connect to return successful
  returns error
*/
function waitWifi(port, timeout, done)

/*
  port open serialport object
  ssid string wifi ssid
  pass string of password
  timeout Numer of milliseconds to wait for connect to return successful
  returns error
*/
function programWifi(port, ssid, pass, timeout, done)

/*
  port open serialport object
  timeout Number of milliseconds to attempt scan
  returns error, array of strings enumerating wifi access points
*/
function findWifi(port, timeout, done)

/*
  port open serialport object
  cmds command object, or array of command objects to send
  timeout time between sending commands, can help when pinoccio stutters and loses characters while processing last command
  returns error, array of strings, including an empty array if the command has no response
*/
function send(port, cmds, timeout, done)

/*
  port open serialport object
  options serialport options object
  returns error, open serialport object
*/
function sync(port, done)

/*
  port open serialport object
  troop object with troopId, scoutId and token
  returns error
*/
function configureScout(port, options, done)
```