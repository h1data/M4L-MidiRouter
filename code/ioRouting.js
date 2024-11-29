/**
 * ioRouting.js
 * 
 * @description manage live.menu objects to select Audio/MIDI IO routing for Max for Live devices
 * @author h1data
 * @version 1.1.0 January 3, 2022
 * 
 * @arguments js ioRoutingLiveMenu.js ioType [channelOffset]
 * @argument {string} ioType midi_inputs, midi_outputs, audio_inputs, or audio_outputs
 * @argument {int} channelOffset (optional) channel number in multiple channel pairs (zero-based counting)
 */

autowatch = 1;
inlets = 1;
outlets = 2;

var lomTypes = null;
var lomChannels = null;
var lomRoutingType = null;
var lomRoutingChannel = null;
var lomThisTrack = null;
var isInitialized = false;

/**
 * Initialize Live API objects.
 * Must be triggered by live.thisdevice, not by loadbang nor loadmess.
 */ 
function init() {
  if (jsarguments.length < 2 || jsarguments.length > 3) {
    error('invalid number of arguments. usage:', jsarguments[0], 'ioType(i.e. midi_inputs) [channelOffset]\n');
    return;
  }
  var channelOffset = 0;
  if (jsarguments.length >= 3) channelOffset = jsarguments[2];
  var path = 'this_device ' + jsarguments[1] + ' ' + channelOffset;
  lomThisTrack = new LiveAPI();
  lomTypes = new LiveAPI(callbackTypes, path);
  lomTypes.property = 'available_routing_types';
  lomChannels = new LiveAPI(callbackChannels, path);
  lomChannels.property = 'available_routing_channels';
  lomRoutingType = new LiveAPI(callbackRoutingType, path);
  lomRoutingType.property = 'routing_type';
  lomRoutingChannel = new LiveAPI(callbackRoutingChannel, path);
  lomRoutingChannel.property = 'routing_channel';
  isInitialized = true;
}

callbackTypes.local = 1;
/**
 * Change live.menu list with available routing types.
 * Triggered by callback from LiveAPI. (available_routing_types)
 * @param {Object} arg ['id', (int)] or
 * ['available_routing_types', {'available_routing_types', [{'display_name': (string), 'identifier': (int)}, ...]}]
 */
function callbackTypes(arg) {
  if (arg[1].available_routing_types != undefined) {
    var range = [];
    for (var i=0; i<arg[1].available_routing_types.length; i++) {
        range.push(arg[1].available_routing_types[i].display_name);
    }
    outlet(0, '_parameter_range', range); // !!!UNOFFICIAL ATTRIBUTE!!!
  }
}

callbackChannels.local = 1;
/**
 * Change live.menu list with available routing channels.
 * Triggered by callback from LiveAPI. (available_routing_channels)
 * @param {Object} arg ['id', (int)] or
 * ['available_routing_channels', {'available_routing_channels': [{'display_name': (string), 'identifier': (int)}, ...]}]
 */
function callbackChannels(arg) {
  if (arg[1].available_routing_channels != undefined) {
    var range = [];
    if (arg[1].available_routing_channels.length == 0) {
      // no available channels; when previous routing device has been disabled
      var type = JSON.parse(lomTypes.get('available_routing_types')).available_routing_types;
      if (type != undefined && type.length > 0) {
        // set type list to the last item of available types; 'No Input' or 'No Output'
        outlet(0, 'setsymbol', type[type.length - 1].display_name);
      }
      outlet(1, '_parameter_range', ['-', '-']);
      outlet(1, 'ignoreclick', 1);
      outlet(1, 'active', 0);
    } else if (arg[1].available_routing_channels.length == 1) {
      if(arg[1].available_routing_channels[0].display_name == '') {
        // when channel name is blank ('No Input'/'No Output')
        outlet(1, '_parameter_range', ['-', '-']);
      } else {
        // when one channel (i.e. 'Track In') only
        outlet(1, '_parameter_range', [arg[1].available_routing_channels[0].display_name, '-']);
      }
      outlet(1, 'ignoreclick', 1);
      outlet(1, 'active', 0);
    } else {
      for (var i=0; i<arg[1].available_routing_channels.length; i++) {
        range.push(arg[1].available_routing_channels[i].display_name);
      }
      outlet(1, '_parameter_range', range);
      outlet(1, 'active', 1);
      outlet(1, 'ignoreclick', 0);
    }
  }
}

callbackRoutingType.local = 1;
/**
 * select live.menu's item by current routing type
 * triggered by callback of LiveAPI (routing_type)
 * @param arg dictionary
 * ['id', (int)] or ['routing_type', {'routing_type': {'display_name': (string), 'identifier': (int)}}]
 */
function callbackRoutingType(arg) {
  if (arg[1].routing_type != undefined) {
    outlet(0, 'setsymbol', arg[1].routing_type.display_name);
  }
}

callbackRoutingChannel.local = 1;
/**
 * select live.menu's item by current routing channel
 * triggered by callback of LiveAPI (routing_channel)
 * @param {Object} arg dictionary
 * ['id', (int)] or ['routing_channel', {'routing_channel', {'display_name': (string), 'identifier': (int)}}]
 */
function callbackRoutingChannel(arg) {
  if (arg[1].routing_channel != undefined)
    outlet(1, 'setsymbol', arg[1].routing_channel.display_name);
}

/**
 * change routing type
 * @param {int} id target item number of routing type list (zero-based counting)
 */
function settype(id) {
  var mapTypes = JSON.parse(lomTypes.get('available_routing_types')).available_routing_types;
  if (mapTypes[id] != undefined) {
    lomRoutingType.set('routing_type', mapTypes[id]);
  } else {
    error('Invalid Input Type:', id);
  }
}

/**
 * change routing channel
 * @param {int} id target item number of routing channel list (zero-based counting)
 */
function setchannel(id) {
  var mapChannels = lomChannels.get('available_routing_channels');
  mapChannels = JSON.parse(mapChannels).available_routing_channels;
  if (mapChannels[id] != undefined) {
    lomRoutingChannel.set('routing_channel', mapChannels[id]);
  } else {
    error('Invalid Input Channel:', id);
  }
}

/**
 * Automatically route MIDI input to MIDI track where the device belong to.
 * @param {int} forceRouting 1: force to change routing, not 1: change routing when the input is selected to 'No Input'
 */
function routethistrack(forceRouting) {
  if (!isInitialized || jsarguments[1] != 'midi_inputs') return;
  var routingType = JSON.parse(lomRoutingType.get('routing_type')).routing_type;
  var routingTypes = JSON.parse(lomTypes.get('available_routing_types')).available_routing_types;
  if (forceRouting != 1 && routingType.identifier != routingTypes[routingTypes.length - 1].identifier) return;

  lomThisTrack.goto('this_device');
  // estimated path: live_set tracks n,live_set return_tracks n, live_set master_track
  lomThisTrack.goto(lomThisTrack.path.replace('"', '').match(/^.+tracks? \d*/)[0]);
  if (lomThisTrack.get('has_midi_input') != 1) return;
  var inputTypes = JSON.parse(lomThisTrack.get('available_input_routing_types')).available_input_routing_types;
  for (var i=0; i<routingTypes.length; i++) {
    if (inputTypes[i] == undefined || routingTypes[i].identifier != inputTypes[i].identifier) {
      if (routingType.identifier == routingTypes[i].identifier) return;
      lomRoutingType.set('routing_type', routingTypes[i]);
      setchannel(0);
      return;
    }
  }
}
