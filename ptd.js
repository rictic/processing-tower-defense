/*
Processed Tower Defense by Will Larson lethain@gmail.com
  
### Processed Tower Defense

PTD is a simple game I decided to make to get used to
the Processing.js library, and also to consider the
feasibility of writing Processing-like code, but
using Javascript instead of Java 1.3 style syntax for
all control code.

I began prototyping the game, the first game I had
tried developing, and I got fairly far but realized
that my lack of knowledge about games had led me to
make some organizational mistakes that were making
the code increasingly incoherent and piecemeally.
So, I decided to rewrite the code to be clearer,
with the hope that it might serve as an useful
example for others.

### Coordinate System
  
There are two coordinate systems in effect that need 
to be taken into consideration. The first is the pixel
coordinate system, and the second is a coordinate system
formed by a grid of veritical and horizontal lines.
The grid's size is determined by three settings.

1. *pixels_per_square* determines the number of pixels per grid square.
2. *height* determines the overall height of the board.
3. *width* determines the overall width of the board.

Thus the board will create as many squares as possible within
the constraints of the height and width that it is given.

Within the code, positions within the grid coordinate
system are always referred to as (gx,gy) and positions
in the pixel coordinate system are always referred to
as (x,y). This is a very important distinction, and
mixing the two together can cause ample confusion.
*/

/*
  General utility functions.
 */
// return a random number (0 <= n <= max)
var random = function(max) {
  return Math.floor(Math.random()*(max+1));
};

var calc_path = function(x1,y1,x2,y2,speed) {
  var ac = y2 - y1;
  var bc = x2 - x1;
  var ab = Math.sqrt(Math.pow(ac,2) + Math.pow(bc,2));
  var de = (1.0 * speed * ac) / ab;
  var be = (1.0 * speed * bc) / ab;
  return {y:de,x:be};
};

var dist = function(x1,y1,x2,y2) {
  var ac = y2 - y1;
  var bc = x2 - x1;
  return Math.sqrt(Math.pow(ac,2) + Math.pow(bc,2));
}

/*
  Coordinate systems utilities.
 */

// return pixel coordinates of top left corner
// of square at grid coordinates (gx,gy)
var grid_to_pixel = function(gx,gy) {
  if (gy == undefined) {
    gy = gx.gy;
    gx = gx.gx;
  }
  return {x:gx*SET.pixels_per_square, y:gy*SET.pixels_per_square};
};

// return grid coordinates of square containing pixel
// coordinate (x,y)
var pixel_to_grid = function(x,y) {
  if (y == undefined) {
    y = x.y;
    x = x.x;
  }
  var grid_x = Math.floor(x / SET.pixels_per_square);
  var grid_y = Math.floor(y / SET.pixels_per_square);
  return {gx:grid_x, gy:grid_y};
};

// return pixel coordinates for the center of
// square at grid coordinates (gx,gy)
var center_of_square = function(gx,gy) {
  if (gy == undefined) {
    gy = gx.gy;
    gx = gx.gx;
  }
  var coords = grid_to_pixel(gx,gy);
  return {x:coords.x + SET.half_pixels_per_square,
      y:coords.y + SET.half_pixels_per_square};
};

/*
  Drawing functions.
 */

// draw a square filling square (gx,gy)
var draw_square_in_grid = function(gx,gy) {
  var pos = grid_to_pixel(gx,gy);
  rect(pos.x,pos.y,SET.pixels_per_square,SET.pixels_per_square);
}

// draw a circle filling (gx,gy)
var draw_circle_in_grid = function(gx,gy) {
  var pos = grid_to_pixel(gx,gy);
  var h = SET.half_pixels_per_square;
  var l = SET.pixels_per_square;
  ellipse(pos.x+h,pos.y+h,l,l);
};

/*
  Various game utility functions.
 */
  
