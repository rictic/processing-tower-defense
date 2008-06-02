
/* File to contain Terrain implementation.  */

var NeutralTerrain = function(gx,gy) {
  var terrain_color = color(200,200,200);
  var t = Square(gx,gy,terrain_color);
  t.type = "neutral";
  t.tower_range_modifier = 1.0;
  t.tower_damage_modifier = 1.0;
  t.tower_frequency_modifier = 1.0;
  return t;
}

var RoadTerrain = function(gx,gy) {
  var t = NeutralTerrain(gx,gy);
  t.color = color(255,0,0);
  t.type = "road";
  return t;
}

var WaterTerrain = function(gx,gy) {
  var t = NeutralTerrain(gx,gy);
  t.color = color(0,0,255);
  t.type = "water";
  return t;
}
  
var MountainTerrain = function(gx,gy) {
  var t = NeutralTerrain(gx,gy);
  t.color = color(255,0,0);
  t.type = "mountain";
  t.tower_range_modifier = 1.25;
  return t;
}

var PowerPlantTerrain = function(gx,gy) {
  var t = NeutralTerrain(gx,gy);
  t.color = color(255,0,0);
  t.type = "power plant";
  t.tower_damage_modifier = 2.0;
  return t;
}
