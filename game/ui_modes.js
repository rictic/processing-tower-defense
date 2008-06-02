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
    if (SET.state) SET.state.tear_down();
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
  this.is_legal = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    if (can_build_here(gpos.gx,gpos.gy) == false) return false;
    
    //check that we can pathfind from the entrance
    //to the exit, and from each creep to the exit
    SET.considering_location = gpos;
    reset_pathfinding();
    var valid = pathfind({gx:SET.entrance.gx, gy:SET.entrance.gy});
    var creeps = SET.rendering_groups[SET.creep_render_level];
    creeps.forEach(function(creep){
      valid = valid && pathfind(pixel_to_grid(creep));
    });
    SET.considering_location = undefined;
    if (!valid){
      reset_pathfinding();
      return false;
    }
    return true;
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
  };
  this.tear_down = function() {
    if (this.br) {
      this.br.is_dead = function() { return true; };
    }
  };
  this.can_enter_mode = function(x,y) {
    if (SET.gold >= this.cost) return true;
    else return false;
  };
  this.name = function() { 
    return "BuildTowerMode"; 
  };
};
BuildTowerMode.prototype = new UserInterfaceMode();

var BuildMissileTowerMode = function() {
  this.cost = 100;
  this.action = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    MissileTower(gpos.gx,gpos.gy);
    SET.gold -= this.cost;
    reset_pathfinding();
  };
  this.name = function() {
    return "BuildMissileTowerMode";
  };
};
BuildMissileTowerMode.prototype = new BuildTowerMode();


var build_missile_tower = function() {
  attempt_to_enter_ui_mode(new BuildMissileTowerMode());
};

var BuildLaserTowerMode = function() {
  this.cost = 50;
  this.action = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    LaserTower(gpos.gx,gpos.gy);
    SET.gold -= this.cost;
    reset_pathfinding();
  };
  this.name = function() {
    return "BuildLaserTowerMode";
 };
};
BuildLaserTowerMode.prototype = new BuildTowerMode();

var build_laser_tower = function() {
  attempt_to_enter_ui_mode(new BuildLaserTowerMode());
};

var BuildGattlingTowerMode = function() {
  this.cost = 50;
  this.action = function(x,y) {
    var gpos = pixel_to_grid(x,y);
    GattlingTower(gpos.gx,gpos.gy);
    SET.gold -= this.cost;
    reset_pathfinding();
  };
  this.name = function() {
    return "BuildGattlingTowerMode";
  }
};
BuildGattlingTowerMode.prototype = new BuildTowerMode();

var build_gattling_tower = function() {
  attempt_to_enter_ui_mode(new BuildGattlingTowerMode());
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

/* AimMissileMode */

var AimMissileMode = function() {
  this.cost = 50;
  this.radius = SET.missile_blast_radius * SET.pixels_per_square;
  this.draw = function(x,y) {
    if (this.mr) this.mr.is_dead = function() { return true; };
    this.mr = MissileRadius(x,y,this.radius);
  }
  this.set_up = function(x,y) {
    this.draw(x,y);
  }
  this.tear_down = function() {
    if (this.mr) this.mr.is_dead = function() { return true; };
  }
  this.can_enter_mode = function(x,y) {
    if (SET.gold >= this.cost) return true;
    else return false;
  };
  this.name = function() { 
    return "AimMissileMode"; 
  };
  this.is_legal = function() { return true; };
  this.action = function(x,y) {
    var creeps = SET.rendering_groups[SET.creep_render_level];
    creeps.forEach(function(creep) {
	var distance = dist(x,y,creep.x,creep.y);
	if (distance <= this.radius) creep.hp = Math.floor(creep.hp / 2);
      });
    SET.gold -= this.cost;
  }; 
}
AimMissileMode.prototype = new UserInterfaceMode();

var aim_missile = function(x,y) {
  attempt_to_enter_ui_mode(new AimMissileMode());
};

var PauseMode = function() {
  this.name = function() { return "PauseMode" };
  this.can_leave_mode = function(x,y) {
    return false;
  };
  this.set_up = function() {
    this.began_at = millis();
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
