var CircleZone = function(x,y,r) {
  var cz = new Object();
  Object.extend(cz, InertDrawable);
  var d = 2*r;
  cz.color = SET.killzone_color;
  cz.draw = function() {
    fill(this.color);
    stroke(255);
    ellipse(x,y,d,d);
  };
  return cz
}

var KillZone = function(x,y,r) {
  var kz = new CircleZone(x,y,r);
  assign_to_depth(kz, SET.killzone_render_level);
  return kz;
};

var BuildRadius = function(x,y,r) {
  var br = KillZone(x,y,r);
  assign_to_depth(br, SET.build_zone_render_level);
  return br;
};

var MissileRadius = function(x,y,r) {
  var mr = KillZone(x,y,r);
  mr.color = color(0, 40,40,0.5);
  return mr;
}

var Tower = function(settings) {
  var tower = GridSquare(settings.gx,settings.gy,settings.color);
  Object.extend(tower, settings);
  // note, range is in terms of grid squares
  // and is calculated from center of tower
  tower.set_range = function(range) {
    tower.range = range;
    tower.prange = range * SET.pixels_per_square;
  };
  tower.account_for_terrain = function() {
    var terrain = get_terrain_at(this.gx,this.gy);
    this.damage = this.damage * terrain.tower_damage_modifier;
    this.set_range(this.range * terrain.tower_range_modifier);
    this.reload_rate = this.reload_rate * terrain.tower_frequency_modifier;
  };
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
    var closest_creep;
    var closest_distance;
    creeps.forEach(function(creep) {
      var distance = dist(tower.x_mid,tower.y_mid,creep.x,creep.y);
      if (distance < tower.prange) {
        if (!closest_creep) {
          closest_creep = creep;
          closest_distance = distance;
        }
        else {
          if (distance < closest_distance) {
            closest_creep = creep;
            closest_distance = distance;
          }
        }
      }
    });
    if (closest_creep && tower.weapon_ready() == true)
      tower.attack(closest_creep);
  }
  tower.sale_value = 50;
  tower.sell = function() {
    SET.gold += Math.floor(this.sale_value * 0.75);
    this.is_dead = function() { return true; };
    SET.grid_cache_at(this.gx,this.gy).tower = undefined;

    unselect();
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
      reset_pathfinding();
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
  mt.damage = 5000;
  mt.upgrade_cost = 100;
  mt.sale_value = 100;
  mt.set_range(5.5);
  mt.reload_rate = 2000;
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

      unselect();
      SET.state = new TowerSelectMode();
      SET.state.set_up(this.x_mid,this.y_mid);
    }
    else error("You don't have enough gold to upgrade, you need " + (this.upgrade_cost - SET.gold) + " more.");
  }
  mt.account_for_terrain();
  return mt;
}

var LaserTower = function(gx,gy) {
  var lt = Tower({gx:gx,gy:gy,color:color(90,150,50)});
  lt.type = "Laser Tower";
  lt.attack = function(creep) {
    assign_to_depth(Laser(this,creep),SET.bullet_render_level);
  };
  lt.upgrade_cost = 25;
  lt.sale_value = 13;
  lt.upgrade = function() {
    if (SET.gold >= this.upgrade_cost) {
      SET.gold -= this.upgrade_cost;
      this.sale_value = Math.floor(this.sale_value + this.upgrade_cost);
      this.upgrade_cost = Math.floor(this.upgrade_cost * 1.5);
      this.damage = Math.floor(this.damage * 2.0);
      this.set_range(this.range + 0.25);
      this.reload_rate = this.reload_rate - 10;

      unselect();
      SET.state = new TowerSelectMode();
      SET.state.set_up(this.x_mid,this.y_mid);
    }
    else error("You don't have enough gold to upgrade, you need " + (this.upgrade_cost - SET.gold) + " more.");
  }
  lt.damage = 10;
  lt.set_range(4);
  lt.reload_rate = 250;
  lt.account_for_terrain();
  return lt;
};

var CannonTower = function(gx,gy) {
  var lt = Tower({gx:gx,gy:gy,color:color(100,120,140)});
  lt.type = "Cannon Tower";
  lt.attack = function(creep) {
    assign_to_depth(CannonBall(this,{x:creep.x, y:creep.y, hp:1}),SET.bullet_render_level);
  };
  lt.upgrade_cost = 75;
  lt.sale_value = 50;
  lt.upgrade = function() {
    if (SET.gold >= this.upgrade_cost) {
      SET.gold -= this.upgrade_cost;
      this.sale_value = Math.floor(this.sale_value + this.upgrade_cost);
      this.upgrade_cost = Math.floor(this.upgrade_cost * 1.5);
      this.damage = Math.floor(this.damage * 2.0);
      this.set_range(this.range + 0.25);
      this.reload_rate = this.reload_rate - 10;

      unselect();
      SET.state = new TowerSelectMode();
      SET.state.set_up(this.x_mid,this.y_mid);
    }
    else error("You don't have enough gold to upgrade, you need " + (this.upgrade_cost - SET.gold) + " more.");
  }
  lt.damage = 100;
  lt.set_range(4);
  lt.reload_rate = 1000;
  lt.account_for_terrain();
  return lt;
};

