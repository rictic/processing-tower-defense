var sounds = { "bomb":{src:"47251_nthompson_rocket.mp3", name:"bomb", total:3},
             }

soundManager.url = 'soundmanager2/soundmanager2.swf'
soundManager.debugMode = false;
soundManager.allowPolling = false; //we don't care, and we want speed
soundManager.defaultOptions.autoLoad = true; //load sounds that 

var play_sound = function(name) {
  if (muted) return;
  if (!(name in sounds)) {
//     log("I don't know about the sound " + name + ".  I know about", sounds);
    return;
  }

  primitive_play(sounds[name]);
}

//noop until we figure out what sound system is available
var primitive_play = function() {}

soundManager.onload = function() {
  log("using Flash sound");
  for (name in sounds)
    soundManager.createSound(name, 'assets/'+sounds[name].src); // primes the pump
  primitive_play = function(sound) {
    soundManager.play(sound.name);
  }
}

//if we can't use the Flash system, probably for security reasons
soundManager.onerror = function() {
  log("using embeded sound");
  for(name in sounds) {
    var sound = sounds[name];
    
    //set up a bunch of embeded audio elements we can use to let us simultaneously
    //play the same sound effect up to sound.num times
    //this is a trade-off of initial loading time for in-game performance
    sound.total = sound.total || 15;
    for(var i=0; i < sound.total; i++)
      $('#sfx_dump').append("<embed src='assets/"+sound.src+"' autostart='false' hidden='true' id='" + name + i + "' enablejavascript='true' />");
    sound.current = 0;
  }
  
  primitive_play = function(sound) {
    $('#' + sound.name + sound.current)[0].Play();
    sound.current = (sound.current + 1) % sound.total;
  }
}


var muted = false;
var mute_unmute = function() {
  muted = !muted;
}