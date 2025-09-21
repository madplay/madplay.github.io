---
layout:   post
title:    "Java Scripting API: Migrating to GraalVM"
author:   madplay
tags: 	  java scriptengine graalvm
description: "Let's replace Nashorn script engine, deprecated in Java 11, with GraalVM." 
category: Java
lang: en
slug: call-javascript-function-from-java-using-graalvm
permalink: /en/call-javascript-function-from-java-using-graalvm/
date: "2020-05-23 23:26:53"
comments: true
---

# In the Previous Post
We covered overall usage of `Java Scripting API`: executing JavaScript, managing state, and improving performance using `Compilable`.

- Previous post: <a href="/post/understanding-java-scripting-api">"Java Scripting API: bindings, script context, and execution performance"</a>

As mentioned in the first post of this series, from Java 11, `Nashorn` is officially deprecated,
and its annotation includes `forRemoval`, which means it can disappear in future releases.

<br><br>

# GraalVM
In JEP discussions, Oracle explains Nashorn removal mainly as difficulty in tracking ECMAScript evolution.
The commonly recommended alternative is `GraalVM`.

`GraalVM` is a Java VM that supports multiple languages beyond Java.
Oracle describes it as an alternative with better performance and ECMAScript compatibility than Nashorn.
In this post, we focus on replacing deprecated Nashorn with GraalVM.

<br><br>

# Code That May Stop Working
The basic JavaScript execution code from earlier posts may stop working in future releases,
because `ScriptEngine` for parameter `nashorn` may no longer exist.

For reference, after Java 8, `JavaScript` name maps to Nashorn by default.
(In Java 7, default was `Rhino`.)

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("nashorn");

// prints "Oracle Nashorn"
System.out.println("engine name: " + engine.getFactory().getEngineName());

try {
    // prints 2
    engine.eval("print( Math.min(2, 3) )");
} catch (ScriptException e) {
    System.err.println(e);
}
```

Now let's avoid Nashorn and switch to GraalVM.

<br>

# Let's Migrate
This example uses Maven. (Full source link is at the end.)

## Add Dependencies
Add these dependencies in `pom.xml` and switch script engine implementation.

```xml
<dependency>
    <groupId>org.graalvm.js</groupId>
    <artifactId>js</artifactId>
    <version>19.2.0.1</version>
</dependency>  
<dependency>
    <groupId>org.graalvm.js</groupId>
    <artifactId>js-scriptengine</artifactId>
    <version>19.2.0.1</version>
</dependency>
```

## Change Code
When getting engine from `ScriptEngineManager`, use `graal.js` as engine name.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("graal.js");

// prints "Graal.js"
System.out.println("engine name: " + engine.getFactory().getEngineName());

try {
    // prints 2
    engine.eval("print( Math.min(2, 3) )");
} catch (ScriptException e) {
    System.err.println(e);
}
```

As expected, engine switches to `graal.js`.

This alone removes Nashorn dependency, but compatibility with existing code can be a concern.
For example, `GraalVM` does not expose internal objects like `ScriptObjectMirror` directly.

Most migration guidance is provided in official docs. Link is included at the end.

<br>

# Polyglot API
There is another approach: use GraalVM **Polyglot API**.
With this API, you can run scripts from Java similarly to scripting API.

## Execute Script Declared as String
Use `Context` class in `org.graalvm.polyglot`.
It is `AutoCloseable`, so `try-with-resources` works naturally.
Use `eval` to run JavaScript.

```java
try (Context context = Context.create("js")) {

    // prints 2
    context.eval("js", "print( Math.min(2, 3) )");
} catch (Exception e) {
    System.err.println();
}
```

<br>

## Execute Function in Script File
As with Java Scripting API, you can load external script files and call functions declared there.

Create `sample_script.js` under Maven `resources`:

```js
function accumulator(a, b) {
    return a + b;
}

function makeContract(name, phoneNumber) {
    var contract = new Object();
    contract.name = name;
    contract.phoneNumber = phoneNumber;
    contract.print = function () {
        print('name =' + name)
        print('phoneNumber =' + phoneNumber)
    }
    return contract
}
```

Then Java code:

```java
try (Context context = Context.create("js")) {

    // Reads and executes script file.
    context.eval(Source.newBuilder("js",
            ClassLoader.getSystemResource("sample_script.js")).build());

    // Gets function "accumulator" from context bindings.
    Value accumulatorFunc = context.getBindings("js").getMember("accumulator");

    // Executes function with args 1,2 and maps result to int.
    int result = accumulatorFunc.execute(1, 2).asInt();
    System.out.println("result: " + result);
} catch (IOException e) {
    System.err.println(e);
}
```

Result:

```bash
result: 3
```

Structure is similar to Java Scripting API.
In some places it is even more direct.
Result type mapping differs slightly, so follow migration guide carefully.

<br>

## Object Access
You can also access returned objects, not just function results.
Result mapping differs from Java Scripting API here as well.

```java
try (Context context = Context.create("js")) {
    context.eval(Source.newBuilder("js",
            ClassLoader.getSystemResource("sample_script.js")).build());

    // Gets function "makeContract" from context bindings.
    Value makeContractFunc = context.getBindings("js").getMember("makeContract");

    // Executes function with params and maps result to `Value`.
    Value obj = makeContractFunc.execute("madplay", "010-1234-1234");

    // Prints all key-value entries from returned object.
    obj.getMemberKeys().stream()
            .forEach(key -> System.out.printf("%s: %s\n", key, obj.getMember(key)));
} catch (IOException e) {
    System.err.println(e);
}
```

```bash
name: madplay
phoneNumber: 010-1234-1234
print: function () {
        print('name =' + name)
        print('phoneNumber =' + phoneNumber)
    }

```

<br>

# Closing
Starting from the question "Can Java call JavaScript functions?",
we reviewed `Java Scripting API` and migration from deprecated Nashorn to GraalVM in Java 11+.

As noted earlier, GraalVM also emphasizes security, so direct object access behavior differs from Nashorn.
It can throw conversion errors to prevent loss during Java method calls.

For details, see
<a href="https://github.com/graalvm/graaljs/blob/master/docs/user/NashornMigrationGuide.md"
target="_blank" rel="nofollow">GraalVM: Migration Guide from Nashorn to GraalVM JavaScript</a>.

The guide also mentions Nashorn compatibility mode.
Still, it recommends using compatibility mode only when necessary,
because behavior can differ and may hurt style consistency or performance.

- Reference: <a href="https://github.com/madplay/java-scripting-api" target="_blank">Full example source code (GitHub)</a>
