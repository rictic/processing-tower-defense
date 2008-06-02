var GLOBAL_PROCESSING;
function set_canvas(id) {
  var canvas = document.getElementById(id);
  GLOBAL_PROCESSING = Processing(canvas);
}

function size(height, width) {
  GLOBAL_PROCESSING.size(height, width);
}
function stroke(color) {
  GLOBAL_PROCESSING.stroke(color);
}
function background(color) {
  GLOBAL_PROCESSING.background(color);
}

function line(x1, y1, x2, y2) {
  GLOBAL_PROCESSING.line(x1, y1, x2, y2);
}

var draw = function() {}; // stub to replace

function frameRate(rate) {
  var interval = 1000.00 / rate;
  setInterval(draw, interval);
}

function height() {
  return GLOBAL_PROCESSING.height;
}

function width() {
  return GLOBAL_PROCESSING.width;
}

function rect(x,y,width,height) {
  return GLOBAL_PROCESSING.rect(x,y,width,height);
}

function ellipse(x,y,width,height) {
  return GLOBAL_PROCESSING.ellipse(x,y,width,height);
}

function triangle(x1,y1,x2,y2,x3,y3) {
  return GLOBAL_PROCESSING.triangle(x1,y1,x2,y2,x3,y3);
}

function fill(color) {
  return GLOBAL_PROCESSING.fill(color);
}

var color = function(r,g,b,a) {
  if (!a)
    return "rgb(" + r + "," + g + "," + b + ")";
  else
    return "rgba(" + r + "," + g + "," + b + "," + a +")";
};

function translate(width, height) {
  return GLOBAL_PROCESSING.translate(width, height);
}

function noFill() {
  return GLOBAL_PROCESSING.noFill();
}

function noStroke() {
  return GLOBAL_PROCESSING.noStroke();
}

function mouse_pos() {
  return {x:GLOBAL_PROCESSING.mouseX, y:GLOBAL_PROCESSING.mouseY};
}

function previous_mouse_pos() {
  return {x:GLOBAL_PROCESSING.pmouseX, y:GLOBAL_PROCESSING.pmouseY};
}

function mousePressed(func) {
  GLOBAL_PROCESSING.mousePressed = func;
}

function mouseReleased(func) {
  GLOBAL_PROCESSING.mouseReleased = func;
}

function mouseMoved(func) {
  GLOBAL_PROCESSING.mouseMoved = func;
}

function mouseReleased(func) {
  GLOBAL_PROCESSING.mouseDragged = func;
}

function millis() {
  return GLOBAL_PROCESSING.millis();
}

function initProcessing() {
  GLOBAL_PROCESSING.init();
}
