
ZScript
======
***(or should it be called ZLang?)***

Scripting language used for Zen Spaces

This is a functional language that readily describes logic and algorithms within Zen Spaces.

Unlike Lisp /  Clojure, the default for a construct is that it is assumed to be meta data instead of data or code.

Why a new language?
---

ZScript is a lot like Lisp and Clojure, so why build a new language?

### Clarity

The primary reason is because I want to have a language with the syntax that lends itself to naturally describing what is happening within Zen Spaces.

Other languages can do exactly what ZScript does, and ZScript can do anything these other languages can do, but ZScript reverses the default behavior to the default behavior that Zen Spaces assumes. (reactive, meta first, event sourced)

Things that can be done in other languages that require additional syntax or code can be done with ZScript without using any additional code, but some of the things that you might take for granted in other languages (such as setting the value of a field of an object) require additional code in ZScript.

### Meta Programming

Within ZScript, functions aren't executed immediately because they're built through composition and inheritance.  

When a function is defined and a function call to that function is defined, the calls are not executed, but rather the metadata for functions and function calls are created first, and it takes additional instructions to actually execute the function calls.

The reason is because in Zen Spaces, functions are composed and may take multiple steps to get the desired results.

This could easily be done in Lisp through the use of macros and metadata, but that would require the programmer to always remember to use the metadata and macro syntax.  

With ZScript, the default is the creation of a macro / metadata and it requires additional / special syntax to execute the code.

Instead of a REPL (read, evaluate, print loop), we have a read, compile, manipulate, subscribe.  The compile / manipulate steps are where functions are compiled and then manipulated, and instead of a single execution, the results are a subscription, so if values change then the functions are re-executed as required for the subscription.

### Reactive

Zen Spaces functions are executed in a reactive way, with function calls memoized and normally implemented as a subscription instead of as a single function call.  This could easily be implemented in other languages (Python, ES6, Lisp) but the memoized / reactive functions would require additional syntax instead of being the default behavior

### Event sourced

Within Zen Spaces, it's a hard fast rule that objects are never directly manipulated through setting of properties on objects or directly manipulating values on objects in the way other languages allow.  Instead, classes and collections within Zen Spaces have actions that when activated generate an event.  The target object interprets the event and during this interpretation the object can be manipulated.

Because of this, special care needed to be taken to ensure this rule is never broken.  As such, ZScript only allows objects to be manipulated through event handling procedures, and any direct manipulation attempted elsewhere results in a compile time error.  This would be a lot more complicated (and ugly) if this were attempted with another language.  Probably it couldn't be accomplished at compile time, and an additional test step would have to be created to verify that this rule is never broken.

Syntax thoughts and keywords
---

*General thoughts about special keywords within the language:*

This language is still under construction, so there are quite a few sections within this definition that have questions (marked with a question mark).  As I continue developing with this language then those questions will be answered and the language will become more solidified.

Variables don't exist (except possibly in procedures defined using the keyword `proc`?).  Only symbols exist, and those symbols represent a value that doesn't change (see def)

Classes and structures are defined with  `{ key value }` (key value pairs within curly braces) type constructs, which generates meta data, not actual instances.

A function call like `(+ 1 2)` does not yield the results of 3, but rather it creates a `FunctionCall` meta object.  For example:

```
(def sum (func [x y] (+ x y)))
```

generates a `FunctionDefinition` with a body that is a `FunctionCall` to `+` using the arguments x and y, and then assigns Symbol sum with the `FunctionDefinition` object.

### def
Define a symbol to be a specified value.  

The value may be a `FunctionDefinition`, a `FunctionCall`, a `namespace`, another `symbol` or a constant.

Example:

```
(def x 10)
(def sum (func [x y] (+ x y)))
(def add sum)
(add 1 2) ; Equivalent to (sum 1 2)
```

### func
Creates a `FunctionDefinition`

Example:

```
(func [x y] (+ x y))
=> new FunctionDefinition { args [x y] body (+ x y) }
```

### exec?
Executes a procedure? *I'm not yet sure how this should work.*

### proc?
Defines a procedure, which is essentially a list of function calls.  

*Again, as with procedures, I haven't decided how this mechanism will work.  One thought is to make the proc syntax completely different.  Possibly a proc could be defined using a block of ES6 code.*


*Maybe procs can have variables?*  

When a proc is exec'd, the function calls are actually called.

### using
Use a namespace for a list of symbols.  Also see `deref`.

Example:

```
(using mynamespace a b c)
 => [mynamepace.a mynamepace.b mynamepace.c]

(def foo (def bar (func [x y](+ x y))))

(using mynamespace2 (deref foo))
(mynamespace2.bar 1 2) ; Correctly constructs function call to bar
(mynamespace3.foo.bar) ; Error

(using mynamespace3 foo)
(mynamespace3.foo.bar 1 2) ; Correct
```

### with
Call a list of functions with the specified args.

Example:

```
(with [1] [print log display])
=> [(print 1) (log 1) (display 1)]
```

Can also be `(with [1] print log display)` where the rest of the arguments are converted to a list.

If the list being called is a list of lists, the first argument in the list is the function to call, and the additional items in the list are passed as arguments to the function.

```
(with [arg] (pairs [print 1 do 2 eat 3]))
=> (with [arg] [[print 1][do 2][eat 3]])
=> [(print arg 1)(do arg 2)(eat arg 3)]
```


### map
Call a function once for each item in a list of arguments, resulting in a list of function calls.

Example:

