---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 2. Creating and Destroying Objects"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Chapter 2. Creating and Destroying Objects"  
category: Java
comments: true
slug:     creating-and-destroying-objects
lang:     en
permalink: /en/post/creating-and-destroying-objects
---

# Table of Contents
- <a href="#item-1-consider-static-factory-methods-instead-of-constructors">Item 1. Consider static factory methods instead of constructors</a>
- <a href="#item-2-consider-a-builder-when-faced-with-many-constructor-parameters">Item 2. Consider a builder when faced with many constructor parameters</a> 
- <a href="#item-3-enforce-the-singleton-property-with-a-private-constructor-or-an-enum-type">Item 3. Enforce the singleton property with a private constructor or an enum type</a>
- <a href="#item-4-enforce-noninstantiability-with-a-private-constructor">Item 4. Enforce noninstantiability with a private constructor</a>
- <a href="#item-5-prefer-dependency-injection-to-hardwiring-resources">Item 5. Prefer dependency injection to hardwiring resources</a>
- <a href="#item-6-avoid-creating-unnecessary-objects">Item 6. Avoid creating unnecessary objects</a>
- <a href="#item-7-eliminate-obsolete-object-references">Item 7. Eliminate obsolete object references</a>
- <a href="#item-8-avoid-finalizers-and-cleaners">Item 8. Avoid finalizers and cleaners</a>
- <a href="#item-9-prefer-try-with-resources-to-try-finally">Item 9. Prefer try-with-resources to try-finally</a>

<br/>

# Item 1. Consider static factory methods instead of constructors
> Consider static factory methods instead of constructors

You can create instances with **public constructors**.
But static factory methods provide several advantages.

## Advantages
### They can have names.
They do not need to match the class name.
For example, which communicates intent better: `BigInteger(int, int, Random)` or `BigInteger.probablePrime`?

If you need multiple constructors with the same signature, use distinct static factory methods instead.
A **signature** is the method name plus its parameter list. If name, parameter types, and order match, the signatures match.

<br>

### They do not have to create a new instance each time.
You can reuse cached instances and reduce unnecessary allocations.
That enables instance-controlled classes that manage when instances are valid.

<br>

### They can return subtypes.
You can return any subtype of the declared return type.
This gives the API flexibility and lets you hide implementation classes.
A smaller API reduces conceptual weight for users.

<br>

### They can return different classes based on parameters.
For example, `EnumSet` returns `RegularEnumSet` for up to 64 elements and `JumboEnumSet` beyond that.

<br>

## Disadvantages
### Classes with only static factory methods cannot be subclassed.
Subclassing requires a public or protected constructor.

<br>

### They are not obvious as constructors.
Static factory methods are just methods, so they are not as visible in Javadoc.
Developers must learn the naming conventions.

- **from:** takes a parameter and returns an instance
  - `Date date = Date.from(instant);`
- **of:** takes multiple parameters
  - `Set<Rank> cards = EnumSet.of(JACK, QUEEN, KING);`
- **valueOf:** more verbose form of from/of
  - `BigInteger prime = BigInteger.valueOf(Integer.MAX_VALUE);`
- **instance / getInstance:** may or may not return the same instance
  - `StackWalker luke = StackWalker.getInstance(options);`
- **create / newInstance:** always creates a new instance
  - `Object newArray = Array.newInstance(classObject, arrayLen);`
- **getType:** like getInstance, but defined on another class
  - `FileStore fs = Files.getFileStore(path);`
- **newType:** like newInstance, but defined on another class
  - `BufferedReader br = Files.newBufferedReader(path);`
- **type:** short form of getType/newType
  - `List<Complaint> litany = Collections.list(someList);`

<div class="post_caption">In short, stop defaulting to public constructors.</div>

<br><br>

# Item 2. Consider a builder when faced with many constructor parameters
> Consider a builder when faced with many constructor parameters

Static factories and constructors are awkward when you have many optional parameters.

