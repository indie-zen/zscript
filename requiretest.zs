(def testsum
  (func [x y]
    (+ x y)))

;;; This function should call the testsum in this file, not the global one.
(def subfunc
  (func [x y]
    (testsum x y)))
