/* Coordinate System
  
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

//given a start point, and end point, and a speed at which to travel,
//return the point that the entity should go to in the next draw
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
  ellipse(pos.x+h,pos.y+h,l-1,l-1);
};

/*
  Various game utility functions.
 */
  
var can_build_here = function(gx,gy) {
  if ( get_tower_at(gx,gy) != false) return false;
  if ((gx == SET.entrance.gx) && (gy == SET.entrance.gy)) return false;
  if ((gx == SET.exit.gx) && (gy == SET.exit.gy)) return false;
  
  return true;
};

var get_tower_at = function(gx,gy) {
  var cached = SET.grid_cache_at(gx,gy);
  if (cached.tower) return cached.tower;

  var towers = SET.rendering_groups[SET.tower_render_level];
  for (var i=0;i<towers.length;i++) {
    var tower = towers[i];
    if (tower.gx == gx && tower.gy == gy) {
      cached.tower = tower;
      return tower;      
    }
  }
  return false;
};

var get_terrain_at = function(gx,gy) {
  var cached = SET.grid_cache_at(gx,gy);
  if (cached.terrain) return cached.terrain;

  var squares = SET.rendering_groups[SET.square_render_level];
  for (var i=0;i<squares.length;i++) {
    var square = squares[i];
    if (square.gx == gx && square.gy == gy) {
      cached.terrain = square;
      return square;
    }
  }
  return;
}

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

// Object.extend borrowed from Prototype javascript library.
Object.extend = function(destination, source) {
  for (var property in source) {
    destination[property] = source[property];
  }
  return destination;
};

// Pretty-printing of objects
var pp = function(obj, depth) {
  if (depth == undefined) depth = 4;
  depth -= 1;
  if (depth <= 0)
    return '' + obj;
  if (obj instanceof Array) {
    var str = "[";
    obj.forEach(function(i){
      str += pp(i,depth) + ", ";
    });
    return str + "]";
  }
  if (obj instanceof String)
    return '"'+str+'"';
  if (obj instanceof Object){
    var str="{"; //variable which will hold property values
    for(prop in obj){
      if (prop == "ancestor")
        depth = 0;
      str+= pp(prop,depth) + ":" + pp(obj[prop],depth) +", ";
    }
    return str + "}";
  }


  return '' + obj;
    
  
}

var log = function(label, thing) {
  if (thing == undefined)
    $('#log').append(label + "<br/>");
  else
    $('#log').append(label + ": " + pp(thing) + "<br/>");
}


Array.prototype.equals = function(testArr) {
    if (this.length != testArr.length) return false;
    for (var i = 0; i < testArr.length; i++) {
        if (this[i].equals) { 
            if (!this[i].equals(testArr[i])) return false;
        }
        if (this[i] != testArr[i]) return false;
    }
    return true;
}

var insert_sorted = function(array, value, sortKey) {
  var vkey = sortKey(value);
  var min=0;
  var max=array.length;
  var mid=-1;
  while(true){
    if (max<=min) {
      break;
    }
    mid = Math.floor((max+min)/2);
    if (mid >= array.length || mid < 0) {
      log("outofbounds in insert sorted");
      break;
    }
    if (vkey <= sortKey(array[mid]))
      max = mid-1;
    else
      min = mid+1;
  }
  mid = Math.floor((max+min)/2);
  if (array[mid])
    if (vkey > sortKey(array[mid]))
      mid += 1;
  mid = Math.max(0,mid);
  
  var result = array.slice(0,mid).concat([value]).concat(array.slice(mid))
//   log("inserting", [mid,vkey,array.map(sortKey), result.map(sortKey)]);
//   var rm = result.map(sortKey);
//   if (!rm.equals(rm.slice().sort(function(a,b){return a-b})))
//     log("insert_sorted failed inserting",[vkey,rm]);
  return result;
}

//moves the given object towards the target at speed
//also ensures that the given object doesn't go outside of the bounds
//of the map
var move_towards = function(obj, x,y,tx,ty,speed) {
  var path = calc_path(x,y,tx,ty,speed);
  obj.x += path.x;
  obj.y += path.y;
  obj.x = Math.max(0, Math.min(SET.width , obj.x));
  obj.y = Math.max(0, Math.min(SET.height, obj.y));
}