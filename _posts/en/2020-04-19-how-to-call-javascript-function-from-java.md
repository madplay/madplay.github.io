---
layout:   post
title:    "Java Scripting API: Calling JavaScript Functions from Java"
author:   Kimtaeng
tags: 	  java scriptengine
description: "Use the Java Scripting API to invoke functions defined in a JavaScript file from Java." 
category: Java
date: "2020-04-19 23:49:51"
comments: true
lang: en
slug: how-to-call-javascript-function-from-java
permalink: /en/how-to-call-javascript-function-from-java/
---

# JavaScript from Java?
Java provides many APIs, including support for calling JavaScript functions from Java.
That capability comes from the **Java Scripting API**.

`Java Scripting API` has been available for quite a long time.
It was defined as JSR 223 by the Java Community Process (JCP), and it dates back to Java 6.

- Reference: <a href="https://jcp.org/en/jsr/detail?id=223" target="_blank" rel="nofollow">
"JSR 223: Scripting for the Java Platform"</a>

<br><br>

# Looking at the Package
As of Java 11, the Scripting API is in `javax.script`.
The package includes classes and interfaces such as `ScriptEngineManager`,
which locates script engine factories.
In addition to API contracts, the `jdk` also includes script engine implementations.
Rhino was used in early releases, and **Nashorn became the JavaScript engine from Java 8**.

However, according to JEP (JDK Enhancement Proposal), Nashorn was deprecated in Java 11.
The reason: _it fully implemented ECMAScript-262 5.1 at release time, but keeping up with later ECMAScript changes became difficult._

- Reference: <a href="https://openjdk.java.net/jeps/335" target="_blank" rel="nofollow">
"JEP 335: Deprecate the Nashorn JavaScript Engine"</a>
- Reference: <a href="https://openjdk.java.net/jeps/372" target="_blank" rel="nofollow">
"JEP 372: Remove the Nashorn JavaScript Engine"</a>

It is also marked for future removal. The implementation itself shows `@Deprecated`
with `forRemoval=true`.

```java
 /**
 * ... omitted
 *
 * @deprecated Nashorn JavaScript script engine and APIs, and the jjs tool
 * are deprecated with the intent to remove them in a future release.
 *
 * @since 1.8u40
 */
@Deprecated(since="11", forRemoval=true)
public final class NashornScriptEngine extends AbstractScriptEngine implements Compilable, Invocable {
```

We can discuss alternatives later. For now, let’s focus on `Java Scripting API`
and how it executes JavaScript functions from Java.

<br><br>

# ScriptEngineManager
This class is the entry point for Java Scripting API usage.
It discovers all script engine factories available from the class loader.
You can obtain an engine with:

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");
```

You execute scripts through the returned `ScriptEngine`.
`ScriptEngineManager` also exposes all available factories.
You can print them with the following code:

```java
ScriptEngineManager manager = new ScriptEngineManager();
List<ScriptEngineFactory> engineFactories = manager.getEngineFactories();

for (ScriptEngineFactory factory : engineFactories) {
    System.out.println("engine name: " + factory.getEngineName());
    System.out.println("engine version: " + factory.getEngineVersion());

    String extensions = factory.getExtensions().stream()
            .collect(Collectors.joining(", "));
    System.out.println("extensions: " + extensions);

    System.out.println("language name: " + factory.getLanguageName());
    System.out.println("language version: " + factory.getLanguageVersion());

    String mimeTypes = factory.getMimeTypes().stream()
            .collect(Collectors.joining(", "));
    System.out.println("mimeTypes: " + mimeTypes);

    String shortNames = factory.getNames().stream()
            .collect(Collectors.joining(", "));
    System.out.println("shortNames :" + shortNames);

    String[] params = {
            ScriptEngine.NAME, ScriptEngine.ENGINE,
            ScriptEngine.ENGINE_VERSION, ScriptEngine.LANGUAGE,
            ScriptEngine.LANGUAGE_VERSION
    };

    for (String param : params) {
        System.out.printf("parameter '%s': %s\n", param, factory.getParameter(param));
    }
    System.out.println("---------------");
}
```

Not shown above: you can pass `"THREADING"` to `getParameter`.
In `NashornScriptEngineFactory`, this returns `null`.
That indicates it is not thread-safe and should not be used for multi-threaded script execution.

Example output:

```bash
engine name: Oracle Nashorn
engine version: 11.0.2
extensions: js
language name: ECMAScript
language version: ECMA - 262 Edition 5.1
mimeTypes: application/javascript, application/ecmascript, text/javascript, text/ecmascript
shortNames: nashorn, Nashorn, js, JS, JavaScript, javascript, ECMAScript, ecmascript
parameter 'javax.script.name': javascript
parameter 'javax.script.engine': Oracle Nashorn
parameter 'javax.script.engine_version': 11.0.2
parameter 'javax.script.language': ECMAScript
parameter 'javax.script.language_version': ECMA - 262 Edition 5.1
---------------
```

As shown, you can easily obtain `ScriptEngine` with these methods:

- `getEngineByName`
  - Looks up by script engine name. It matches the `shortNames` list.
  - nashorn, Nashorn, js, JS, JavaScript, javascript, ECMAScript, ecmascript
- `engineByExtension`
  - Looks up by script extension.
  - For `Oracle Nashorn`, use `js`.
- `engineByMimeType`
  - Looks up by script MIME type.
  - application/javascript, application/ecmascript, text/javascript, text/ecmascript

In practice, `getEngineByName` is usually the most convenient, so this post uses it.

<br><br>

# Executing Scripts: Basic Inline Expression
Now execute a script with the `ScriptEngine` obtained above.
Use the `eval` method.
This example calls JavaScript `Math.min`.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

try {
    Object result = engine.eval("Math.min(2, 3)");

    if (result instanceof Integer) {
        System.out.println(result);
    }
} catch (ScriptException e) {
    System.err.println(e);
}
```