var can_build_here = function(gx,gy) {
  var possible_conflicts = [SET.rendering_groups[SET.square_render_level],
			    SET.rendering_groups[SET.tower_render_level]];
  for (var i=0; i<possible_conflicts.length;i++) {
    var array = possible_conflicts[i];
    if (array != undefined) {
      for (var j=0; j<array.length; j++) {
	var obj = array[j];
	if (obj.gx == gx && obj.gy == gy) return false;
      }
    }
  }
  return true;
};

var get_tower_at = function(gx,gy) {
  var towers = SET.rendering_groups[SET.tower_render_level];
  for (var i=0;i<towers.length;i++) {
    var tower = towers[i];
    if (tower.gx == gx && tower.gy == gy) return tower;
  }
  return false;
};

var get_creep_nearest = function(x,y,sensitivity) {
  if (!sensitivity) sensitivity = 10;
  var creeps = SET.rendering_groups[SET.creep_render_level];
  var len = creeps.length;
  var nearest_creep;
  var distance = sensitivity;
  for (var i=0;i<len;i++) {
    var creep = creeps[i];
    var d = dist(x,y,creep.x,creep.y);
    if (d < distance) {
      distance = d;
      nearest_creep = creep;
    }
  }
  return (distance < sensitivity) ? nearest_creep : undefined;
}
  
/*
  Object life cycle.
 */

// assign @obj to render at @depth until it dies.
// 0 is the topmost layer, and thus something at
// layer 1 will render before something at layer 0.
// Something at layer 10 will render before something
// at layer 4, and so on. This means that something
// rendered at layer 0 will draw itself ontop of anything
// rendered before layer 0.
var assign_to_depth = function(obj,depth) {
  var rendering_group = SET.rendering_groups[depth];
  if (rendering_group == undefined) SET.rendering_groups[depth] = [obj];
  else rendering_group.push(obj);
}

// updates any groups
var update_groups = function(groups) {
  var obj_update = function(x) { 
    if (x != undefined) x.update();
  };
  var obj_is_alive = function(x) {
    if ( x == undefined || x.is_dead()) return false;
    return true; 
  };
  var obj_draw = function(x) { x.draw(); };
  for (var i=groups.length-1;i>=0;i--) {
    var group = groups[i];
    if (group != undefined) {
      group.forEach(obj_update);
      var alive = group.filter(obj_is_alive);
      alive.forEach(obj_draw);
      groups[i] = alive;
    }
  }
}

/*
  Configuration & settings.
 */

var default_set = function() {
  var set = {};

  // constants
  set.pixels_per_square = 25;
  set.half_pixels_per_square = (1.0 * set.pixels_per_square) / 2;
  set.height = 450;
  set.width = 600;
  set.framerate = 60;
  set.gheight = Math.floor(set.height / set.pixels_per_square);
  set.gwidth = Math.floor(set.width / set.pixels_per_square);

  // colors
  set.bg_colors = {neutral:color(90,80,70),
		  positive:color(60,80,250),
		  negative:color(250,80,60)};
  set.bg_color = set.bg_colors.neutral;
  set.grid_color = color(255,255,255);
  set.entrance_color = color(255,100,100);
  set.exit_color = color(100,100,250);
  set.killzone_color = color(200,50,50);
  set.creep_color = color(255,255,0);

  // rendering groups
  set.rendering_groups = [];
  for (var i=0; i<7;i++) set.rendering_groups.push([]);
  set.system_render_level = 6;
  set.killzone_render_level = 5;
  set.square_render_level = 4;
  set.grid_render_level = 3;
  set.tower_render_level = 2;
  set.creep_render_level = 1;
  set.bullet_render_level = 0;

  // game state
  set.normal_state = 0;
  set.placing_tower_state = 1;
  set.aiming_missile_state = 2;
  set.selecting_tower_state = 3;
  set.pause_state = 4;
  set.game_over_state = 5;
  set.selecting_creep_state = 6;
  set.state = set.normal_state;

  // game values
  set.creep_variety = "Normal Creeps";
  set.creep_size = 10;
  set.creep_hp = 10;
  set.creep_value = 1;
  set.creep_speed = 2;
  set.missile_blast_radius = 5;
  set.missile_damage = 100;
  set.gold = 200;
  set.creeps_spawned = 0;
  set.max_creeps = 1;
  set.score = 0;
  set.lives = 20;
  set.nukes = 3;

  return set
};
var SET;

