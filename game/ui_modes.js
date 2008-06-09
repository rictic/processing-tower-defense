/*
  User-interface functions.
 */

var UserInterfaceMode = function() {
 this.action = function(x,y) {
    // called when the mouse is clicked, if is_legal
 };
 this.is_legal = function(x,y) {
    // returns true,false or undefined.
    // if true, then the UI mode's action can be undertaken
    // at @x, @y. If false, then it cannot be undertaken.
    // Otherwise, the UI has no concept of legality.
    // The distinction between undefined and true lies in
    // visual cues presented to the user.
    return undefined;
 };
 this.draw = function(x,y) {
    // draw any relevant graphics at the mouse's location
 };
 this.set_up = function() {
    // do any setup before entering the UI mode
 };
 this.tear_down = function() {
    // perform any clean up before exiting the UI mode.
 };
 this.can_leave_mode = function(x,y) {
    // used to check if the the UI mode can be left
    return true;
 };
 this.can_enter_mode = function(x,y) {
    // used for checking if a UI can be invoked
    return true;
 };
 this.name = function() {
    return "UserInterfaceMode";
 };
};

var attempt_to_enter_ui_mode = function(mode, error_msg) {
  /*
    This is only necessary for button based UI modes. This
    logic is already handled for UI modes invoked by mouse
    clicks in the game canvas.
   */
  if (!SET.state || SET.state.can_leave_mode()) {
    unselect();
    if (mode.can_enter_mode()) {
      SET.state = mode;
      var pos = mouse_pos();
      SET.state.set_up(pos.x,pos.y);
    }
    else if (!error_msg)
      {error("Not enough gold, you need at least " + mode.cost)};
  }
};

var BuildTowerMode = function() {
  var is_blocking_paths = function(gpos) {
    //if the proposed tower isn't along any known path, it's not in
    //the way
    pathfind({gx:SET.entrance.gx, gy:SET.entrance.gy});
    if (!([gpos.gx,gpos.gy] in known_best_paths)) {
      var safe = true;
//       log("looking at diagonals of",gpos);
      [[1,1],[-1,-1],[1,-1],[-1,1]].forEach(function(pair) {
//         log("diagonal",{gx:gpos.gx + pair[0], gy:gpos.gy + pair[1]});
        if (!valid_path_location(gpos.gx + pair[0], gpos.gy + pair[1])){
//           log("diagonal disqualified from free is_blocking call",gpos);
          safe = false;
        }
      });
      if (safe)
        return true;
    }

//     log("pathfinding on behaf of", gpos);

    //check that we can pathfind from the entrance
    //to the exit, and from each creep to the exit
    SET.considering_location = gpos;
    var previous_pathfinding = reset_pathfinding();
    var valid = pathfind({gx:SET.entrance.gx, gy:SET.entrance.gy});
    var creeps = SET.rendering_groups[SET.creep_render_level];
    creeps.forEach(function(creep){
      valid = valid && pathfind(pixel_to_grid(creep));
    });
    SET.considering_location = undefined;
    reset_pathfinding(previous_pathfinding);
    if (!valid)
      return false;
    return true;
  }

  this.is_legal = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    if (can_build_here(gpos.gx,gpos.gy) == false) return false;

    var cache = SET.grid_cache_at(gpos.gx, gpos.gy);
    if (cache["valid_tower_location"] == undefined){
//       log("grid grid miss");
      cache["valid_tower_location"] = is_blocking_paths(gpos);
//       log("placing tower ok?", cache["valid_tower_location"]);
    }
//     else log("in grid cache");

    return cache["valid_tower_location"];
  };
  this.draw = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    var mid = center_of_square(gpos);
    var radius = SET.half_pixels_per_square;
    if (this.br)
      this.br.is_dead = function() { return true; }
    this.br = BuildRadius(mid.x,mid.y,radius);
    if (this.is_legal(x,y))
      this.br.color = SET.bg_colors.positive;
    else
      this.br.color = SET.bg_colors.negative;

  };
  this.set_up = function(x,y) {
    this.draw(x,y);
    $('').trigger(this.name());
  };
  this.tear_down = function() {
    if (this.br) {
      this.br.is_dead = function() { return true; };
    }
  };
  this.action = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    this.tower(gpos.gx,gpos.gy);
    SET.gold -= this.cost;
    reset_pathfinding();
  };
  this.can_enter_mode = function(x,y) {
    if (SET.gold >= this.cost) return true;
    else return false;
  };
  this.can_leave_mode = function() {
    //if we don't have enough money, we can't keep building
    if (SET.gold < this.cost) return true;
    //remain in build mode if shift is held down
    return !shift_down;
  };
  this.name = function() {
    return "BuildTowerMode";
  };
};
BuildTowerMode.prototype = new UserInterfaceMode();

var BuildMissileTowerMode = function() {
  this.cost = 100;
  this.tower = MissileTower;
  this.name = function() {
    return "BuildMissileTowerMode";
  };
};
BuildMissileTowerMode.prototype = new BuildTowerMode();


var build_missile_tower = function() {
  attempt_to_enter_ui_mode(new BuildMissileTowerMode());
};

