---
layout:   post
title:    Differences Between var, let, and const
author:   Kimtaeng
tags: 	  javascript variable scope
description: Explore the differences between var, let, and const introduced in ECMAScript 2015 (ES6).
category: Script
comments: true
slug:     javascript-difference-between-var-let-and-const
lang:     en
permalink: /en/post/javascript-difference-between-var-let-and-const
---

# var, let, const

Before ES6, variables were typically declared like this:

```javascript
var foo = '1';
var foo = '2';
```

You can declare variables without `var`, but that makes them global, which leads to collisions.
Also, as shown above, `var` allows duplicate declarations without any errors.

ECMAScript 2015 (ES6) introduced `let` and `const`.
Let’s look at how each declaration behaves.

<br/>

# Scope

The first difference is scope. `var` has **function scope**, while `let` and `const` have **block scope**.
Let’s walk through examples.

```javascript
var foo = 1;

function fuc() {
    var foo = 2;
    console.log('foo in function : ' + foo);
}

if(true) {
    var foo = 3;
}

func();
console.log('foo : ' + foo);

// output
// foo in function : 2
// foo : 3
```

Because `var` is function-scoped, the assignment inside the `if` block updates the same variable.
Now compare that with `let`.

```javascript
let foo = 1;

function func() {
    let foo = 2;
    console.log('foo in function : ' + foo);
}

if(true) {
    let foo = 3;
}

func();
console.log('foo : ' + foo);

// output
// foo in function : 2
// foo : 1
```

Because `let` is block-scoped, the variable inside the block is a different binding and only exists within that block.

<br/>

# Redeclaration and Reassignment

`var` is permissive. You can redeclare the same variable name without errors.
That can cause bugs when you forget about a previous declaration.

```javascript
var foo = 'a';
console.log(foo); // 'a'
foo = 'b';
console.log(foo); // 'b'

// if there are many lines here...
var foo = 'c';
console.log(foo); // 'c'
```

`let` is stricter. Redeclaring the same name throws an error.

```javascript
let foo = 'a';
console.log(foo); // 'a'
foo = 'b';
console.log(foo); // 'b'

// redeclaration throws an error
let foo = 'c'; // Uncaught SyntaxError: Identifier 'foo' has already been declared
```

`const` behaves similarly, but it also disallows reassignment.

```javascript
const foo = 'a';
console.log(foo); // 'a'
foo = 'b'; // VM456:1 Uncaught TypeError: Assignment to constant variable.

// redeclaration also throws an error
const foo = 'c'; // Uncaught SyntaxError: Identifier 'foo' has already been declared
```

<br/>

# Hoisting

Hoisting can make code harder to read. It means declarations are moved to the top of their scope.
Consider the following:

```javascript
console.log(foo); // undefined
var foo = 'a';
console.log(foo); // 'a'
```

This code runs because `var` declarations are hoisted. The engine rewrites it like this:

```javascript
var foo; // hoist the declaration
console.log(foo);
var foo = 'a';
console.log(foo);
```

The same applies to `var` in a `for` loop. The variable remains visible outside the loop.

```javascript
for(var count = 1; count <= 3; count++) {
    console.log('count : ' + count);
}
console.log('Finished : ' + count);
// output
// count : 1
// count : 2
// count : 3
// Finished : 4
```

`let` behaves differently. Accessing it before declaration throws an error.

```javascript
console.log(foo);
// Uncaught SyntaxError: Identifier 'foo' has already been declared
let foo = 'a';
console.log(foo);
```

<br/>

# Summary

From a **scope** perspective, `var` is **function-scoped**, while `let` and `const` are **block-scoped**.
`var` also allows **hoisting**, while `let` and `const` do not.
Finally, `const` prevents reassignment because it declares a constant binding.
