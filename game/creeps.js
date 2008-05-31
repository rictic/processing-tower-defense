/*
  Used in by the Creep method "display stats" to
  support constantly updated hp for the specific
  selected creep. Conceivably one might move into
  another state immediately without transitioning
  into normal state before that. Preferably some
  kind of state cleanup function will be added to
  the state API, but at the moment it will function
  correctly anyway, because the creep div will either
  be invisible, or the most recent creephpupdater
  will be the last one called, meaning that the
  correct hp will be displayed even if there are
  multiple existing creephpupdaters in the
  system rendering level.
 */
var CreepHpUpdater = function(creep) {
  var chp = new Object();
  Object.extend(chp, InertDrawable);
  chp.update = function() {
    WIDGETS.creep_hp.innerHTML = creep.hp;
  }
  chp.should_die = false;
  chp.is_dead = function() {
    if (chp.should_die || !creep || !SET.state || SET.state.name() != "CreepSelectMode" || creep.is_dead()) {
      if (SET.state) {
	SET.state.tear_down();
	SET.state = undefined;
      }
      if (chp.kz)
	chp.kz.is_dead = function() { return true; };
      return true;
    }
    else return false;
  }
  chp.draw = function() {
    if (chp.kz) chp.kz.is_dead = function() { return true; };
    chp.kz = KillZone(creep.x,creep.y,15);
  }

  assign_to_depth(chp, SET.system_render_level);
  return chp;
}


var Creep = function(wave) {
  var cp = SET.creeps_spawned;
  var c = new Object();
  c.x = SET.entrance.x_mid;
  c.y = SET.entrance.y_mid;
  c.color = SET.creep_color;
  c.size = SET.creep_size;
  c.hp = Math.floor(SET.creep_hp * Math.pow(1.4,wave));
  c.value = SET.creep_value + wave;
  c.speed = SET.creep_speed;
  c.last = millis();
  c.is_dead = function() {
    if (this.hp <= 0) {
      SET.gold += this.value;
      SET.score += this.value;
      return true;
    }
    return false;
  }
  c.update = function() {
    var gpos = pixel_to_grid(this);
    this.gx = gpos.gx;
    this.gy = gpos.gy;
    // if it reaches the exit, kill it, but reduce the players
    // lives and reduce its value to 0 (it will be collected
    // and destroyed in the is_dead phase.
    if (this.gx == SET.exit.gx && this.gy == SET.exit.gy) {
      this.hp = -1;
      this.value = 0;
      SET.lives--;
      if (SET.lives < 1) game_lost();
    }
    else {
      var elapsed = SET.now - this.last;
      var speed = (elapsed/1000) * this.speed;
      this.last = SET.now;

      var path = calc_path(this.x,this.y,SET.exit.x_mid,SET.exit.y_mid,speed);
      this.x += path.x;
      this.y += path.y;
    }
  }
  c.draw = function() {
    noStroke();
    fill(this.color);
    ellipse(this.x,this.y,this.size,this.size);
  }
  c.creep_type = "Normal Creep";
  c.display_stats = function() {
    WIDGETS.creep_type.innerHTML = this.creep_type;
    WIDGETS.creep_hp.innerHTML = this.hp;
    WIDGETS.creep_value.innerHTML = this.value + " gold";
    WIDGETS.creep.style.display = "block";
  }
  SET.creeps_spawned++;
  assign_to_depth(c, SET.creep_render_level);
  return c;
};

var FizCreep = function(wave) {
  var fc = Creep(wave);
  fc.creep_type = "Fiz Creep";
  fc.color = color(0,255,255);
  fc.size = fc.size * 1.3;
  fc.hp = Math.floor(fc.hp * 2);
  fc.value = Math.floor(fc.value * 1.5);
  fc.speed = fc.speed * 0.75;
  return fc;
};

var BuzzCreep = function(wave) {
  var bc = Creep(wave);
  bc.creep_type = "Buzz Creep";
  bc.color = color(100,150,50);
  bc.speed = bc.speed * 1.5;
  bc.hp = Math.floor(bc.hp * .75);
  bc.size = bc.size * 0.9;
  bc.value = Math.floor(bc.value * 1.25);
  return bc;
};

var FizBuzzCreep = function(wave) {
  var fbc = Creep(wave);
  fbc.creep_type = "FizBuzz Creep";
  fbc.color = color(255,100,150);
  fbc.size = fbc.size * 1.5;
  fbc.hp = fbc.hp * 10;
  fbc.value = fbc.value * 10;
  return fbc;
};

