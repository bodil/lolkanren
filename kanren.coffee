_ = this._ || require 'underscore'
exports = this.exports || {};

succeed = (result) -> [result]
fail = () -> []

_disj = (l, r) -> (x) -> [].concat(l(x), r(x))

_conj = (l, r) -> (x) -> _.flatten(_.map(l(x), r), true)

disj = () ->
  return fail if _.isEmpty(arguments)
  _disj(_.first(arguments), disj.apply(this, _.rest(arguments)))

conj = () ->
  clauses = _.toArray(arguments)
  return succeed if _.isEmpty(clauses)
  return _.first(clauses) if _.size(clauses) is 1
  _conj(_.first(clauses),
        (s) -> conj.apply(null, _.rest(clauses))(s))

class LVar
  constructor: (@name) ->

lvar = (name) -> new LVar(name)
isLVar = (v) -> (v instanceof LVar)

find = (v, bindings) ->
  lvar = bindings.lookup(v)
  return lvar if isLVar(v)
  if _.isArray(lvar)
    if _.isEmpty(lvar)
      return lvar
    else
      return [].concat([find(_.first(lvar), bindings)],
                       find(_.rest(lvar), bindings))
    lvar

class Bindings
  constructor: (seed = {}) ->
    @binds = _.extend({}, seed)
  extend: (lvar, value) ->
    o = {}
    o[lvar.name] = value
    new Bindings(_.extend({}, @binds, o))
  has: (lvar) ->
    @binds.hasOwnProperty(lvar.name)
  lookup: (lvar) ->
    return lvar if !isLVar(lvar)
    return this.lookup(@binds[lvar.name]) if this.has(lvar)
    lvar

ignorance = new Bindings()

unify = (l, r, bindings) ->
  t1 = bindings.lookup(l)
  t2 = bindings.lookup(r)

  if _.isEqual(t1, t2)
    return s
  if isLVar(t1)
    return bindings.extend(t1, t2)
  if isLVar(t2)
    return bindings.extend(t2, t1)
  if _.isArray(t1) && _.isArray(t2)
    s = unify(_.first(t1), _.first(t2), bindings)
    s = if (s isnt null) then unify(_.rest(t1), _.rest(t2), bindings) else s
    return s
  return null

eq = (l, r) ->
  (bindings) ->
    result = unify(l, r, bindings)
    return succeed(result) if result isnt null
    return fail(bindings)

run = (goal) -> goal(ignorance)

membero = ($v, list) ->
  return fail if _.isEmpty(list)

  disj(eq($v, _.first(list)), membero($v, _.rest(list)))
