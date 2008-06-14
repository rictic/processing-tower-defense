var SVGObj = function(kind, opts) {
  var obj = document.createElementNS("http://www.w3.org/2000/svg", kind);
  for (prop in opts){
    opt = opts[prop];
    if (opt instanceof Object)
      obj.setAttributeNS(opt.namespace, prop, opt.value);
    else
      obj.setAttribute(prop, opt);
  }
  return obj;
}
var Group = function(opts) {
  return SVGObj("g", opts);
}
var Rectangle = function(opts) {
  return SVGObj("rect", opts);
}
var Square = function(opts) {
  opts.width = opts.size; opts.height = opts.size;
  delete opts.size;
  return SVGObj("rect", opts);
}
var Circle = function(opts) {
  return SVGObj("circle", opts);
}
var CreateKind = function(name, opts) {
  //href is part of the xlink namespace, not the svg one.  To say the least, it's a sticky wicket to debug
  opts.href = {namespace: "http://www.w3.org/1999/xlink", value: "#" + name}
  return SVGObj("use", opts);
}