- Telescoping constructor pattern
```java
Person person = new Person("Taeng", 29, "010-1234-1234", "hello@gmail.com");
```

- JavaBeans pattern
```java
Person person = new Person();
person.setName("Taeng");
person.setAge(29);
person.setPhoneNumber("010-1234-1234");
person.setEmail("hello@gmail.com");
```

- **Builder pattern** combines safety with readability.
```java
Person person = new Person().Builder("Taeng", 29)
            .phoneNumber("010-1234-1234")
            .email("hello@gmail.com")
            .build();
```

- <a href="/post/builder-when-faced-with-many-constructor-parameters" target="_blank">
Reference: [Effective Java 3rd Edition] Item 2. Consider a builder when faced with many constructor parameters</a>

<div class="post_caption">If constructors or factories have too many parameters, use a builder. This is even more valuable when most parameters are optional or share the same type.</div>

<br><br>

# Item 3. Enforce the singleton property with a private constructor or an enum type
> Enforce the singleton property with a private constructor or an enum type

A **singleton** allows only one instance. There are three common ways.

<br>

### public static final field
```java
public class MadPlay {
    public static final MadPlay INSTANCE = new MadPlay();
    private MadPlay() { }
}
```

<br>

### static factory method
More flexible over time, and it can be used as a method reference.
```java
public class MadPlay {
    private static final MadPlay INSTANCE = new MadPlay();
    private MadPlay() { }
    public static MadPlay getInstance() { return INSTANCE; }
}
```

Both approaches can be broken by reflection (calling the private constructor).
They can also break during deserialization unless you declare fields as `transient`
and implement `readResolve` to return `INSTANCE`.

<br>

### enum type
Concise and safe against reflection and serialization.
```java
public enum MadPlay {
    INSTANCE;
}
```

- <a href="/post/singleton-pattern" target="_blank">Reference: Singleton Pattern</a>

<div class="post_caption">Use a private constructor or an enum to enforce singleton.</div>

<br><br>

# Item 4. Enforce noninstantiability with a private constructor
> Enforce noninstantiability with a private constructor

If you do not declare a constructor, the compiler generates a default one.
To prevent instantiation, declare a `private` constructor explicitly.
It is also common to throw an error to prevent accidental internal calls.

```java
public class MadUtil {
    private MadUtil() {
        throw new AssertionError();
    }
    // ... omitted
}
```

An **abstract class** prevents direct instantiation, but subclasses can still be instantiated.
A `private` constructor prevents both instantiation and inheritance.
All constructors (explicit or implicit) call a superclass constructor, which is inaccessible.

<div class="post_caption">The best way to prevent instantiation is a private constructor.</div>

<br><br>

# Item 5. Prefer dependency injection to hardwiring resources
> Prefer dependency injection to hardwiring resources

Most classes depend on one or more resources. Hardwiring them into static utility classes is inflexible and hard to test.

```java
public class SpellChecker {
    private static final Lexicon dictionary = new KoreanDictionary();
    private SpellChecker() {} // prevent instantiation
    
    public static boolean isValid(String word) { /* omitted */ }
    public static List<String> suggestions(String type) { /* omitted */ }
}
```

Singletons have the same issue. If you need a different dictionary, the design breaks.
Instead, **inject** the dependency.

```java
public class SpellChecker {
    private final Lexicon dictionary;
    
    public SpellChecker(Lexicon dictionary) {
        this.dictionary = Objects.requireNonNull(dictionary);
    }
    // other methods omitted
}
```

This design is immutable and safe to share across clients.
You can apply it to constructors, static factories, and builders.

You can also inject a **factory** that creates the resource on demand.
In Java 8, use `Supplier<T>`.

```java
public SpellChecker(Supplier<? extends Lexicon> dicFactory) {
    this.dictionary = dicFactory.get();
}
```

<div class="post_caption">If a class depends on one or more resources, pass them in via the constructor, static factory, or builder.</div>

