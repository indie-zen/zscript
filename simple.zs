(def inc
  (func
    [value]
      (+ value 1)))

(def sum
  (func
    [x y]
      (+ x y)))

(def tests (pairs [
    (inc 1) 2
    (sum (inc 1) 1) 3
    ]))
