(def my_namespace
  (namespace {
    cmd_mul
      (func [[x y]](* x y))
  }))

(def dispatch
  (func [cmd data]
    (call (using my_namespace (deref cmd)) data )))

(def tests (pairs [
  (dispatch cmd_mul [2 3] ) 6
    ]))
