; Simple inline
(+ x y)

; Global sum function
(def sum [x y] (+ x y))
(sum 1 2)

;(def test [text] (def name [] (text)))

;(test 'test')

; Nested calls
(sum (sum 3 4) 5)
