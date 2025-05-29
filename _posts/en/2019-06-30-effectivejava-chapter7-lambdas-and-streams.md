---
layout:   post
title:    "[Effective Java 3rd Edition] Chapter 7. Lambdas and Streams"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Chapter7: Lambdas and Streams"
category: Java
date: "2019-06-30 23:37:39"
comments: true
slug:     effectivejava-chapter7-lambdas-and-streams
lang:     en
permalink: /en/post/effectivejava-chapter7-lambdas-and-streams
---

# Table of contents
- <a href="#아이템-42-익명-클래스보다는-람다를-사용하라">Item 42. Prefer lambdas to anonymous classes</a>
- <a href="#아이템-43-람다보다는-메서드-참조를-사용하라">Item 43. Prefer method references to lambdas</a>
- <a href="#아이템-44-표준-함수형-인터페이스를-사용하라">Item 44. Favor the use of standard functional interfaces</a>
- <a href="#아이템-45-스트림은-주의해서-사용하라">Item 45. Use streams judiciously</a>
- <a href="#아이템-46-스트림에서는-부작용-없는-함수를-사용하라">Item 46. Prefer side-effect-free functions in streams</a>
- <a href="#아이템-47-반환-타입으로는-스트림보다-컬렉션이-낫다">Item 47. Prefer Collection to Stream as a return type</a>
- <a href="#아이템-48-스트림-병렬화는-주의해서-적용하라">Item 48. Use caution when making streams parallel</a>

<br>

<a id="아이템-42-익명-클래스보다는-람다를-사용하라"></a>
# Item 42. Prefer lambdas to anonymous classes
> Prefer lambdas to anonymous classes

Historically, Java modeled function types using interfaces or abstract classes with a single abstract method. These interfaces act as function objects and represent a specific behavior.

- <a href="/post/prefer-lambdas-to-anonymous-classes" target="_blank">
For details, see: [Effective Java 3rd Edition] Item 42. Prefer lambdas to anonymous classes</a>

<div class="post_caption">Use anonymous classes only when you need an instance of a type that is not a functional interface.</div>

<br><br>

<a id="아이템-43-람다보다는-메서드-참조를-사용하라"></a>
# Item 43. Prefer method references to lambdas
> Prefer method references to lambdas

Method references can make a function object more concise than a lambda.

```java
// Lambda
map.merge(key, 1, (count, incr) -> count + incr);

// Method reference
map.merge(key, 1, Integer::sum);
```

A method reference is not always the best choice. A lambda is often clearer.

```java
class GoshThisClassNameIsHumongous {
    // action method definition omitted

    public void withMethodReference() {
        // Method reference
        servie.execute(GoshThisClassNameIsHumongous::action);
    }

    public void withLambda() {
        // Lambda
        service.execute(() -> action());
    }
}
```

If a class name is long or unclear, the method reference can obscure the intent. For example, `(x -> x)` can be clearer and shorter than `Function.identity()`.

Method reference type | Example | Equivalent lambda
|:--|:--|:--
Static | ```Integer::parseInt``` | ```str -> Integer.parseInt(str)```
Bound (instance) | ```Instant.now()::isAfter``` | ```Instant then = Instant.now();``` <br/> ```t -> then.isAfter(t)```
Unbound (instance) | ```String::toLowerCase``` | ```str -> str.toLowerCase()```
Class constructor | ```TreeMap<K,V>::new``` | ```() -> new TreeMap<K,V>()```
Array constructor | ```Int[]::new``` | ```len -> new int[len]```

<div class="post_caption">Method references provide a concise alternative to lambdas.</div>

<br><br>

<a id="아이템-44-표준-함수형-인터페이스를-사용하라"></a>
# Item 44. Favor the use of standard functional interfaces
> Favor the use of standard functional interfaces

You can implement functional interfaces yourself, but most cases are covered by the standard interfaces in `java.util.function`.

- <a href="/post/favor-the-use-of-standard-functional-interfaces" target="_blank">
For details, see: [Effective Java 3rd Edition] Item 44. Favor the use of standard functional interfaces</a>

<div class="post_caption">Standard functional interfaces are usually the best choice.</div>

<br><br>

<a id="아이템-45-스트림은-주의해서-사용하라"></a>
# Item 45. Use streams judiciously
> Use streams judiciously

A stream is a finite or infinite sequence of elements. You can build it from a collection, array, or file.

- <a href="/post/introduction-to-java-streams" target="_blank">Java Streams: 1. API overview and stream sources</a>

## Stream pipelines
A stream pipeline expresses the stages that run on stream elements. It starts with a source, ends with a terminal operation, and can include one or more intermediate operations.

Stream pipelines use lazy evaluation. They execute only when a terminal operation runs, and they skip elements that are not required for the terminal operation. That property enables infinite streams, but it also means you must not forget the terminal operation.

## Readability
Overusing streams reduces readability.

- <a href="/post/mistakes-when-using-java-streams" target="_blank">Java Streams: 5. Common pitfalls</a>

```java
public class Anagrams {
    public static void main(String[] args) throws IOException {
        Path dictionary = Paths.get(args[0]);
        int minGroupSize = Integer.parseInt(args[1]);

        try (Stream<String> words = Files.lines(dictionary)) {
            words.collect(groupingBy(word -> word.chars().sorted()
                    .collect(StringBuilder::new,
                        (sb, c) -> sb.append((char) c),
                        StringBuilder::append).toString()))
                .values().stream()
                .filter(group -> group.size() >= minGroupSize)
                .map(group -> group.size() + ": " + group)
                .forEach(System.out::println);
        }
    }
}
```