<br><br>

# Item 6. Avoid creating unnecessary objects
> Avoid creating unnecessary objects

Using a constructor to create a string always creates a new instance.

- <a href="/post/java-string-literal-vs-string-object" target="_blank">Reference: String literals vs String objects</a>

```java
// example 1: string literals
String myId1 = "MadPlay";
String myId2 = "MadPlay";
System.out.println(myId1 == myId2); // true

// example 2: constructor
String myId3 = new String("MadPlay");
String myId4 = new String("MadPlay");
System.out.println(myId3 == myId4); // false
```

Static factory methods can also reduce unnecessary objects.
For example, prefer `Boolean.valueOf(String)` over `Boolean(String)` (deprecated in Java 9).

Reusing expensive objects also matters. A `Pattern` created for each call becomes garbage.

```java
// AS-IS: Pattern is created per call
static boolean isTwoAndFourLengthKoreanWord(String s) {
    return s.matches("[A-Za-z]{2,4}");
}

// TO-BE: reuse a compiled Pattern
private static final Pattern KOREAN_WORD = Pattern.compile("[A-Za-z]{2,4}");
static boolean isTwoAndFourLengthKoreanWord(String s) {
    return KOREAN_WORD.matcher(s).matches();
}
```

Adapters are another example. If an adapter has no state beyond the underlying object,
one adapter per backing object is enough.
For example, `Map.keySet()` does not return a new set every time.

```java
Map<String, String> phoneBook = new HashMap<>();
phoneBook.put("KimTaeng", "010-1234-1234");
phoneBook.put("MadPlay", "010-4321-4321");
Set<String> keySet1 = phoneBook.keySet();
Set<String> keySet2 = phoneBook.keySet();

System.out.println(keySet1 == keySet2); // true
System.out.println(keySet1.size() == keySet2.size()); // true
keySet1.remove("MadPlay");
System.out.println(phoneBook.size()); // 1
```

Auto-boxing also creates unnecessary objects when you mix primitives and wrappers.

```java
// declared as Long, not long
// creates a new Long object on every addition
Long sum = 0L;
for (long i = 0; i <= Integer.MAX_VALUE; i++) {
    sum += i;
}
```

<div class="post_caption">Avoid unnecessary object creation.</div>

<br><br>

# Item 7. Eliminate obsolete object references
> Eliminate obsolete object references

Java does not require manual memory management, but you still need to watch for leaks.
This is especially true for classes that manage their own memory.

```java
public class MyStack {
    private Object[] elements;
    private int size = 0;
    
    public Object pop() {
        if(size ==0) {
            throw new EmptyStackException();
        }
        return elements[--size]; // problem
    }
    // ... omitted
}
```

`pop` decrements `size`, but the popped object remains referenced in the array.
Those references keep the object alive, even outside the **active** part of the stack.
Explicitly clear them.

```java
public Object pop() {
    if(size ==0) {
        throw new EmptyStackException();
    }
    Object result = elements[--size];
    elements[size] = null; // eliminate obsolete reference
    return result;
}
```

You do not need to null out everything. The best fix is to limit variable scope.
If you minimize scope, references naturally disappear.

**Caches** are another common leak source. If you put references in a cache and forget to remove them, they leak.
Use `WeakHashMap` or `LinkedHashMap.removeEldestEntry`.

```java
// WeakHashMap uses WeakReference for keys.
// GC logs require VM options:
// -XX:+PrintGC -XX:+PrintGCDetails (Java 9: -Xlog:gc)
WeakHashMap<Integer, String> testMap = new WeakHashMap<>();
Integer testWeakKey1 = 185;
Integer testWeakKey2 = 189;
testMap.put(testWeakKey1, "testValue1");
testMap.put(testWeakKey2, "testValue2");

System.out.println("before call gc() : " + testMap.size()); // 2
testWeakKey1 = null;
System.gc(); // not guaranteed
System.out.println("after call gc() : " + testMap.size()); // 1 if GC runs
```

