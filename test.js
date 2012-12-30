var k = require("./kanren");
var assert = require("chai").assert;

describe("lolkanren", function() {

  describe("nondeterministic functions", function() {
    it("fail/succeed", function() {
      assert.deepEqual(k.fail(5), []);
      assert.deepEqual(k.succeed(5), [5]);
    });

    it("disj/conj", function() {
      var f1 = function(x) { return k.succeed(x + "foo"); },
          f2 = function(x) { return k.succeed(x + "bar"); },
          f3 = function(x) { return k.succeed(x + "baz"); };

      assert.deepEqual(k.disj(f1, f2, f3)("a "), ["a foo", "a bar", "a baz"]);
      assert.deepEqual(k.conj(f1, f2, f3)("a "), ["a foobarbaz"]);
    });

    it("complex disj/conj", function() {
      assert.deepEqual(
        k.disj(k.disj(k.fail, k.succeed),
               k.conj(
                 k.disj(function(x) { return k.succeed(x + 1); },
                        function(x) { return k.succeed(x + 10); }),
                 k.disj(k.succeed, k.succeed)))(100),
        [100, 101, 101, 110, 110]);
    });
  });

  describe("logic variables", function() {
    it("primitives", function() {
      assert(k.is_lvar(k.lvar("ohai")));

      var s = k.ext_s(k.lvar("x"), k.lvar("y"), k.empty_subst);
      assert.deepEqual(s, {"_.x": "_.y"});
      assert.deepEqual(k.empty_subst, {}, "do not mutate empty_subst");

      s = k.ext_s(k.lvar("y"), 1, s);
      assert.deepEqual(s, {"_.x": "_.y", "_.y": 1});
      assert.deepEqual(k.empty_subst, {}, "do not mutate empty_subst");

      assert.deepEqual(k.lookup(k.lvar("y"), s), 1);
      assert.deepEqual(k.lookup(k.lvar("x"), s), 1);
    });

    it("unify x and y", function() {
      assert.deepEqual(
        k.unify(k.vx, k.vy, k.empty_subst),
        {"_.x": "_.y"});
    });

    it("unify x and y with y == 1", function() {
      assert.deepEqual(
        k.unify(k.vx, 1, k.unify(k.vx, k.vy, k.empty_subst)),
        {"_.x": "_.y", "_.y": 1});
    });

    it("unify x and y with y == 1 and lookup x", function() {
      assert.deepEqual(
        k.lookup(k.vy, k.unify(k.vx, 1, k.unify(k.vx, k.vy, k.empty_subst))),
        1);
    });


    it("unify (x,y) with (y,1)", function() {
      assert.deepEqual(
        k.unify([k.vx, k.vy], [k.vy, 1], k.empty_subst),
        {"_.x": "_.y", "_.y": 1});
    });
  });

  describe("logic engine", function() {
    it("2 is an element of [1, 2, 3]", function() {
      assert.deepEqual(
        k.run(
          k.membero(2, [1, 2, 3])
        ),
        [{}]);
    });

    it("10 is not an element of [1, 2, 3]", function() {
    assert.deepEqual(
      k.run(
        k.membero(10, [1, 2, 3])
      ),
      []);
    });

    it("q is an element of [1, 2, 3]", function() {
      assert.deepEqual(
        k.run(
          k.membero(k.vq, [1, 2, 3])
        ),
        [{"_.q": 1}, {"_.q": 2}, {"_.q": 3}]);
    });

    it("q is an element of [1, 2, 3] and an element of [2, 3, 4]", function() {
      assert.deepEqual(
        k.run(
          k.conj(
            k.membero(k.vq, [1, 2, 3]),
            k.membero(k.vq, [2, 3, 4])
          )
        ),
        [{"_.q": 2}, {"_.q": 3}]);
    });

    it("result should only care about the values of q", function() {
      assert.deepEqual(
        k.run(k.vq,
              k.conj(
                k.membero(k.vq, [1, 2, 3]),
                k.membero(k.vq, [2, 3, 4])
              )
             ),
        [2, 3]);
    });

    it("q is a list of the two elements 1 and 2", function() {
      assert.deepEqual(
        k.run(k.vq,
              k.joino(1, 2, k.vq)
             ),
        [[1, 2]]);
    });

    it("1 and q join to make the list [1, 2]", function() {
      assert.deepEqual(
        k.run(k.vq,
              k.joino(1, k.vq, [1, 2])
             ),
        [2]);
    });
  });

});
