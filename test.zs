;;; Global function with two args
(def sum
  (func [x y]
    (+ x y)))

;;; Global function with one arg
(def inc
  (func
    [value]
      (+ value 1)))

;;; Positional destructuring
(def sum_of_list_of_two
  (func
    [[a b]]
      (+ a b)))

;;; Map with a regular function
(def inc_list
  (func
    [list]
      (map inc list) ))

;;; Map with a lambda function
(def double_list
  (func
    [list]
      (map (func [x](* x 2)))))

;;; Simple lambda function
(def lambda2
  (func
    []
      (func [] (+ 1 1))))

;;; Simple lambda function returning a constant
(def lambda3
  (func
    []
      (func
        []
          ; returning a constant doesn't work :(
          ;(func [](3)))))
          (func [](+ 1 2)))))

(def tests (pairs [
    ; Simple call to global function
    (sum 1 2) 3

    ; Call to a positional destructuring function
    (sum_of_list_of_two [1 2]) 3

    ; Simple map to a function
    (inc_list [1 7]) [2 8]

    ; Simple lambda function within another function
    (lambda2) 2

    ; Multiple nested lambda functions returning constant
    (lambda3) 3

    ; This lambda doesn't work yet
    ;(func [](+ 1 1)) 2

    ; Maps with a lambda function doesn't work yet
    ;(double_list [1 2]) [2 4]
    ]))
