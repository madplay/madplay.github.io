---
layout:   post
title:    "Java Streams: 3. Terminal Operations"
author:   madplay
tags: 	  java stream
description: What terminal operations exist in Java streams, and how do you use them?
category: Java/Kotlin
comments: true
slug:     java-streams-terminal-operations
lang:     en
permalink: /en/post/java-streams-terminal-operations
---

# Table of Contents
- <a href="/post/introduction-to-java-streams">Java Streams: 1. API Overview and Stream Creation</a>
- <a href="/post/java-streams-intermediate-operations">Java Streams: 2. Intermediate Operations</a>
- Java Streams: 3. Terminal Operations
- <a href="/post/java-streams-examples">Java Streams: 4. Examples</a>
- <a href="/post/mistakes-when-using-java-streams">Java Streams: 5. Common Mistakes</a>

<br/>

# Terminal Operations
Terminal operations produce a final result from a pipeline.
Let’s walk through the common ones.

<br/>

# Iteration
Use `forEach` to iterate a stream.

```java
List<Integer> list = List.of(3, 2, 1, 5, 7);
list.stream().forEach(System.out::println);
```

`forEach` does not guarantee order on parallel streams.
Use `forEachOrdered` when you need ordering.

```java
List<Integer> list = List.of(3, 1, 2);

// output order may vary
list.parallelStream().forEach(System.out::println);

// output order is consistent
list.parallelStream().forEachOrdered(System.out::println);
```

<br/>

# Reduce
`reduce` processes all elements into a single result.
It has three overloads.

```java
// form 1
Optional<T> reduce(BinaryOperator<T> accumulator); 

// form 2
T reduce(T identity, BinaryOperator<T> accumulator);

// form 3
<U> U reduce(U identity, BiFunction<U, ? super T, U> accumulator,
            BinaryOperator<U> combiner);
```

The one-argument form takes a `BinaryOperator` and returns an `Optional`.

```java
List<Integer> list = List.of(1, 2, 3);
Optional<Integer> result = list.stream().reduce((a, b) -> a + b); // 6
// list.stream().reduce(Integer::sum);
```

The two-argument form accepts an identity value.

```java
List<Integer> list = List.of(1, 2, 3);
Integer result = list.stream().reduce(1, Integer::sum);

// 7
System.out.println(result);
```

The three-argument form uses an identity, an accumulator, and a combiner.
The combiner merges partial results from parallel execution.

```java
List<Integer> list = List.of(3, 7, 9);
Integer result = list.parallelStream()
        .reduce(1, Integer::sum, (a, b) -> {
            System.out.println("in combiner");
            return a + b;
        });

System.out.println(result);
// output
// in combiner a:8 b:10
// in combiner a:4 b:18
// 22
```

In a sequential stream, the combiner does not run.
The result is computed as: (1+3=4, 1+9=10, 1+7=8) then combined (8+10=18, 4+18=22).

<br/>

# Min, Max, Sum, Average
You can compute min/max directly.

```java
// returns Optional
OptionalDouble min = DoubleStream.of(4.1, 3.4, -1.3, 3.9, -5.7).min();
min.ifPresent(System.out::println);

// 5
int max = IntStream.of(2, 4, 5, 3).max().getAsInt();
```

Count elements:

```java
// result 4
long count = IntStream.of(2, 4, 1, 3).count()
```

Sum or average:

```java
// result 7.1
double sum = DoubleStream.of(3.1, 2.6, 1.4).sum();

// returns Optional
OptionalDouble average = IntStream.of(3, 2, 1).average();

// result 2.0
average.ifPresent(System.out::println);
```

<br/>

# Collect
Collect converts stream results into collections or maps.
Assume this class:

```java
class Food {
    public Food(String name, int cal) {
        this.name = name;
        this.cal = cal;
    }

    private String name;
    private int cal;
    
    @Override
    public String toString() {
        return String.format("name: %s, cal: %s", name, cal);
    }

    // getters and setters omitted
}

List<Food> list = new ArrayList<>();
list.add(new Food("burger", 520));
list.add(new Food("chips", 230));
list.add(new Food("coke", 143));
list.add(new Food("soda", 143));
```

<br/>

- **Collectors.toList: collect into a list**

```java
List<String> nameList = list.stream()
        .map(Food::getName) // extract name
        .collect(Collectors.toList());
```

<br/>

- **Sum, average, and statistics**

