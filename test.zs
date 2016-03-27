; Global sum function
(def sum
  (func [x y]
    (+ x y)))


; Positional destructuring
(def sum_of_list_of_two
  (func
    [[a b]](+ a b)))


(def tests (pairs [
    (sum 1 2) 3
    (sum_of_list_of_two [1 2]) 3]))