var fetch_ui_widgets = function() {
  var w = {};
  // status bar widgets
  w.score = document.getElementById("score");
  w.gold = document.getElementById("gold");
  w.lives = document.getElementById("lives");
  w.nukes_left = document.getElementById("nukes_left");
  w.creep_variety = document.getElementById("creep_variety");
  w.wave = document.getElementById("wave");
  w.till_next_wave = document.getElementById("till_next_wave");
  
  // tower widgets
  w.tower = document.getElementById("tower");
  w.tower_type = document.getElementById("tower_type");
  w.tower_range = document.getElementById("tower_range");
  w.tower_damage = document.getElementById("tower_damage");
  w.tower_rate = document.getElementById("tower_rate");
  w.tower_upgrade_button = document.getElementById("tower_upgrade_button");
  w.tower_sell_button = document.getElementById("tower_sell_button");

  // creep widgets
  w.creep = document.getElementById("creep");
  w.creep_type = document.getElementById("creep_type");
  w.creep_hp = document.getElementById("creep_hp");
  w.creep_value = document.getElementById("creep_value");

  return w;
};
var WIDGETS;

/*
  Drawable objects (grid, towers, creeps, everything).
 */

// Object.extend borrowed from Prototype javascript library.
Object.extend = function(destination, source) {
  for (var property in source) {
    destination[property] = source[property];
  }
  return destination;
};


// prototype for grid lines and colored squares
var InertDrawable = new Object();
Object.extend(InertDrawable, {
      update:function() {},
      is_dead:function() { return false; },
      draw:function() {}
  });


// responsible for updating settings in SET
// at the very beginning of a rendering cycle
var SettingUpdater = function() {
  var su = new Object();
  Object.extend(su, InertDrawable);
  su.update = function() { SET.now = millis(); }
  assign_to_depth(su, SET.system_render_level);
  return su;
};

var UIUpdater = function() {
  var uiu = new Object();
  Object.extend(uiu, InertDrawable);
  
  uiu.update = function() {
    WIDGETS.creep_variety.innerHTML = SET.creep_variety;
    WIDGETS.score.innerHTML = SET.score;
    WIDGETS.gold.innerHTML = SET.gold;
    WIDGETS.lives.innerHTML = SET.lives;
    WIDGETS.nukes_left.innerHTML = SET.nukes + " left";
    WIDGETS.till_next_wave.innerHTML = Math.floor(((SET.creep_wave_controller.last + SET.creep_wave_controller.delay) - SET.now) / 1000)
  };
  assign_to_depth(uiu, SET.system_render_level);
  return uiu;
}

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
    cw.spawn(); // spawn the first one immediately
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
  cw.last = millis();
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

var KillZone = function(x,y,r) {
  var kz = new Object();
  Object.extend(kz, InertDrawable);
  kz.is_dead = function() {
    if (SET.state != SET.selecting_tower_state)
      return true;
    return false;
  }
  var d = 2*r;
  kz.color = SET.killzone_color;
  kz.draw = function() {
    fill(this.color);
    stroke(255);
    ellipse(x,y,d,d);
  };
  assign_to_depth(kz, SET.killzone_render_level); 
  return kz;
};

var BuildRadius = function(x,y,r) {
  var br = KillZone(x,y,r);
  br.is_dead = function() {
    if (SET.state != SET.placing_tower_state)
      return true;
    return false;
  }
  return br;
}

var MissileRadius = function(x,y,r) {
  var mr = KillZone(x,y,r);
  mr.is_dead = function() {
    if (SET.state != SET.aiming_missile_state)
      return true;
    return false;
  }
  return mr;
}