The script executes normally. If an error occurs while executing, `ScriptException` is thrown.

```bash
Hello Madplay!
2
```

<br><br>

# Executing Scripts: Using Bindings
We will cover this in more detail later, but Scripting API provides a `Bindings` interface.
Its implementations can store and retrieve state.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

try {
    // Store the string value "madplay" under the name "myName"
    engine.put("myName", "madplay");

    // Execute script; if myName is "madplay", assign "kimtaeng" to yourName
    engine.eval("var yourName = ''; if (myName === 'madplay') yourName = 'kimtaeng'");

    // Print the result by reading the "yourName" variable
    System.out.println("Your name: " + engine.get("yourName"));

} catch (ScriptException e) {
    System.err.println(e);
}
```

As expected, the output contains `kimtaeng`.
With Scripting API, you can store and read values inside the script engine state.

<br><br>

# Executing Scripts: Loading and Calling from File
Besides inline scripts in Java code, you can load an external JavaScript file
and run functions defined in it.

In a `Maven` project, create `sample_script.js` under `resources`:

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

Now write Java code that executes those functions.
The key step is to evaluate the script file first with `eval`.
So file loading appears at the beginning of the code.

Function calls use the `Invocable` interface.
Not every engine implements `Invocable`, so check it before use.
If supported, call global functions with `invokeFunction`.

There is also `invokeMethod`, which calls a function on an object obtained from the script.
You pass the object returned by `invokeFunction` and invoke a specific member function.

```java
ScriptEngineManager manager = new ScriptEngineManager();
ScriptEngine engine = manager.getEngineByName("JavaScript");

try {
    engine.eval(Files.newBufferedReader(Paths.get(
            ClassLoader.getSystemResource("sample_script.js").toURI())));

    // Does this script engine implement Invocable?
    if(!(engine instanceof Invocable))  {
        System.out.println("Invocable interface is not available");
        return;
    }

    // Invocable for running JavaScript functions
    Invocable inv = (Invocable) engine;

    // Call JavaScript function `makeContract` and return result
    Object object = inv.invokeFunction("makeContract", "madplay", "010-1234-1234");

    if (object instanceof ScriptObjectMirror) {
        // Script result is a key/value JavaScript object, so it maps to Map-like structure.
        // Print entries using stream + foreach.
        ScriptObjectMirror scriptObject = (ScriptObjectMirror) object;
        scriptObject.keySet().stream()
                .forEach(key -> {
                    String value = String.valueOf(scriptObject.getOrDefault(key, "Not Found"));
                    System.out.printf("%s: %s\n", key, value);
                });
    }

    System.out.println("----------");

    // Call member function `print` on the object returned by `invokeFunction`
    Object name = inv.invokeMethod(object, "print");

    System.out.println("----------");

    // JavaScript Number operations map to Java Double
    Object result = inv.invokeFunction("accumulator", 1, 2);

    if (result instanceof Double) {
        System.out.println("accumulator: " + result);
    }

} catch (Exception e) {
    System.err.println(e);
}
```

If the function name passed to `invokeFunction` does not exist,
`NoSuchMethodException` is thrown.
If script execution fails, `ScriptException` is thrown.
The first parameter (function name) is checked with `requireNonNull`, so it must not be `null`.

For `invokeMethod`, if the first parameter object is `null`, it throws `IllegalArgumentException`.
Passing a non-script object also throws the same exception with
**"getInterface cannot be called on non-script object"**.
If the second parameter is not a function name on that object,
`NoSuchMethodException` is thrown with **"No such function name"**.

Output from the example:

```bash
name: madplay
phoneNumber: 010-1234-1234
print: function () {
        print('name =' + name)
        print('phoneNumber =' + phoneNumber)
    }
----------
name =madplay
phoneNumber =010-1234-1234
----------
accumulator: 3.0
```

Both JavaScript functions execute correctly.
A detail to note is the return value of `accumulator`:
JavaScript `Number` maps to Java `Double`, so the result is `3.0`, not integer `3`.

<br><br>

# Next Article
So far, we covered `Java Scripting API` as a way to call JavaScript code from Java.
In the next article, we look at **bindings** for storing and reading state,
and **ScriptContext** for wiring Java code and the JavaScript engine together.

- Next: <a href="/post/understanding-java-scripting-api">"Java Scripting API: Bindings, ScriptContext, and Execution Performance"</a>

All sample source code used in this article is available at
<a href="https://github.com/madplay/java-scripting-api" target="_blank">
"GitHub repository (link)"</a>.
