var _ = require("underscore");

// Nondeterministic functions

var fail = exports.fail = function(x) { return []; };
var succeed = exports.succeed = function(x) { return [x]; };

var _disj = function(f1, f2) {
  return function(x) {
    return [].concat(f1(x), f2(x));
  };
};

var disj = exports.disj = function() {
  var fs = _.toArray(arguments);
  if (_.isEmpty(fs)) return fail;
  return _disj(_.first(fs), disj.apply(this, _.rest(fs)));
};

var _conj = function(f1, f2) {
  return function(x) {
    return _.flatten(_.map(f1(x), f2), true);
  };
};

var conj = exports.conj = function() {
  var fs = _.toArray(arguments);
  if (_.isEmpty(fs)) return succeed;
  if (fs.length == 1) return _.first(fs);
  return _conj(_.first(fs),
               function(s) {
                 return conj.apply(null, _.rest(fs))(s);
               });
};

// Logic variables

var lvar = exports.lvar = function(name) {
  return "_." + name;
};
var is_lvar = exports.is_lvar = function(v) {
  return typeof v == "string" && v.slice(0, 2) == "_.";
};

var empty_subst = exports.empty_subst = {};

var ext_s = exports.ext_s = function(variable, value, s) {
  var n = {};
  n[variable] = value;
  return _.extend({}, s, n);
};

var lookup = exports.lookup = function(variable, s) {
  if (!is_lvar(variable))
    return variable;
  if (s.hasOwnProperty(variable))
    return lookup(s[variable], s);
  return variable;
};

var unify = exports.unify = function(t1, t2, s) {
  t1 = lookup(t1, s);
  t2 = lookup(t2, s);
  if (_.isEqual(t1, t2))
    return s;
  if (is_lvar(t1))
    return ext_s(t1, t2, s);
  if (is_lvar(t2))
    return ext_s(t2, t1, s);
  if (_.isArray(t1) && _.isArray(t2)) {
    s = unify(_.first(t1), _.first(t2), s);
    if (s !== null) s = unify(_.rest(t1), _.rest(t2), s);
    return s;
  }
  return null;
};

var vx = exports.vx = lvar("x");
var vy = exports.vy = lvar("y");
var vz = exports.vz = lvar("z");
var vq = exports.vq = lvar("q");

// Logic engine

var eq = exports.eq = function(t1, t2) {
  return function(s) {
    var r = unify(t1, t2, s);
    if (r !== null)
      return succeed(r);
    else
      return fail(s);
  };
};

var membero = exports.membero = function(variable, list) {
  if (_.isEmpty(list))
    return fail;
  else
    return disj(eq(variable, _.first(list)),
                membero(variable, _.rest(list)));
};

var joino = exports.joino = function(a, b, l) {
  return eq([a, b], l);
};

var _lookup = function(variable, s) {
  var v = lookup(variable, s);
  if (is_lvar(v))
    return v;
  if (_.isArray(v)) {
    if (_.isEmpty(v))
      return v;
    else
      return [_lookup(_.first(v), s)].concat(_lookup(_.rest(v), s));
  }
  return v;
};

var run = exports.run = function(v, g) {
  if (_.isFunction(v)) {
    g = v;
    v = null;
  }
  var r = g(empty_subst);
  if (v === null) return r;
  return r.map(function(s) {
    return _lookup(v, s);
  });
};