var Grid = function() {
  var grid = new Object();
  Object.extend(grid, InertDrawable);
  grid.draw = function() {
    stroke(SET.grid_color);
    var p = SET.pixels_per_square;
    var w = SET.width;
    var h = SET.height;
    for (i = 0; i<w; i+=p) {
      line(i, 0, i, h);
    }
    for (i = 0; i<h; i+=p) {
      line(0,i,w,i);
    }
  };
  assign_to_depth(grid, SET.grid_render_level);
  return grid;
};


var GridSquare = function(gx,gy,color) {
  var square = new Object();
  Object.extend(square, InertDrawable);
  square.gx = gx;
  square.gy = gy;
  square.x = grid_to_pixel(gx);
  square.y = grid_to_pixel(gy);
  var mid = center_of_square(gx,gy);
  square.x_mid = mid.x;
  square.y_mid = mid.y;
  return square;

}

var Square = function(gx,gy,color) {
  var square = GridSquare(gx,gy,color);
  square.draw = function() {
    noStroke();
    fill(color);
    draw_square_in_grid(this.gx,this.gy);
  }
  assign_to_depth(square, SET.square_render_level);
  return square;
};

var Tower = function(settings) {
  var tower = GridSquare(settings.gx,settings.gy,settings.color);
  Object.extend(tower, settings);
  // note, range is in terms of grid squares
  // and is calculated from center of tower
  tower.set_range = function(range) {
    tower.range = range;
    tower.prange = range * SET.pixels_per_square;
  }
  tower.set_range(3.5);
  tower.damage = 5.0;
  tower.attack = function(creep) {};
  var mid = center_of_square(tower.gx,tower.gy);
  tower.x_mid = mid.x;
  tower.y_mid = mid.y;
  tower.fired_at = 0;
  tower.reload_rate = 1000;
  tower.weapon_ready = function() {
    if (SET.now - tower.fired_at > tower.reload_rate) {
      tower.fired_at = SET.now;
      return true;
    }
    return false;
  };
  tower.update = function() {
    var creeps = SET.rendering_groups[SET.creep_render_level];
    var creeps_in_range = creeps.filter(function(creep) {
	var distance = dist(tower.x_mid,tower.y_mid,creep.x,creep.y);
	if (distance < tower.prange) return true;
	return false;
      });
    if (creeps_in_range.length > 0) {
      var creep = creeps_in_range[0];
      var lowest_hp = creep.hp;
      creeps_in_range.forEach(function(c) {
	  if (c.hp < lowest_hp) creep = c;
	});
      if (tower.weapon_ready() == true) tower.attack(creep);
    }
  }
  tower.sale_value = 50;
  tower.upgrade_cost = 50;
  tower.upgrade = function() {
    if (SET.gold > this.upgrade_cost) {
      SET.gold -= this.upgrade_cost;
      tower.sale_value += this.upgrade_cost;
      this.upgrade_cost = Math.floor(this.upgrade_cost * 2);
      this.damage = Math.floor(this.damage * 1.5);
      this.set_range(this.range * 1.1);
      this.reload_rate = this.reload_rate * 0.95;
      this.display_stats();
    }
    else error("You don't have enough gold to upgrade, you need " + (this.upgrade_cost - SET.gold) + " more.");
  }
  tower.sell = function() {
    SET.gold += Math.floor(this.sale_value * 0.75);
    this.is_dead = function() { return true; },
    set_state_normal();
  }


  tower.display_stats = function() {
    WIDGETS.tower_type.innerHTML = this.type;
    WIDGETS.tower_range.innerHTML = this.range;
    WIDGETS.tower_damage.innerHTML = this.damage;
    WIDGETS.tower_rate.innerHTML = this.reload_rate;
    WIDGETS.tower_sell_button.innerHTML = "Sell tower for " + Math.floor(this.sale_value * 0.75) + " gold!";
    WIDGETS.tower_upgrade_button.innerHTML = "<u>U</u>pgrade for " + Math.floor(this.upgrade_cost) + " gold!";

    WIDGETS.tower_upgrade_button.onclick = function() {
      tower.upgrade();
    }
    WIDGETS.tower_sell_button.onclick = function() {
      tower.sell();
    }

    WIDGETS.tower.style.display = "block";
  };

  tower.draw = function() {
    noStroke();
    fill(this.color);
    draw_circle_in_grid(this.gx,this.gy);
  }
  assign_to_depth(tower, SET.tower_render_level);
  return tower;
};

