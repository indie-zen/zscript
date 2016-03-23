
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

Other languages can do exactly what ZScript does, and ZScript can do anything these other languages can do, but ZScript reverses the default behavior because the default behavior is what Zen Spaces requires.

Things that can be done in other languages that require additional syntax or code can be done with ZScript without using any additional code, but some of the things that you might take for granted in other languages (such as setting the value of a field of an object) require additional code in ZScript.

### Metadata vs code

Within ZScript, functions aren't executed immediately because they're built through composition and inheritance.  

When a function is defined and a function call to that function is defined, the calls are not executed, but rather the metadata for functions and function calls are created first, and it takes additional instructions to actually execute the function calls.

This could easily be done in Lisp through the use of macros and metadata, but that would require the programmer to always remember to use the metadata and macro syntax.  

With ZScript, the default is the creation of a macro / metadata and it requires additional / special syntax to execute the code.  This is the opposite of Lisp.

Instead of a REPL (read, evaluate, print loop), we have a read, compile, manipulate, subscribe.  The compile / manipulate step is where functions are compiled and then manipulated, and instead of a single execution, the results are a subscription, so if values change then the functions are re-executed as required for the subscription.

### Reactive

Zen Spaces functions are executed in a reactive way, with function calls memoized and normally implemented as a subscription instead of as a single function call.  This could easily be implemented in other languages (Python, ES6, Lisp) but the memoized / reactive functions would require additional syntax instead of being the default.

### Event sourced

Within Zen Spaces, objects are never directly manipulated through setting of properties on objects or directly manipulating values on objects in the way other languages allow.  Instead, classes and collections within Zen Spaces have actions that when activated generate an event.  The target object interprets the event and during this interpretation the object can be manipulated.

In the Zen Spaces object data store, instead of storing objects, the events used to create and manipulate the objects are stored.  *(For performance reasons, the resulting object may be cached, and it's possible that different versions of the object can be cached)*  


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
define a symbol to be a specified value.  

The value may be a `FunctionDefinition`, a `FunctionCall`, or a constant.

Example:

```
(def x 10)
(def sum (func [x y] (+ x y)))
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
use a namespace for a list of symbols

Example:

```
(using mynamespace a b c)
 => [mynamepace.a mynamepace.b mynamepace.c]
```

### with
Call a list of functions with the specified args.

Example:

```
(with [1] [print log display])
=> [(print 1) (log 1) (display 1)]
```

Can also be `(with [1] print log display)` where the rest of the arguments are converted to a list.


### map
Call a function once for each item in a list of arguments

Example:

```
(map add1 1 2 3)
=> [(add1 1) (add1 2) (add1 3)]
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
=> (sum 1 (sum 2 (sum 3 nil)))
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

Augment a list of function calls with another argument.

Example:

```
(apply (map add 1 2 3) 1)
=> (apply [(add 1) (add 2) (add 3)] 1)
=> [(add 1 1) (add 2 1) (add 3 1)]
```

Remember, these function calls are not evaluated yet and are still just a list of FunctionCall objects.

Should the last argument of apply optionally be a list?

```
(apply (map add 1 2 3) [4 5 6])
=> [(add 1 4) (add 2 5) (add 3 6)]
```

or the same thing except without the list, and using a variable list of args?

```
(apply (map add 1 2 3) 4 5 6)
```

At which point I'm wondering what's the difference between map and apply?  Couldn't that be the same with:

```
(apply (apply (add) [1 2 3] [4 5 6]))
```
or does that need to be this?

```
(apply (apply [(add) (add) (add)] [1 2 3]) [4 5 6])
```

Notice the minor difference, where in this case "add" is now "(add)" which results in a function call without any arguments; the inner "apply" adds the first arguments `[1 2 3]` and the second map adds the second arguments `[4 5 6]`.