```
(map add1 [1 2 3])
=> [(add1 1) (add1 2) (add1 3)]
```

### call
Call a function once with a list of arguments.  This helps to convert a list into a list of arguments (although this isn't necessary if you can use positional destructuring while defining the function).

Example:
```
(map
  (call
    (func [first second](+ first second)))
  (pairs [1 2 3 4]))

;;; The previous is equivalent to this, but requires a different signature
;;; on the function and doesn't require the (call).
(map
  (func [[first second]](+ first second))
  (pairs [1 2 3 4]))

=> (map
    (call
      (func [first second](+ first second)))
    ([[1 2][3 4]]))

=> [call (func [first second](+ first second))[1 2]
   call (func [first second](+ first second))[3 4]]

=> [(func [first second](+ first second) 1 2)
   (func [first second](+ first second) 3 4)]

```

Call can also be used to convert a symbol into a function call.

Example:
```
(def foo (namespace
    { bar
        (func [x y](+ x y))}))

(call (using foo bar)[1 2])

=> (call (foo.bar) [1 2])
=> (foo.bar 1 2)
```
### chain?

Create a call chain. *I'm not sure if this is useful enough to require, or if the syntax is correct.*

Example:

```
(chain 1 inc dec)
=> (inc (dec 1))
```

### reduce
Reduce a list to a single value

Example:

```
(def sum (func [newval previous] (+ newval previous)))
(reduce sum [1 2 3])
=> (sum 1 (sum 2 3))
```

sum is called repeatedly with the first argument applied to the list,
much like the way "map" works, except the result of the previous call is
passed as the second argument of the specified function.

### require
Require another package and assign the resulting package namespace to a symbol.

Example:

```
(require metazen "com.indiezen.metazen")
=> (def metazen (loadsource (resolve-package "com.indiezen.metazen")))
```

This defines a symbol "metazen" and all of the top level symbols within the  "com.indiezen.metazen" package are assigned to a namespace, and that namespace is assigned to the "metazen" symbol.

A package may reside in a pre-compiled package, a pre-compiled database, or in source form within a database, or it might be a file on the local file system or in a file in a source repository such as a local git repo or on GitHub.  The package resolver (may?) require configuration to help resolve the package, including the version number and other meta data that can be used to resolve the location of the package.

### apply?
*(I don't like this name)*

Augment a list of function calls with additional arguments.

Example:

```
(apply (map add [1 2 3]) 1)
=> (apply [(add 1) (add 2) (add 3)] 1)
=> [(add 1 1) (add 2 1) (add 3 1)]
```

Remember, these function calls are not evaluated yet and are still just a list of FunctionCall objects.

Should the last argument of apply optionally be a list?

```
(apply (map add 1 2 3) [4 5 6])
=> [(add 1 4 5 6) (add 2 4 5 6) (add 4 5 6)]
```

or the same thing except without the list, and using a variable list of args?

```
(apply (map add 1 2 3) 4 5 6)
```

### deref
Dereference a symbol.

Example:

```
(def foo (func [x y] (+ x y)))
(def sym foo)

(call sym [1 2])
=> (sym 1 2)

(call (deref sym) [1 2])
=> (call foo [1 2])
(foo 1 2)
```

~~*Possibly this is not necessary; maybe deref should be the default behavior.*~~ *The notes in `namespace` explain why `deref` is necessary.*

### namespace
Construct a namespace using a dictionary

Example:
```
(def foo (namespace
    { bar
        (func [x y](+ x y))}))
```

*This works because x dictionary and `namespace` dereferences it.*

```
(def x
  { bar (func [x y](+ x y))})

(def foo (namespace x))

(foo.bar)
```

*This on the other hand does not work because bar is a symbol within the dictionary, not in the global namespace.:*

```
(def foo (namespace (deref x)))
```

*And what about this?  This actually does work.*

```
(def foo (def bar (func [x y](+ x y))))
(foo.bar 1 2)   ; This works as expected

(def x foo)
(x.foo.bar 1 2) ; This also works

(def y (deref foo))
(y.bar 1 2)     ; This works
(y.foo.bar 1 2) ; This does not work
```

~~*I don't like needing to use deref; it seems redundant, but if the rule is changed so we don't need to use deref like this:*~~

~~*Any symbol that is defined will be dereferenced automatically, but if the symbol hasn't been defined then the name of the symbol is used.*~~

*Incorrect:*

```
; what is bar?  Is it a namespace?  Is it a function?
; In this case I don't think it matters because foo.bar references the correct thing.
(def foo bar)

; But what about this?  What is x.bar?
; I think this works, too... x.bar is the same as foo.bar.  
; x.foo don't exist.
(def x foo)
```

*This causes an inconsistent behavior between `(def foo bar)(foo.bar)` vs `(def x foo)(x.foo)` where the former is valid and the latter is invalid.  If we change the rule to this:*

*Any symbol used to define another symbol will not be dereferenced automatically, and if the symbol needs to be dereferenced then use `(deref sym)`.*

*Then that solves the problem, so the answer is that we should not automatically dereference anything, and the author must explicitly dereference symbols if that is what is desired.*

### getname / getfqname
Get the name of a symbol and return it as a string.  `getname` gets the name of the element, while `getfqname` also includes the namespaces within which the symbol resides.

Example:
```
(def bar (func [x y](+ x y)))
(def foo bar)

(getname foo)
=> "foo"

(getname (deref foo))
=> "bar"

(getname foo.bar)
=> "bar"

(getfqname foo.bar)
=> "foo.bar"
```