var MissileTower = function(gx,gy) {
  var mt = Tower({gx:gx,gy:gy,color:color(250,150,50)});
  mt.type = "Missile Tower";
  mt.damage = 100;
  mt.upgrade_cost = 100;
  mt.sale_value = 100;
  mt.set_range(5.5);
  mt.reload_rate = 750;
  mt.attack = function(creep) {
    assign_to_depth(Missile(this,creep),SET.bullet_render_level);
  }
  mt.upgrade = function() {
    if (SET.gold >= this.upgrade_cost) {
      SET.gold -= this.upgrade_cost;
      this.sale_value = Math.floor(this.sale_value + this.upgrade_cost);
      this.upgrade_cost = Math.floor(this.upgrade_cost * 1.5);
      this.damage = Math.floor(this.damage * 2.5);
      this.set_range(this.range + 0.5);
      SET.rendering_groups[SET.killzone_render_level] = [];
      set_state_normal();
      select_tower(this);
    }
    else error("You don't have enough gold to upgrade, you need " + (this.upgrade_cost - SET.gold) + " more.");
  }
  return mt;
}

var LaserTower = function(gx,gy) {
  var lt = Tower({gx:gx,gy:gy,color:color(50,150,250)});
  lt.type = "Laser Tower";
  lt.attack = function(creep) {
    assign_to_depth(Laser(this,creep),SET.bullet_render_level);
  };
  lt.upgrade_cost = 50;
  lt.sale_value = 50;
  lt.upgrade = function() {
    if (SET.gold >= this.upgrade_cost) {
      SET.gold -= this.upgrade_cost;
      this.sale_value = Math.floor(this.sale_value + this.upgrade_cost);
      this.upgrade_cost = Math.floor(this.upgrade_cost * 1.5);
      this.damage = Math.floor(this.damage * 2.0);
      this.set_range(this.range + 0.25);
      this.reload_rate = this.reload_rate - 10;
      SET.rendering_groups[SET.killzone_render_level] = [];
      set_state_normal();
      select_tower(this);
    }
    else error("You don't have enough gold to upgrade, you need " + (this.upgrade_cost - SET.gold) + " more.");
  }
  lt.damage = 10;
  lt.set_range(4);
  lt.reload_rate = 250;
  return lt;
};

var Weapon = function(tower,target) {
  var w = new Object();
  w.x = tower.x_mid;
  w.y = tower.y_mid;
  w.target = target;
  w.proximity = 3;
  w.damage = tower.damage;
  w.impact = function(target) {
    this.is_dead = function() { return true; };
    target.hp -= this.damage;
  }
  w.update = function() {
    var distance = dist(this.x,this.y,this.target.x,this.target.y);
    if (distance < this.proximity) {
      this.impact(this.target);
    }
    else {
      var path = calc_path(this.x,this.y,target.x,target.y,this.speed);
      this.x += path.x;
      this.y += path.y;
    }
  }
  w.is_dead = function() { 
    if (!target || target.hp <= 0) return true;
    return false;
  };
  return w;
}

var Missile = function(tower,target) {
  var m = new Object();
  Object.extend(m, Weapon(tower,target));
  m.size = 10;
  m.color = color(255,0,0);
  m.fill_color = color(250,50,50);
  m.speed = 5;
  m.damage = tower.damage;
  m.proximity = 20;
  m.draw = function() {
    stroke(m.color);
    fill(m.fill_color);
    var mx = this.x;
    var my = this.y;
    var size = this.size;
    var tx = target.x;
    var ty = target.y;
    var tth = Math.atan((ty-my)/(tx-mx));
    var angle = 2.35619449; // 135 degrees in radians
    triangle(mx,my,
            mx+size * Math.cos(tth - 2.35619449), my+size * Math.sin(tth + 2.35619449),
            mx+size * Math.cos(tth + 2.35619449), my+size * Math.sin(tth - 2.35619449));
  }
  return m;
};

