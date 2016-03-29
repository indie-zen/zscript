;;; Global function with one arg
(def inc
  (func
    [value]
      (+ value 1)))

;;; Map with a regular function
(def inc_list
  (func
    [listOfValues]
      (map inc listOfValues) ))

(def tests (pairs [
    ; Simple map to a function (oops, this is broken now)
    (inc_list [1 7]) [2 8]

    ]))