```java
// sum of name lengths
Integer summingName = list.stream()
        .collect(Collectors.summingInt(s -> s.getName().length()));
    
// sum of calories
int sum = list.stream().mapToInt(Food::getCal).sum();

// average: averagingInt
Double averageInt = list.stream()
        .collect(Collectors.averagingInt(Food::getCal));

// average: averagingDouble
Double averageDouble = list.stream()
        .collect(Collectors.averagingDouble(Food::getCal));
```

Use `summarizingInt` to get all stats at once.

```java
IntSummaryStatistics summaryStatistics = list.stream()
        .collect(Collectors.summarizingInt(Food::getCal));

summaryStatistics.getAverage(); // average
summaryStatistics.getCount(); // count
summaryStatistics.getMax(); // max
summaryStatistics.getMin(); // min
summaryStatistics.getSum(); // sum
```

<br/>

- **Join into a single string**

```java
// without arguments
String defaultJoining = list.stream()
        .map(Food::getName).collect(Collectors.joining());

// burgerchipscokesoda
System.out.println(defaultJoining);
```

With a delimiter:

```java
String delimiterJoining = list.stream()
        .map(Food::getName).collect(Collectors.joining(","));

// burger,chips,coke,soda
System.out.println(delimiterJoining);
```

With delimiter, prefix, and suffix:

```java
String combineJoining = list.stream()
        .map(Food::getName).collect(Collectors.joining(",", "[", "]"));

// [burger,chips,coke,soda]
System.out.println(combineJoining);
```

<br/>

- **Group by a key**

```java
// group by calories
Map<Integer, List<Food>> calMap = list.stream()
        .collect(Collectors.groupingBy(Food::getCal));

// { 230=[name: chips, cal: 230],
//   520=[name: burger, cal: 520],
//   143=[name: coke, cal: 143, name: soda, cal: 143]}
System.out.println(calMap);
```

<br/>

- **Partition into true/false**

`partitioningBy` takes a `Predicate` and splits into two groups.

```java
// group by calories > 200
Map<Boolean, List<Food>> partitionMap = list.stream()
        .collect(Collectors.partitioningBy(o -> o.getCal() > 200));

// { false=[name: coke, cal: 143, name: soda, cal: 143],
//   true=[name: burger, cal: 520, name: chips, cal: 230]}
System.out.println(partitionMap);
```

<br/>

- **Collect into a Map**

Map calories to names:

```java
// throws Exception!
Map<Integer, String> map = list.stream()
        .collect(Collectors.toMap(
                o -> o.getCal(),
                o -> o.getName()
        ));
System.out.println(map);
```

If a key is duplicated, `toMap` throws `IllegalStateException`.
Add a merge function to resolve conflicts.

```java
// for duplicate keys, keep the new value
Map<Integer, String> map = list.stream()
        .collect(Collectors.toMap(
                o -> o.getCal(),
                o -> o.getName(),
                (oldValue, newValue) -> newValue));

// {230=chips, 520=burger, 143=soda}
System.out.println(map);
```

<br/>

- **Post-process after collect**

`collectingAndThen` runs an extra operation after collection.

```java
// return the max-calorie item
Food food = list.stream()
        .collect(Collectors.collectingAndThen(
                Collectors.maxBy(Comparator.comparing(Food::getCal)),
                (Optional<Food> o) -> o.orElse(null)));

// name: burger, cal: 520
System.out.println(food);
```

<br/>

- **Build a custom Collector**

```java
// build a custom collector
Collector<Food, StringJoiner, String> foodNameCollector = Collector.of(
        () -> new StringJoiner(" | "), // supplier
        (a, b) -> a.add(b.getName()), // accumulator
        (a, b) -> a.merge(b), // combiner
        StringJoiner::toString); // finisher
        
// apply the collector
String foodNames = list.stream().collect(foodNameCollector);

// burger | chips | coke | soda
System.out.println(foodNames);
```

<br/>

# Matching
You can check whether elements satisfy a predicate.

- **Any match? (anyMatch)**

```java
// any item over 300 calories?
boolean anyMatch = list.stream()
        .anyMatch(food -> food.getCal() > 300);
```

- **All match? (allMatch)**

```java
// all over 100 calories?
boolean allMatch = list.stream()
        .allMatch(food -> food.getCal() > 100);
```

- **None match? (noneMatch)**

```java
// none over 1000 calories?
boolean noneMatch = list.stream()
        .noneMatch(food -> food.getCal() < 1000);
```

<br/>

# Next
We covered how to compute results from stream pipelines.
The next post provides more practical stream examples.
 
- <a href="/post/java-streams-examples">Java Streams: 4. Examples</a>