var BuildCannonTowerMode = function() {
  this.cost = 75;
  this.tower = CannonTower;
  this.name = function() {
    return "BuildCannonTowerMode";
  };
};
BuildCannonTowerMode.prototype = new BuildTowerMode();


var build_cannon_tower = function() {
  attempt_to_enter_ui_mode(new BuildCannonTowerMode());
};

var BuildLaserTowerMode = function() {
  this.cost = 25;
  this.tower = LaserTower;
  this.name = function() {
    return "BuildLaserTowerMode";
 };
};
BuildLaserTowerMode.prototype = new BuildTowerMode();

var build_laser_tower = function() {
  attempt_to_enter_ui_mode(new BuildLaserTowerMode());
};

var BuildGatlingTowerMode = function() {
  this.cost = 50;
  this.tower = GatlingTower;
  this.name = function() {
    return "BuildGatlingTowerMode";
  }
};
BuildGatlingTowerMode.prototype = new BuildTowerMode();

var build_gatling_tower = function() {
  attempt_to_enter_ui_mode(new BuildGatlingTowerMode());
}


/* TowerSelectMode */

var TowerSelectMode = function() {
  this.set_up = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    this.tower = get_tower_at(gpos.gx,gpos.gy);
    if (this.tower) {
      this.tower.display_stats();
      this.killzone = KillZone(this.tower.x_mid,
      this.tower.y_mid,
      this.tower.range*SET.pixels_per_square);
      WIDGETS.tower.style.display = "block";
    }
  };
  this.tear_down = function() {
    WIDGETS.tower.style.display = "none";
    if (this.killzone)
      this.killzone.is_dead = function() { return true; };
  };
  this.can_enter_mode = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    var tower = get_tower_at(gpos.gx,gpos.gy);
    return (tower == false) ? false : true;
  }

};
TowerSelectMode.prototype = new UserInterfaceMode();

var select_tower = function() {
  SET.state = new TowerSelectMode();
};

/* CreepSelectMode */

var CreepSelectMode = function() {
  this.set_up = function(x,y) {
    this.creep = get_creep_nearest(x,y);
    if (this.creep) {
      this.creep.display_stats();
      WIDGETS.creep.style.display = "block";
      this.hp_updater = CreepHpUpdater(this.creep);
    }
  };
  this.tear_down = function() {
    WIDGETS.creep.style.display = "none";
    if (this.hp_updater) {
      this.hp_updater.should_die = true;
    }
  };
  this.name = function() {
    return "CreepSelectMode";
  };
};
CreepSelectMode.prototype = new UserInterfaceMode();

var select_creep = function() {
  SET.state = CreepSelectMode();
};

/* AimBombMode */

var AimBombMode = function() {
  this.cost = SET.bomb_cost;
  this.radius = SET.missile_blast_radius * SET.pixels_per_square * 1.0;
  this.draw = function(x,y) {
    if (this.mr) this.mr.is_dead = function() { return true; };
    this.mr = MissileRadius(x,y,this.radius);
  }
  this.set_up = function(x,y) {
    this.draw(x,y);
    $('').trigger("AimBombMode");
  }
  this.tear_down = function() {
    if (this.mr) this.mr.is_dead = function() { return true; };
  }
  this.can_enter_mode = function(x,y) {
    if (SET.gold >= this.cost) return true;
    else return false;
  };
  this.name = function() {
    return "AimBombMode";
  };
  this.is_legal = function() { return true; };
  this.action = function(x,y) {
    var creeps = SET.rendering_groups[SET.creep_render_level];
    var l = creeps.length;
    var range = Math.floor(this.radius);
    for (var i=0;i<l;i++) {
      var creep = creeps[i];
      var d = Math.floor(dist(x,y,creep.x,creep.y));
      if (d <= range)
        creep.hp = Math.floor(creep.hp / 2);
    }
    play_sound("bomb");
    SET.gold -= this.cost;
    var cost_increase = SET.bomb_cost * 0.25;
    if (cost_increase < 25) cost_increase = 25;
    SET.bomb_cost = Math.floor(SET.bomb_cost + cost_increase);
    WIDGETS.bomb_cost.innerHTML = SET.bomb_cost;
  }
}
AimBombMode.prototype = new UserInterfaceMode();

var aim_bomb = function(x,y) {
  attempt_to_enter_ui_mode(new AimBombMode());
};

var PauseMode = function() {
  this.name = function() { return "PauseMode" };
  this.can_leave_mode = function(x,y) {
    return false;
  };
  this.set_up = function() {
    this.began_at = millis();
    $('').trigger("PauseMode");
  }
  this.tear_down = function() {
    var elapsed = millis() - this.began_at;
    SET.rendering_groups.forEach(function(group) {
      group.forEach(function(member) {
      if (member.last)
        member.last += elapsed;
      });
    });
  }
  this.name = function() { return "PauseMode"; };
};
PauseMode.prototype = new UserInterfaceMode();

var GameOverMode = function() {
  this.set_up = function(x,y) {
    SET.score += SET.gold;
    SET.gold = 0;
    $('').trigger("game_over",true);
  }
  this.name = function() { return "GameOverMode"; };
  this.can_leave_mode = function(x,y) { return false; };
};
GameOverMode.prototype = new UserInterfaceMode();