var Laser = function(tower,target) {
  var l = new Object();
  Object.extend(l, Weapon(tower,target));
  l.tail = 20; // length of laser's graphic
  l.color = color(0,0,255);
  l.speed = 10;
  l.draw = function() {
    var path = calc_path(l.x,l.y,tower.x_mid,tower.y_mid,l.tail);
    stroke(l.color);
    line(l.x,l.y,l.x+path.x,l.y+path.y);
  }
  return l;
};

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
  chp.is_dead = function() {
    if (!creep || SET.state != SET.selecting_creep_state || creep.is_dead()) {
      set_state_normal();
      return true;
    }
    else return false;
  }
  assign_to_depth(chp, SET.system_render_level);
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
      var path = calc_path(this.x,this.y,SET.exit.x_mid,SET.exit.y_mid,this.speed);
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
    CreepHpUpdater(this);
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
}

/*
  User-interface functions.
 */

var set_state_normal = function() {
  SET.state = SET.normal_state;
  SET.state_action = undefined;
  SET.state_legal = undefined;
  SET.state_draw = undefined;
  SET.bg_color = SET.bg_colors.neutral;
  WIDGETS.tower.style.display = "none";
  WIDGETS.creep.style.display = "none";
}

var build_tower_mode = function() {
  SET.state = SET.placing_tower_state;
  SET.state_legal = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    return can_build_here(gpos.gx,gpos.gy);
  };
  SET.state_draw = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    var mid = center_of_square(gpos);
    var radius = SET.pixels_per_square;
    SET.rendering_groups[SET.killzone_render_level] = [];
    BuildRadius(mid.x,mid.y,radius);
  }
  var pos = mouse_pos();
  SET.state_draw(pos.x,pos.y); // draws missile instantly, for hotkeys
};

var build_missile_tower = function() {
  var cost = 100;
  if (SET.gold >= cost) {
    build_tower_mode();
    SET.state_action = function(x,y) {
      var gpos = pixel_to_grid(x,y);
      MissileTower(gpos.gx,gpos.gy);
      SET.gold -= cost;
      set_state_normal();
    }
  }
  else {error("Not enough gold, you need at least 100")}
};
  
var build_laser_tower = function() {
  if (SET.gold >= 50) {
    build_tower_mode();
    SET.state_action = function(x,y) {
      var gpos = pixel_to_grid(x,y);
      LaserTower(gpos.gx,gpos.gy);
      SET.gold -= 50;
      set_state_normal();
    }
  }
  else {error("Not enough gold, you need at least 50")}
};

var select_tower = function(tower) {
  SET.state = SET.selecting_tower_state;
  KillZone(tower.x_mid,tower.y_mid,tower.range*SET.pixels_per_square);
  tower.display_stats();
  WIDGETS.tower.style.display = "block";
};

var select_creep = function(creep) {
  SET.state = SET.selecting_creep_state;
  creep.display_stats();
  WIDGETS.creep.style.display = "block";
}

var aim_missile = function(x,y) {
  var cost = 50;
  if (SET.gold > cost) {
    var radius = SET.missile_blast_radius*SET.pixels_per_square;
    SET.state = SET.aiming_missile_state;
    SET.state_draw = function(x,y) {
      SET.rendering_groups[SET.killzone_render_level] = [];
      MissileRadius(x,y,radius);
    }
    SET.state_action = function(x,y) {
      var creeps = SET.rendering_groups[SET.creep_render_level];
      creeps.forEach(function(creep) {
	  var distance = dist(x,y,creep.x,creep.y);
	  if (distance <= radius) creep.hp = Math.floor(creep.hp / 2);
	});

      SET.gold -= cost;
    }
    SET.state_legal = function(x,y) {
      var gpos = pixel_to_grid(x,y);
      return can_build_here(gpos.gx,gpos.gy);
    };
    var pos = mouse_pos();
    SET.state_draw(pos.x,pos.y); // draws missile instantly, for hotkeys
  }
  else {error("Not enough gold, you need at least 50")}
};

