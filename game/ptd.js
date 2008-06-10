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
*/
  
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
  
  set.stage = $('#tower_defense');
  // constants
  set.pixels_per_square = $('#grid_square')[0].width.baseVal.value;;
  set.half_pixels_per_square = set.pixels_per_square / 2.0;
  set.height = set.stage[0].height.baseVal.value;
  set.width = set.stage[0].width.baseVal.value;
  set.gheight = Math.floor(set.height / set.pixels_per_square);
  set.gwidth = Math.floor(set.width / set.pixels_per_square);
  log("set.gheight", set.gheight);
  log("set.gwidth", set.gwidth);
  log("set.pixels_per_square", set.pixels_per_square);
  /*
    ### Grid Cache

    This is a place to store any data that should be associated
    with a specific grid square. For example, each grid square
    will have the Terrain occupying it stored there, and a grid
    square's tower could be retrieved this way as well.

    ### Using the Grid Cache
    
    The Grid Cache is, as it is named, intended to be
    used as a cache. This means it shouldn't be relied upon as the
    definitive answer to a question, but should be used to store
    answers to frequently answered questions.

    For example, the find_tower_at(gx,gy) method is used to find
    any towers existing at (gx,gy). That method should first check
    the cache for a key of 'tower', and use it if it exists, but
    should be able to find the tower without the cache as well
    (by scanning through all towers looking for the correct
    one).

    ### Invalidating Entries in Grid Cache

    Entries in the Grid Cache will be cleared out each time the
    game is reset, and beyond that invalidating of key/value pairs
    must be done manually.

    For example, upon selling a tower the value of the tower stored
    in the cache should be extinguished.
   */
  set.grid_cache = {};
  

  set.grid_cache_at = function(gx,gy) {
    var gx_cache = set.grid_cache[gx];
    if (!gx_cache) {
      gx_cache = {};
      set.grid_cache[gx] = gx_cache;
    }
    var gy_cache = gx_cache[gy];
    if (!gy_cache) {
      gy_cache = {};
      gx_cache[gy] = gy_cache;
    }
    return gy_cache;
  }

  set.grid_cache_reset_all_values_for_key = function(key) {
    set.grid_cache.forEach(function (group) {
      group.forEach(function (member) {
        member[key] = undefined;
      });
    });
  }


  // rendering groups
  set.rendering_groups = [];
  for (var i=0;        i <= 7; i++) set.rendering_groups.push([]);
  set.system_render_level = 7;
  set.square_render_level = 6;
  set.killzone_render_level = 5;
  set.grid_render_level = 4;
  set.tower_render_level = 3;
  set.build_zone_render_level = 2;
  set.creep_render_level = 1;
  set.bullet_render_level = 0;

  // game state
  set.state = undefined;

  // game values
  set.creep_variety = "Normal Creeps";
  set.creep_size = 10;
  set.creep_hp = 10;
  set.creep_value = 1;
  set.creep_speed = 50;
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
    play_sound("nuke");
    SET.nukes--;
  }
  else {error("You're all out of nukes!")}
};


var pause_resume = function() {
  if (SET.state) {
    var state_name = SET.state.name();
    if (state_name == "GameOverMode")
      ;
    else if (state_name == "PauseMode") {
      unselect();
    }
    else {
      unselect();
      SET.state = new PauseMode();
      SET.state.set_up();
    }
  }
  else {
    SET.state = new PauseMode();
    SET.state.set_up();
  }
};

var game_lost = function() {
  unselect();
  attempt_to_enter_ui_mode(new GameOverMode());
}

/*
  Game level functions. Starting, resetting, etc.
 */

var generate_map = function() {
  var grid = $("#grid_layer");
  grid.empty();
  SET.entrance = Terrain(0, random(SET.gheight-1), "entrance");
  SET.exit = Terrain(SET.gwidth-1, random(SET.gheight-1), "exit");
  $("#grid_layer").append(SET.entrance, SET.exit);
  populate_terrains();
}
  
var reset_game = function() {
  SET = default_set();
  WIDGETS = fetch_ui_widgets();
  SettingUpdater();
  UIUpdater();
  //Grid();
  generate_map();
  SET.creep_wave_controller = CreepWaveController();
  reset_pathfinding();
  $('').trigger("game_over",false);
};

/*
  Mouse functions.
 */

var on_mouse_moved = function() {
  if (SET.state && SET.state.draw) {
    var pos = mouse_pos();
    SET.state.draw(pos.x,pos.y);
  }
};

// user-interface modes that can be entered by clicking within
// the game canvas (i.e. this does not include states reached
// by clicking an html button)
var UI_MODES_FROM_CLICK = [TowerSelectMode, CreepSelectMode];

var on_mouse_press = function() {
  var pos = mouse_pos();
  if (SET.state) {
    if (SET.state.is_legal(pos.x,pos.y)) {
      SET.state.action(pos.x,pos.y);
    }
    if (SET.state.can_leave_mode(pos.x,pos.y)) {
      unselect();
    }
  }
  if (!SET.state) {
    var len = UI_MODES_FROM_CLICK.length;
    for (var i=0;i<len;i++) {
      var modeFunc = UI_MODES_FROM_CLICK[i];
      var mode = new modeFunc();
      if (mode.can_enter_mode(pos.x,pos.y)) {
        SET.state = mode;
        SET.state.set_up(pos.x,pos.y);
        break;
      }
    }
  }
}


var message = function(msg) {
  $('').trigger("message", msg);
}

var unselect = function() {
  if (SET.state) SET.state.tear_down();
  SET.state = undefined;
  $('').trigger("no_mode");
}

var error = function(msg) {
  $('').trigger("error", msg);
}

/* 
   Main game loop.
 */

var init_tower_defense = function() {
  $('#pause_button').html("Pause");
  reset_game();
  frameRate(SET.framerate);
//   mouseMoved(on_mouse_moved);
//   mousePressed(on_mouse_press);
  run_tower_defense();
}

var millisBetweenUpdates = 10;
var frameRate = function(rate) {
  millisBetweenUpdates = 1000.0 / rate
}

var interval = undefined;
var run_tower_defense = function(){
  interval = setInterval(run_tower_step, millisBetweenUpdates);
}
var stop_tower_defense = function(){
  clearInterval(interval);
}

// a single step in the game
var run_tower_step = function() {
  if (SET.state) {
    var state_name = SET.state.name();
    if (state_name == "GameOverMode" || state_name == "PauseMode") return
  }
  //get objects
  //call objects.update or whatever
}