var CreepWaveController = function() {
  var cwc = new Object();
  Object.extend(cwc, InertDrawable);
  cwc.delay = 25000;
  cwc.last = millis()-20000;
  cwc.wave = 1;
  cwc.spawn_wave = function(bonus) {
    WIDGETS.wave.innerHTML = this.wave;
    var settings = {wave:this.wave, bonus:bonus};
    var cw;
    if (this.wave == 0) cw = CreepWave(settings);
    else if (this.wave % 15 == 0) cw = FizBuzzCreepWave(settings);
    else if (this.wave % 5 == 0) cw = BuzzCreepWave(settings);
    else if (this.wave % 3 == 0) cw = FizCreepWave(settings);
    else cw = CreepWave(settings);
    this.wave++;
    cwc.last = SET.now;
  };
  cwc.update = function() {
    if (SET.now - cwc.last > cwc.delay) {
      this.spawn_wave();
    }
  }
  assign_to_depth(cwc, SET.system_render_level);
  return cwc;
};

var CreepWave = function(settings) {
  var cw = new Object();
  Object.extend(cw, InertDrawable);
  cw.remaining = 20;
  cw.wave = 1;
  cw.last = 0;
  cw.interval = 1000;
  Object.extend(cw, settings);
  cw.spawn_creep = function() { Creep(this.wave); };
  cw.spawn = function() {
    this.remaining--;
    this.spawn_creep();
    this.last = SET.now;    
    if (this.remaining < 1) {
      this.is_dead = function() { return true; };
      if (this.bonus)
        SET.score += this.bonus;
    }
  }

  cw.update = function() {
    if (SET.now - this.last > this.interval) {
      this.spawn();
    }
  }
  assign_to_depth(cw, SET.system_render_level);
  SET.creep_variety = "Normal Creeps";
  return cw;
};

var FizCreepWave = function(settings) {
  var fcw = CreepWave(settings);
  fcw.spawn_creep = function() { FizCreep(this.wave);  }
  SET.creep_variety = "Fiz Creeps";
  return fcw;
};

var BuzzCreepWave = function(settings) {
  var fcw = CreepWave(settings);
  fcw.spawn_creep = function() { BuzzCreep(this.wave);  }
  SET.creep_variety = "Buzz Creeps";
  return fcw;
};

var FizBuzzCreepWave = function(settings) {
  var fcw = CreepWave(settings);
  fcw.remaining = 1;
  fcw.spawn_creep = function() { FizBuzzCreep(this.wave);  }
  SET.creep_variety = "FizBuzz Creeps";
  return fcw;
};