`System.gc()` requests GC, but it does not guarantee execution.
If it runs, you will see output like this:

```bash
before call gc() : 2
[GC (System.gc()) [PSYoungGen: 7864K->783K(76288K)] 7864K->791K(251392K), 0.0012243 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[Full GC (System.gc()) [PSYoungGen: 783K->0K(76288K)] [ParOldGen: 8K->667K(175104K)] 791K->667K(251392K), [Metaspace: 3103K->3103K(1056768K)], 0.0058476 secs] [Times: user=0.01 sys=0.00, real=0.00 secs] 
after call gc() : 1
Heap
 PSYoungGen      total 76288K, used 1748K [0x000000076ab00000, 0x0000000770000000, 0x00000007c0000000)
  eden space 65536K, 2% used [0x000000076ab00000,0x000000076acb5040,0x000000076eb00000)
  from space 10752K, 0% used [0x000000076eb00000,0x000000076eb00000,0x000000076f580000)
  to   space 10752K, 0% used [0x000000076f580000,0x000000076f580000,0x0000000770000000)
 ParOldGen       total 175104K, used 667K [0x00000006c0000000, 0x00000006cab00000, 0x000000076ab00000)
  object space 175104K, 0% used [0x00000006c0000000,0x00000006c00a6de8,0x00000006cab00000)
 Metaspace       used 3110K, capacity 4496K, committed 4864K, reserved 1056768K
  class space    used 341K, capacity 388K, committed 512K, reserved 1048576K
```

<a href="/post/java-garbage-collection-and-java-reference" target="_blank">
Reference: Java Reference & Garbage Collection</a>

<div class="post_caption">Watch for memory leaks and learn the patterns.</div>

<br><br>

# Item 8. Avoid finalizers and cleaners
> Avoid finalizers and cleaners

Java provides two object finalizers: `finalizer` and `cleaner`.
Finalizers are unpredictable and dangerous. Cleaners are less risky but still unpredictable and slow.

Finalizers can run at unknown times on unknown threads.
Exceptions thrown inside a finalizer are ignored.
A finalizer can terminate while work remains.
Cleaners can control their own threads, which avoids some issues.

**When would you use them?**
They can act as a safety net when you forget to call `close`.
`FileOutputStream` and `ThreadPoolExecutor` use finalizers for this.

Native objects are also a reason. The GC cannot manage non-Java objects.
In those cases, a cleaner/finalizer can release resources, but only when performance cost is acceptable.

- <a href="/post/java-finalize" target="_blank">Reference: Java finalizer</a>

<div class="post_caption">It is usually better not to use them.</div>

<br><br>

# Item 9. Prefer try-with-resources to try-finally
> Prefer try-with-resources to try-finally

Java libraries include resources that must be closed via `close()`.
Before Java 7, `try-finally` was used.

```java
public void someMethod() throws IOException {
    InputStream in = new FileInputStream("filePath");
    try {
        OutputStream out = new FileOutputStream("filePath");
        try {
            // do something
        } finally {
            out.close();
        }
    } finally {
        in.close();
    }
}
```

Both the try block and finally block can throw exceptions.
If `close` throws, it can suppress the original exception.

Java 7 introduced `try-with-resources` to solve this.
It works for types that implement `AutoCloseable` and supports multiple resources.

```java
public void someMethod() throws IOException {
    try (InputStream in = new FileInputStream("filePath");
         OutputStream out = new FileOutputStream("filePath")) {
        // do something
    }
}
```

Java 9 improved the syntax so you can declare resources outside the try block.

```java
public void someMethod() throws IOException {
    InputStream in = new FileInputStream("filePath");
    OutputStream out = new FileOutputStream("filePath");
    try (in; out) {
        // do something
    }
}
```

The variables must be `final` or effectively final.

<div class="post_caption">Use try-with-resources for resources you must close.</div>
