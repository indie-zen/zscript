(require requiretest "./requiretest.zs");

(def testsum
  (func [x y]
    (+ 1 (+ x y))))

(def inc
  (func [x]
    (+ 1 x)))

(def testsum2
  (func [x y]
    (+ 1 (+ (inc x) (testsum x y)))))

(def tests (pairs [
  (requiretest.testsum 7 13) 20
  (testsum 7 13) 21
  (requiretest.subfunc 7 13) 20
  (testsum2 7 13) 30
    ]))
