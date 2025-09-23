---
layout:   post
title:    "Java Optional: 5. A Closer Look at Optional"
author:   Kimtaeng
tags:    java optional
description: How can you use Optional in ways that align with its intent?
category: Java
date: "2021-02-08 00:59:35"
comments: true
slug:     java-optional-advanced
lang:     en
permalink: /en/post/java-optional-advanced
---

# Table of Contents
- <a href="/post/what-is-null-in-java">Java Optional: 1. What is null?</a>
- <a href="/post/introduction-to-optional-in-java">Java Optional: 2. Introduction to Optional</a>
- <a href="/post/how-to-handle-optional-in-java">Java Optional: 3. Intermediate Optional methods</a>
- <a href="/post/how-to-return-value-from-optional-in-java">Java Optional: 4. Terminal Optional methods</a>
- Java Optional: 5. A Closer Look at Optional

<br>

# Is this right...?
So far, we covered how to create and handle `Optional` objects.
Now it is time to use them well.
Think back to `getPhoneManufacturerName` from the "classic way to prevent NPE" section.
That method had deeply nested `if` checks for `null`.

What happens if we apply what we learned without understanding Optional's intent?
You may end up writing code like below.
It is not much different from nested `if` null checks,
or can even be more confusing.

```java
public String getPhoneManufacturerName(Person person) {
	Optional<Person> personOpt = Optional.ofNullable(person);

	if (personOpt.isPresent()) {
	    Optional<Phone> phoneOpt = Optional.ofNullable(personOpt.get().getPhone());
	    if (phoneOpt.isPresent()) {
	        Optional<Manufacturer> manufacturerOpt = Optional.ofNullable(phoneOpt.get().getManufacturer());
	        if (manufacturerOpt.isPresent()) {
	            return manufacturerOpt.get().getName();
	        }
	    }
	}
	return "Samsung";
}
```

How do we use `Optional` properly?
This post introduces more effective patterns.

<br>

# Prefer orElse/orElseXXX over isPresent + get
Instead of extracting values through `isPresent` + `get`,
prefer `orElse` or `orElseGet`.

```java
public String getPhoneManufacturerName(Person person) {
    return Optional.ofNullable(person)
        .map(Person::getPhone)
        .map(Phone::getManufacturer)
        .map(Manufacturer::getName)
        .orElse("Samsung");
}
```

<br>

# Prefer orElseGet over orElse
`orElseGet` runs only when Optional is empty.
`orElse` does not; its argument is evaluated regardless of presence.
So when argument creation is expensive, prefer `orElseGet`.

For example, `Collections.emptyList`, `emptyMap`, and `emptySet` are cheap because they return static constants,
not newly allocated objects each time.
Even then, `orElseGet` is still preferable as below.

```java
// not bad because creation cost is small,
Optional.ofNullable(someObj).orElse(Collections.emptyList());
Optional.ofNullable(someObj).orElse(Collections.emptyMap());
Optional.ofNullable(someObj).orElse(Collections.emptySet());

// but this is better.
Optional.ofNullable(someObj).orElseGet(Collections::emptyList);
Optional.ofNullable(someObj).orElseGet(Collections::emptyMap);
Optional.ofNullable(someObj).orElseGet(Collections::emptySet);
```

<br>

# Optional is not serializable
`Optional` is not serializable.
If you inspect the class, it does not implement `java.io.Serializable`.
Trying to serialize it causes `NotSerializableException`.

Because Optional is designed mainly for optional return values,
if your domain class needs both Optional-style access and serialization,
you can use a pattern like this.

```java
class Person {
	private Phone phone;

	public Optional<Phone> getPhoneAsOptional() {
		return Optional.ofNullable(phone);
	}
}
```

Another option is `Optional` in Google's `guava` library.
It supports serialization by inheriting `Serializable`.
But it does not support methods such as `ifPresent`, `flatMap`,
and does not provide primitive-specialized types like `OptionalInt`, `OptionalLong`.

- <a href="https://guava.dev/releases/snapshot-jre/api/docs/com/google/common/base/Optional.html" target="_blank" rel="nofollow">Reference: "guava library: Optional"</a>

<br>

# Do not assign null to Optional
If you temporarily forget the purpose of Optional,
you might assign `null` to represent empty Optional.
If initialization is needed, use `empty`, which uses an internal singleton.

```java
// bad
public Optional<Person> findByName(String name) {
	// ... omitted
    
	if (result == 0) {
		return null;
    }
}

// good
public Optional<Person> findByName(String name) {
    // ... omitted
    if (result == 0) {
    	return Optional.empty();
    }
} 
```



<br>

# Before using primitive Optional types,
Like `Stream` has `IntStream`, `LongStream`, etc.,
`Optional` has primitive-specialized types such as `OptionalInt`, `OptionalLong`.

```java
// these Optional objects
Optional<Integer> intOpt = Optional.of(5);
Optional<Long> longOpt = Optional.of(5L);
Optional<Double> doubleOpt = Optional.of(5.0);

// can be replaced with these.
	
OptionalInt intOpt = OptionalInt.of(5);
OptionalLong longOpt = OptionalLong.of(5L);
OptionalDouble doubleOpt = OptionalDouble.of(5.0);
```

These classes are usually intended to reduce boxing/unboxing overhead.
However, unlike primitive-specialized streams, primitive Optional types do not provide major performance gains
because Optional holds only one element.

Also, you cannot use methods like `map` and `filter` available in `Optional<T>`.
Java 9 added `stream` which can help, but keep in mind primitive Optional types are not drop-in replacements everywhere.

<br>

# When using Optional with collections,
When returning empty collections/arrays, return empty collections directly.
Wrapping them in Optional adds handling overhead for callers.
For collection-returning methods, avoid returning Optional or null when empty collection is sufficient.

- <a href="/post/effectivejava-chapter8-methods#아이템-54-null이-아닌-빈-컬렉션이나-배열을-반환하라">Reference: "Effective Java Item 54. Return empty collections or arrays, not null"</a>

Also, avoid using `Optional` as collection elements.

```java
// no need for Optional here.
Map<String, Optional<String>> map = new HashMap<>();
map.put("testKey", Optional.of("testValue"));
map.put("testKey2", Optional.ofNullable(null));

String value = map.get("testKey2").orElse("testValue2");

// use collection methods instead
Map<String, String> map = new HashMap<>();
map.put("tesKey", "testValue");
map.put("testKey2", null);

String value = map.getOrDefault("testKey2", "testValue2");
```

<br>

# Compare internal values between Optionals
`Optional.equals` is implemented as below.
So if `a.equals(b)` is `true`, then `Optional.of(a).equals(Optional.of(b))` is also `true`.

Because it compares contained values, you do not need to extract values manually just to compare Optionals.

```java
@Override
public boolean equals(Object obj) {
  if (this == obj) {
      return true;
  }

  if (!(obj instanceof Optional)) {
      return false;
  }

  Optional<?> other = (Optional<?>) obj;
  return Objects.equals(value, other.value);
}
```

<br>

# Closing
Starting from what `null` is in Java,
this series introduced `Optional`, covered how to create/handle Optional,
and finally discussed better usage patterns aligned with its intent.

Methods and class structure are relatively simple, so basic usage is not hard.
But using Optional as intended by Java architects, with full context of why it was introduced,
is harder than it looks.
There are many easy-to-miss details, so practice is important.