Instead of converting every loop, split logic when it improves clarity. A helper method often makes the stream pipeline readable. Lambdas frequently omit type names, so name parameters carefully.

```java
public class Anagrams {
    public static void main(String[] args) {
        Path dictionary = Paths.get(args[0]);
        int minGroupSize = Integer.parseInt(args[1]);

        try (Stream<String> words = Files.lines(dictionary)) {
            words.collect(groupingBy(word -> alphabetize(word)))
                .values().stream()
                .filter(group -> group.size() >= minGroupSize)
                .forEach(g -> System.out.println(g.size() + ": " + g));
        }
    }

    private static String alphabetize(String s) {
        char[] a = s.toCharArray();
        Arrays.sort(a);
        return new String(a);
    }
}
```

## Code blocks vs. lambda blocks
Code blocks can read and modify local variables. **Lambdas can read only `final` or effectively `final` variables.** Lambdas cannot modify local variables. In code blocks, you can exit a method with `return` or control a loop with `break` and `continue`. Lambdas do not allow those control statements.

## When streams work well
A stream pipeline maps each element to a new value and does not preserve the original value. That makes it hard to access multiple stages of the same element. Streams work well in these cases:

- Transforming a sequence of elements consistently
- Filtering a sequence of elements
- Combining elements with a single operation (sum, min, etc.)
- Collecting elements into a collection
- Finding elements that satisfy a condition

<div class="post_caption">If you cannot decide between streams and loops, try both and keep the clearer one.</div>

<br><br>

<a id="아이템-46-스트림에서는-부작용-없는-함수를-사용하라"></a>
# Item 46. Prefer side-effect-free functions in streams
> Prefer side-effect-free functions in streams

The core of the stream paradigm is restructuring computation as a sequence of transformations. Each stage accepts the prior stage’s result and produces a new result. A pure function depends only on its input.

You sometimes see stream code like this:

```java
// tokens is supported since Java 9.
try (Stream<String> words = new Scanner(file).tokens()) {
    words.forEach(word -> {
        freq.merge(word.toLowerCase(), 1L, Long::sum);;
    })
}
```

All work happens inside `forEach`, and the lambda mutates external state. That style defeats the purpose of streams. Use `forEach` only to report results.

```java
try (Stream<String> words = new Scanner(file).tokens()) {
    freq = words.collect(groupingBy(String::toLowerCase, counting()));
}
```

> The book’s `Collectors` example is replaced with the link below.

- <a href="/post/java-streams-terminal-operations" target="_blank">Java Streams: 3. Terminal operations</a>

<div class="post_caption">Streams and the function objects they receive must be free of side effects.</div>

<br><br>

<a id="아이템-47-반환-타입으로는-스트림보다-컬렉션이-낫다"></a>
# Item 47. Prefer Collection to Stream as a return type
> Prefer Collection to Stream as a return type

For element sequences, we use `Collection`, `Iterable`, and arrays. Java 8 adds streams, but streams do not support iteration. You can combine streams and iteration, but you need extra work. `Stream` contains all abstract methods of `Iterable` and behaves like it, but it does not extend `Iterable`, so you cannot use it in a `for-each` loop.

```
// You can wrap a stream for iteration like this.
public static <E> Iterable<E> iterableOf(Stream<E> stream) {
    return stream::iterator;
}

for (ProcessHandle p : iterableOf(ProcessHandle.allProcesses())) {
    // do something
}
```

A collection is a better return type for these reasons:

- It works, but it feels complex and unintuitive.
- `Collection` is an `Iterable` subtype and also supports stream methods.
- Public APIs usually work best with `Collection` or its subtypes.
- Arrays support both iteration and streams via `Arrays.asList` and `Stream.of`.

<div class="post_caption">Returning a collection beats returning a stream.</div>

<br><br>

<a id="아이템-48-스트림-병렬화는-주의해서-적용하라"></a>
# Item 48. Use caution when making streams parallel
> Use caution when making streams parallel

If the stream source is `Stream.iterate` or you use `limit` as an intermediate operation, parallelization rarely improves performance.

```java
public static void main(String[] args) {
    // java.math.BigInteger.TWO is public since Java 9.
    primes().map(p -> TWO.pow(p.intValueExact()).subtract(ONE))
        .filter(mersenne -> mersenne.isProbablePrime(50))
        .limit(20)
        .forEach(System.out::println);
}

static Stream<BigInteger> primes() {
    return Stream.iterate(TWO, BigInteger::nextProbablePrime);
}
```

If you call `parallel()` on this pipeline, it can stop responding. The stream library cannot find an efficient parallelization strategy.

## When parallelism helps
Parallelism often helps when the stream source is an `ArrayList`, `HashMap`, `HashSet`, `ConcurrentHashMap`, an array, or primitive streams (`int`, `long`). These sources split precisely and efficiently across threads.

They also offer strong **locality of reference**. Adjacent elements sit close in memory, so threads wait less for data to move from main memory to cache.

Among terminal operations, reductions like `min` or `max` work well. Short-circuiting methods like `anyMatch`, `allMatch`, and `noneMatch` also work well. In contrast, mutable reductions like `collect` perform poorly in parallel because merge costs are high.

Even with parallelization, performance gains are not guaranteed. Validate with tests and benchmarks.

<div class="post_caption">Bad parallelism breaks correctness or slows performance.</div>