var GatlingTower = function(gx,gy) {
  var gt = Tower({gx:gx,gy:gy,color:color(250,250,50)});
  gt.type = "Gatling Tower";
  gt.damage = 50;
  gt.upgrade_cost = 25;
  gt.sale_value = 50;
  gt.set_range(3.5);

  gt.reload_rate = 100;
  gt.shots_per_volley = 12;
  gt.shots_left_in_volley = gt.shots_per_volley;
  gt.pause_after_volley = 2000;
  gt.finish_reload_at = 0;
  gt.reloading = false;
  gt.fire_next_at = 0;

  gt.weapon_ready = function() {
    if (gt.reloading && gt.finish_reload_at < SET.now) {
      gt.shots_left_in_volley = gt.shots_per_volley;
      gt.reloading = false;
    }
    if (!gt.reloading && gt.fire_next_at < SET.now) {
      return true;
    }
    return false;
  };

  gt.attack = function(creep) {
    assign_to_depth(Bullet(this,creep),SET.bullet_render_level);
    gt.shots_left_in_volley--;
    gt.fire_next_at = SET.now + gt.reload_rate;
    if (gt.shots_left_in_volley < 1) {
      gt.reloading = true;
      gt.finish_reload_at = SET.now + gt.pause_after_volley;
    }
  }

  gt.upgrade = function() {
    if (SET.gold >= this.upgrade_cost) {
      SET.gold -= this.upgrade_cost;
      this.sale_value = Math.floor(this.sale_value + this.upgrade_cost);
      this.upgrade_cost = Math.floor(this.upgrade_cost * 1.5);
      this.damage = Math.floor(this.damage * 2.5);
      this.set_range(this.range + 0.5);
      this.reload_rate = Math.floor(this.reload_rate * 0.95);
      unselect();
      SET.state = new TowerSelectMode();
      SET.state.set_up(this.x_mid,this.y_mid);
    }
    else error("You don't have enough gold to upgrade, you need " + (this.upgrade_cost - SET.gold) + " more.");
  }
  gt.account_for_terrain();
  return gt;
}

var Weapon = function(tower,target) {
  var w = new Object();
  w.x = tower.x_mid;
  w.y = tower.y_mid;
  w.target = target;
  w.tower = tower;
  w.proximity = 7;
  w.damage = tower.damage;
  w.last = millis();
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
      var elapsed = 1.0 * (SET.now - this.last);
      var speed = this.speed * (elapsed/1000);
      this.last = SET.now;
      move_towards(this, this.x,this.y,target.x,target.y,this.speed);
    }
  }
  w.is_dead = function() {
    if (!target || target.hp <= 0) return true;
    return false;
  };
  return w;
};

var Bullet = function(tower, target) {
  var b = new Object();
  Object.extend(b, Weapon(tower,target));
  b.size = 5;
  b.color = color(255,255,255);
  b.fill_color = color(100,255,0);
  b.speed = 8;
  b.damage = tower.damage;
  b.proximity = 10;
  b.draw = function() {
    stroke(b.color);
    fill(b.fill_color);
    ellipse(this.x,this.y,this.size,this.size);
  }
  return b;
}

var CannonBall = function(tower, target) {
  var c = new Object();
  Object.extend(c, Weapon(tower,target));
  c.midpoint = {x:Math.floor((c.x + target.x)/2.0), y:Math.floor((c.y + target.y) / 2.0)};
  c.middist = dist(c.x, c.y, c.midpoint.x, c.midpoint.y);
  c.min_size = 8
  c.size_variance = 4;
  c.color = color(0,0,0);
  c.fill_color = color(50,50,50);
  c.speed = 8;
  c.damage = tower.damage;
  c.proximity = 25;
  c.splash_range = 50.0;
  c.draw = function() {
    var percent_to_apex = ((this.middist - dist(this.x, this.y, this.midpoint.x, this.midpoint.y)) / this.middist);
    size = ((1 - Math.pow(1 - percent_to_apex, 2)) * this.size_variance) + this.min_size;
    log("drawing cannonball", size);
    stroke(this.color);
    fill(this.fill_color);
    ellipse(this.x,this.y,size,size);
  };
  c.impact = function(target) {
    this.is_dead = function() { return true; };
    var creeps = SET.rendering_groups[SET.creep_render_level];
    var l = creeps.length;
    var range = Math.floor(this.splash_range);
    for (var i=0;i<l;i++) {
      var creep = creeps[i];
      var d = Math.floor(dist(this.x,this.y,creep.x,creep.y));
      if (d <= range) {
        creep.hp -= this.damage;
      }
    }
  };

  return c;
};

var Missile = function(tower,target) {
  var m = new Object();
  Object.extend(m, Weapon(tower,target));
  m.size = 10;
  m.color = color(255,0,0);
  m.fill_color = color(250,50,50);
  m.speed = 8;
  m.damage = tower.damage;
  m.proximity = 20;
  m.is_dead = function() {
    if (!this.target || this.target.hp <= 0) {
      this.target = get_creep_nearest(this.x,this.y,100);
      //log("new target: " + pp(this.target));
    }
    if (!this.target) return true;
    return false;
  }

  m.draw = function() {
    stroke(m.color);
    fill(m.fill_color);
    var mx = this.x;
    var my = this.y;
    var size = this.size;
    var tx = this.target.x;
    var ty = this.target.y;
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
  l.proximity = 10;
  l.draw = function() {
    var path = calc_path(l.x,l.y,tower.x_mid,tower.y_mid,l.tail);
    stroke(l.color);
    line(l.x,l.y,l.x+path.x,l.y+path.y);
  }
  return l;
};
