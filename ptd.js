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
}
var selected_tower = null
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
  set.height = 400;
  set.width = 600;
  set.framerate = 60;
  set.gheight = Math.floor(set.height / set.pixels_per_square);
  set.gwidth = Math.floor(set.width / set.pixels_per_square);

  // colors
  set.bg_colors = {neutral:color(90,80,70),
      positive:color(90,80,70),
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
  set.state = set.normal_state;

  // game values
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
  w.score = document.getElementById("score");
  w.gold = document.getElementById("gold");
  w.creeps = document.getElementById("creeps");
  w.towers = document.getElementById("towers");
  w.lives = document.getElementById("lives");
  w.nukes_left = document.getElementById("nukes_left");
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
    WIDGETS.score.innerHTML = SET.score;
    WIDGETS.gold.innerHTML = SET.gold;
    WIDGETS.creeps.innerHTML = SET.rendering_groups[SET.creep_render_level].length + " / " + SET.creeps_spawned;
    WIDGETS.towers.innerHTML = SET.rendering_groups[SET.tower_render_level].length;
    WIDGETS.lives.innerHTML = SET.lives;
    WIDGETS.nukes_left.innerHTML = SET.nukes + " remaining";
  };
  assign_to_depth(uiu, SET.system_render_level);
  return uiu;
}

var CreepWaveController = function() {
  var cwc = new Object();
  SET.creep_controller = cwc;
  Object.extend(cwc, InertDrawable);
  cwc.delay = 25000;
  cwc.last = millis()-20000;
  cwc.wave = 0;
  cwc.spawn_wave = function() {
    CreepWave({wave:this.wave});
    this.wave++;
    this.last = SET.now;
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
  cw.spawn = function() {
    this.remaining--;
    Creep(this.wave);
    if (this.remaining < 1) this.is_dead = function() { return true; };
  }

  cw.update = function() {
    if (SET.now - this.last > this.interval) {
      this.spawn();
      this.last = SET.now;
    }
  }
  assign_to_depth(cw, SET.system_render_level);
  return cw;
}

var KillZone = function(tower) {
  var x = tower.x_mid; var y = tower.y_mid;
  var r = tower.prange;
  var kz = new Object();
  Object.extend(kz, InertDrawable);
  kz.is_dead = function() {
    if (selected_tower != tower)
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

var BuildRadius = function(x,y) {
  var br = new Object();
  Object.extend(br, InertDrawable);
  br.is_dead = function() {
    if (SET.state != SET.placing_tower_state)
      return true;
    return false;
  }
  var d = SET.pixels_per_square;
  br.draw = function() {
    fill(color(100,100,100)); // no fill;
    stroke(30);
    ellipse(x,y,d,d);
  }
  assign_to_depth(br, SET.killzone_render_level);   
  return br;
}

var MissileRadius = function(x,y,r) {
  var mr = new Object();
  Object.extend(mr, InertDrawable);
  mr.is_dead = function() {
    if (SET.state != SET.aiming_missile_state)
      return true;
    return false;
  }
  mr.color = SET.killzone_color;
  var d = 2 * r;
  mr.draw = function() {
    fill(mr.color);
    stroke(255);
    ellipse(x,y,d,d);
  }
  assign_to_depth(kz, SET.killzone_render_level); 
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
    if (creeps.length == 0) return;
    var closest_creep = null;
    var closest = 100000000;
    creeps.forEach(function(c) {
      var c_dist = dist(tower.x_mid, tower.y_mid, c.x, c.y);
      if (c_dist <= closest && c_dist < tower.prange)
        closest_creep = c; closest = c_dist;
    });
    if (closest_creep != null && tower.weapon_ready()) 
      tower.attack(closest_creep);
  }
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
  mt.damage = 100;
  mt.set_range(5.5);
  mt.reload_rate = 750;
  mt.attack = function(creep) {
    assign_to_depth(Missile(this,creep),SET.bullet_render_level);
  }  
  return mt;
}

var LaserTower = function(gx,gy) {
  var lt = Tower({gx:gx,gy:gy,color:color(50,150,250)});
  lt.attack = function(creep) {
    assign_to_depth(Laser(this,creep),SET.bullet_render_level);
  };
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
  m.speed = 5;
  m.damage = tower.damage;
  m.proximity = 20;
  m.draw = function() {
    stroke(m.color);
    var mx = this.x;
    var my = this.y;
    var size = this.size;
    var tx = target.x;
    var ty = target.y;
    var tth = Math.atan((ty-my)/(tx-mx));

    triangle(mx,my,mx+size * Math.cos(tth + 135),my+size * Math.sin(tth - 135),mx+size * Math.cos(tth - 135),my-size * Math.sin(tth + 135));
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

var Creep = function(wave) {
  var cp = SET.creeps_spawned;
  var c = new Object();
  c.x = SET.entrance.x_mid;
  c.y = SET.entrance.y_mid;
  c.color = SET.creep_color;
  c.size = SET.creep_size;
  c.hp = SET.creep_hp * Math.pow(1.4,wave);
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
  SET.creeps_spawned++;
  assign_to_depth(c, SET.creep_render_level);
  return c;
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
  selected_tower = null;
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
    SET.rendering_groups[SET.killzone_render_level] = [];
    BuildRadius(mid.x,mid.y);
  }
  var pos = mouse_pos();
  SET.state_draw(pos.x,pos.y);
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
  selected_tower = tower;
  KillZone(tower);
};

var aim_missile = function(x,y) {
  var cost = 50;
  if (SET.gold > cost) {
    var radius = SET.missile_blast_radius*SET.pixels_per_square;
    SET.state = SET.aiming_missile_state;
    SET.state_draw = function(x,y) {
      SET.rendering_groups[SET.killzone_render_level] = [];
      MissileRadius(x,y,radius);
    };
    SET.state_action = function(x,y) {
      var creeps = SET.rendering_groups[SET.creep_render_level];
      creeps.forEach(function(creep) {
        var distance = dist(x,y,creep.x,creep.y);
        if (distance <= radius) creep.hp = Math.floor(creep.hp / 2);
      });

      SET.gold -= cost;
    };
    SET.state_legal = function(x,y) {
      var gpos = pixel_to_grid(x,y);
      return can_build_here(gpos.gx,gpos.gy);
    };
    var pos = mouse_pos();
    SET.state_draw(pos.x,pos.y);
  }
  else {error("Not enough gold, you need at least 50")}
};

var nuke_creeps = function() {
  if (SET.nukes > 0) {
    var creeps = SET.rendering_groups[SET.creep_render_level];
    creeps.forEach(function(x) { 
  x.hp = -1; 
  x.value = 0; // no gold for nuked creeps
      });
    SET.nukes--;
  }
  else {error("You have no more nukes!")}
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
  CreepWaveController();
  SET.entrance = Square(0, random(SET.gheight-1), SET.entrance_color);
  SET.exit = Square(SET.gwidth-1, random(SET.gheight-1), SET.exit_color);
};

var spawn_next_wave = function() {
  SET.creep_controller.spawn_wave();
}

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
  var gpos = pixel_to_grid(pos.x, pos.y)
  var tower = get_tower_at(gpos.gx,gpos.gy);

  if (SET.state == SET.normal_state || SET.state == SET.selecting_tower_state) {
    if (tower != false) select_tower(tower);
    else set_state_normal();
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

/* 
   Main game loop.
 */

var message = function(msg) {
  $('').trigger("message", msg);
}

var error = function(msg) {
  $('').trigger("error", msg);
}

var start_tower_defense = function() {
  setup = function() {
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
