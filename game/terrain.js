
/* File to contain Terrain implementation.  */
var Terrain = function(gx,gy, type) {
  type = type || "neutral";
  var coords = grid_to_pixel(gx, gy);
  var square = CreateKind(type + "-terrain", {x:coords.x, y:coords.y});
  square.type = type;
  square.gx = gx; square.gy = gy;
  var mid = center_of_square(gx,gy);
  square.x_mid = mid.x;
  square.y_mid = mid.y;
  square.tower_range_modifier = 1.0;
  square.tower_damage_modifier = 1.0;
  square.tower_frequency_modifier = 1.0;
  return square;
}

var WaterTerrain = function(gx,gy) {
  return Terrain(gx,gy,"water");
}
  
var MountainTerrain = function(gx,gy) {
  var t = Terrain(gx,gy,"mountain");
  t.tower_range_modifier = 1.25;
  return t;
}

var PowerPlantTerrain = function(gx,gy) {
  var t = Terrain(gx,gy,"power-plant");
  t.tower_damage_modifier = 2.0;
  return t;
}

var populate_terrains = function() {
  var p_mountains = SET.terrain_percent_mountains || 0.05;
  var p_water = SET.terrain_percent_water || 0.1;
  var p_power_plant = SET.terrain_percent_power_plant || 0.01;
  // remainder is neutral terrain

  var range_mountain = p_mountains;
  var range_water = p_mountains + p_water;
  var range_power_plant = p_power_plant + range_water;
  // remainder is neutral terrain

  var entrance = SET.entrance;
  var exit = SET.exit;
  var gwidth = SET.gwidth;
  var gheight = SET.gheight;
  
  var grid = $('#grid_layer');
  
//   column with entrance & exit squares
//   are all neutral terrain
  for (var gy=0; gy<gheight; gy++) {
    if ( gy != entrance.gy ) {
      grid.append(Terrain(0,gy));
    }
    if ( gy != exit.gy ) {
      grid.append(Terrain(gwidth-1,gy));
    }
  }

  
  for (var gx=1; gx<gwidth-1; gx++) {
    for (var gy=0; gy<gheight; gy++) {
      var n = Math.random();
      var t = undefined;
      if (n <= range_mountain)
        t = MountainTerrain(gx,gy);
      else if (n <= range_water)
        t = WaterTerrain(gx,gy);
      else if (n <= range_power_plant)
        t = PowerPlantTerrain(gx,gy);
      else
        t = Terrain(gx,gy);
      grid.append(t);
    }
  }


}
