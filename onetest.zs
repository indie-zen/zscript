(require requiretest "./requiretest.zs");

(def testsum
  (func [x y]
    (+ 1 (+ x y))))

(def tests (pairs [
  (requiretest.testsum 7 13) 20
  (testsum 7 13) 21
    ]))
