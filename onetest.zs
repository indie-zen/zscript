(def my_namespace
  (namespace {
    myFunc
      (func [[x y]](+ x y))

    cmd_mul
      (func [[x y]](* x y))

    cmd_add
      (func [[x y]](+ x y))
  }))

(def dispatch
  (func [[cmd data]]
    (call (using my_namespace (deref cmd)) data )))

(def dispatch_all
  (func [cmds]
    (map dispatch (pairs cmds))))

(def tests (pairs [
  (dispatch_all [
      cmd_mul [2 3]
      cmd_add [4 5] ]) [6 9]
    ]))