var spawn_wave = function() {
  //a bonus for bravery, to be paid when the creep wave thus spawned is done
  var bonus = Math.floor(((SET.creep_wave_controller.last + SET.creep_wave_controller.delay) - SET.now) / 100); 
  SET.creep_wave_controller.spawn_wave(bonus);
}

var nuke_creeps = function() {
  if (SET.nukes > 0) {
    var creeps = SET.rendering_groups[SET.creep_render_level];
    creeps.forEach(function(x) { 
	x.hp = -1; 
	x.value = 0; // no gold for nuked creeps
      });
    SET.nukes--;
  }
  else {error("You're all out of nukes!")}
};

var pause_resume = function() {
  if (SET.state == SET.game_over_state) return undefined;
  if (SET.state != SET.pause_state) SET.state = SET.pause_state;
  else SET.state = SET.normal_state;
};

var game_lost = function() {
  SET.score += SET.gold;
  SET.gold = 0;
  SET.state = SET.game_over_state;
  $('').trigger("game_over",true);
}

/*
  Game level functions. Starting, resetting, etc.
 */

var reset_game = function() {
  SET = default_set();
  WIDGETS = fetch_ui_widgets();
  SettingUpdater();
  UIUpdater();
  Grid();
  SET.creep_wave_controller = CreepWaveController();
  SET.entrance = Square(0, random(SET.gheight-1), SET.entrance_color);
  SET.exit = Square(SET.gwidth-1, random(SET.gheight-1), SET.exit_color);
  $('').trigger("game_over",false);
};

/*
  Mouse functions.
 */

var on_mouse_moved = function() {
  var pos = mouse_pos();
  if (SET.state != SET.normal_state && SET.state_legal) {
    if (SET.state_legal(pos.x,pos.y) == true)
      SET.bg_color = SET.bg_colors.positive;
    else SET.bg_color = SET.bg_colors.negative;
    }
  else {
    SET.bg_color = SET.bg_colors.neutral;
  }
  if (SET.state_draw) SET.state_draw(pos.x,pos.y);
};

var on_mouse_press = function() {
  //ignore mouse clicks if it's paused or game over
  if (SET.state == SET.game_over_state || SET.state == SET.pause_state)
    return

  var pos = mouse_pos();
  if (SET.state == SET.normal_state || SET.state == SET.selecting_tower_state) {
    set_state_normal();
    var gpos = pixel_to_grid(pos.x,pos.y);
    var tower = get_tower_at(gpos.gx,gpos.gy);
    if (tower != false) select_tower(tower);
    else {
      var creep = get_creep_nearest(pos.x,pos.y);
      if (creep) select_creep(creep);
    }
  }
  else {
    if (SET.state_legal && SET.state_legal(pos.x,pos.y) == true)
      SET.state_action(pos.x,pos.y);
    set_state_normal();
  }
};

var unselect = function() {
  if ([SET.aiming_missile_state, SET.placing_tower_state].indexOf(SET.state) != -1)
    set_state_normal();
}

var message = function(msg) {
  $('').trigger("message", msg);
}

var error = function(msg) {
  $('').trigger("error", msg);
}

/* 
   Main game loop.
 */

var start_tower_defense = function() {
  setup = function() {
    $('#pause_button').html("Pause");
    set_canvas("tower_defense");
    reset_game();
    size(SET.width, SET.height);
    frameRate(SET.framerate);
    mouseMoved(on_mouse_moved);
    mousePressed(on_mouse_press);
    initProcessing();
  }
  draw = function() {
    if (SET.state != SET.game_over_state && SET.state != SET.pause_state) {
      background(SET.bg_color);
      update_groups(SET.rendering_groups);
    }
  }
  setup();
}
