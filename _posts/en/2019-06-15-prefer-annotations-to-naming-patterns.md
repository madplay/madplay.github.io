---
layout:   post
title:    "[Effective Java 3rd Edition] Item 39. Prefer Annotations to Naming Patterns"
author:   Kimtaeng
tags: 	  java effectivajava
description: "[Effective Java 3rd Edition] Item 39. Prefer annotations to naming patterns"
category: Java
date: "2019-06-15 01:12:25"
comments: true
slug:     prefer-annotations-to-naming-patterns
lang:     en
permalink: /en/post/prefer-annotations-to-naming-patterns
---

# Drawbacks of naming patterns
Traditionally, tools and frameworks apply strict naming patterns to elements that need special handling. For example, JUnit requires test methods to start with `test` until version 3. That approach introduces several problems.

A typo can silently change behavior. If you write `tsetSomething` by mistake, the method is ignored. The test run looks green even though the test never executed. Another issue is that naming patterns attach to methods, not classes. If you name a class `TestSafetyMechanisms` and feed it to JUnit, JUnit still ignores it because it only scans method names. Finally, when a test should pass only if it throws a specific exception, naming patterns provide no way to pass that parameter.

Annotations address these issues, and JUnit adopts them starting in version 4.

<br/><br/>

# Marker annotations
Define a simple marker annotation. A marker annotation has no parameters and simply marks a target.

```java
// Annotation that marks a test method.
// For parameterless static methods only.
@Retention(RetentionPolicy.RUNTIME) // @MadTest remains at runtime
@Target(ElementType.METHOD) // @MadTest applies only to method declarations
public @interface MadTest {
}
```

**Annotations placed on annotation declarations are meta-annotations.** The example uses `@Retention` and `@Target`. The common meta-annotations are:

## Types of meta-annotations

- `@Documented`: includes the annotation in generated docs.
- `@Inherited`: allows subclasses to inherit the annotation.
- `@Repeatable`: allows repeated use of the annotation.
- `@Retention(RetentionPolicy)`: defines the retention policy.
  - RetentionPolicy.RUNTIME: JVM can access it after compilation.
  - RetentionPolicy.CLASS: retained until the class is loaded.
  - RetentionPolicy.SOURCE: discarded after compilation.
- `@Target(ElementType[])`: defines where the annotation applies.
  - ElementType.PACKAGE: package declarations
  - ElementType.TYPE: type declarations
  - ElementType.CONSTRUCTOR: constructor declarations
  - ElementType.FIELD: field declarations
  - ElementType.METHOD: method declarations
  - ElementType.ANNOTATION_TYPE: annotation type declarations
  - ElementType.LOCAL_VARIABLE: local variables
  - ElementType.PARAMETER: parameters
  - ElementType.TYPE_PARAMETER: type parameters
  - ElementType.TYPE_USE: any use of a type

If you put `@MadTest` on a class, the compiler raises an error. The comment “for parameterless static methods only” is not something the compiler enforces. To enforce that rule, use an annotation processor via the `javax.annotation.processing` API.

<br/><br/>

# Implementing annotation processing
Now write a sample that uses the marker annotation and a processor that reads it.

```java
class Sample {
    @MadTest
    public static void m1() {
        // Succeeds.
    }

    public static void m2() {
        // Ignored.
    }

    @MadTest
    public void m3() {
        // Misused. Not a static method.
    }

    @MadTest
    public static void m4() {
        throw new RuntimeException("failed");
    }
}

class MadPlay {
    public static void main(String[] args) throws Exception {
        int testCount = 0;
        int passedCount = 0;

        Class<?> testClass = Class.forName("Sample");
        for (Method method : testClass.getDeclaredMethods()) {
            if (method.isAnnotationPresent(MadTest.class)) {
                testCount++;
                try {
                    method.invoke(null);
                    passedCount++;
                } catch (InvocationTargetException itException) {
                    Throwable ex = itException.getCause();
                    System.out.println(method + " failed: " + ex);
                } catch (Exception e) {
                    System.out.println("Misused @MadTest: " + method);
                }
            }
        }
        System.out.printf("Passed: %d, Failed: %d%n", passedCount, testCount - passedCount);
    }
}

// Output
// public static void Sample.m4() failed: java.lang.RuntimeException: failed
// Misused @MadTest: public void Sample.m3()
// Passed: 1, Failed: 2
```

The `@MadTest` annotation does not directly change `Sample`. It exists so other logic can detect and process it. If a method throws an exception other than `InvocationTargetException`, that indicates the annotation is misused. The method is likely not static or not a method at all.

<br/><br/>

# Annotations with parameters
You can add parameters to require a specific exception for a test to pass. Define a new annotation:

```java
// Annotation for test methods that must throw the specified exception
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface MadExceptionTest {
    Class<? extends Throwable> value();
}
```

Update the test logic to use the new annotation and provide the expected exception. The processing logic also changes.

```java
// Annotation test sample
class Sample {
    @MadExceptionTest(ArithmeticException.class)
    public static void m1() {
        int i = 0;
        i = i / i;
        // Should succeed.
    }

    @MadExceptionTest(ArithmeticException.class)
    public static void m2() {
        int[] a = new int[0];
        a[1] = 2;
        // Should fail with a different exception.
    }

    @MadExceptionTest(ArithmeticException.class)
    public static void m3() {
        // Should fail because no exception is thrown.
    }
}

public class MadPlay {
    public static void main(String[] args) throws Exception {
        int testCount = 0;
        int passedCount = 0;

        Class<?> testClass = Class.forName("Sample");
        for (Method method : testClass.getDeclaredMethods()) {
            if (method.isAnnotationPresent(MadExceptionTest.class)) {
                testCount++;
                try {
                    method.invoke(null);
                    System.out.printf("Test %s failed: no exception thrown%n", method);
                } catch (InvocationTargetException itException) {
                    Throwable ex = itException.getCause();
                    Class<? extends Throwable> type = method.getAnnotation(MadExceptionTest.class).value();
                    if (type.isInstance(ex)) {
                        passedCount++;
                    } else {
                        System.out.printf("Test %s failed: expected %s, got %s%n",
                                method, type.getName(), ex);
                    }
                } catch (Exception e) {
                    System.out.println("Misused @MadExceptionTest: " + method);
                }
            }
        }
        System.out.printf("Passed: %d, Failed: %d%n", passedCount, testCount - passedCount);
    }
}

// Output
// Test public static void Sample.m2() failed: expected java.lang.ArithmeticException,
// got java.lang.ArrayIndexOutOfBoundsException: Index 1 out of bounds for length 0
// Test public static void Sample.m3() failed: no exception thrown
// Passed: 1, Failed: 2
```

Compared to `@MadTest`, this annotation provides a parameter and the processing code uses it to verify the exception.

<br/><br/>

# An annotation with an array parameter
You can change the parameter to an array. This adds flexibility without changing how the annotation is applied in code.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface MadExceptionTest {
    // Switched to an array.
    Class<? extends Throwable>[] value();
}
```

Update the sample and processing logic. List exceptions with commas.

```java
class Sample {
    @MadExceptionTest({IndexOutOfBoundsException.class, NullPointerException.class})
    public static void doublyBad() {
        List<String> list = new ArrayList<>();
        list.addAll(1, null);
    }
}

class MadPlay {
    public static void main(String[] args) throws Exception {
        int testCount = 0;
        int passedCount = 0;

        Class<?> testClass = Class.forName("Sample");
        for (Method method : testClass.getDeclaredMethods()) {
            if (method.isAnnotationPresent(MadExceptionTest.class)) {
                testCount++;
                try {
                    method.invoke(null);
                    System.out.printf("Test %s failed: no exception thrown%n", method);
                } catch (InvocationTargetException itException) {
                    Throwable ex = itException.getCause();
                    int oldPassedCount = passedCount;
                    Class<? extends Throwable>[] types = method.getAnnotation(MadExceptionTest.class).value();

                    for (Class<? extends Throwable> type : types) {
                        if (type.isInstance(ex)) {
                            passedCount++;
                            break;
                        }
                    }
                    if (passedCount == oldPassedCount) {
                        System.out.printf("Test %s failed: %s %n", method, ex);
                    }
                } catch (Exception e) {
                    System.out.println("Misused @MadExceptionTest: " + method);
                }
            }
        }
        System.out.printf("Passed: %d, Failed: %d%n", passedCount, testCount - passedCount);
    }
}

// Output
// Passed: 1, Failed: 0
```

<br/><br/>

# Repeatable annotations
**Since Java 8,** you can use `@Repeatable` instead of an array parameter. You must define a container annotation and pass its `Class` object to `@Repeatable`.

The container annotation must return an array of the repeated annotation type, and it needs proper `@Retention` and `@Target` values, or it fails to compile.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@Repeatable(MadExceptionContainer.class)
public @interface MadExceptionTest {
    Class<? extends Throwable> value();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
public @interface MadExceptionContainer {
    MadExceptionTest[] value();
}
```

Now write the test and processing logic. The container annotation applies when you use multiple annotations. `getAnnotationsByType` does not distinguish between the two, but `isAnnotationPresent` does.

Check both to cover all cases.

```java
@MadExceptionTest(NullPointerException.class)
@MadExceptionTest(IndexOutOfBoundsException.class)
public static void doublyBad() { ... }

public class MadPlay {
    public static void main(String[] args) throws Exception {
        int testCount = 0;
        int passedCount = 0;

        Class<?> testClass = Class.forName("Sample");
        for (Method method : testClass.getDeclaredMethods()) {

            // Check both forms.
            if (method.isAnnotationPresent(MadExceptionTest.class)
                    || method.isAnnotationPresent(MadExceptionContainer.class)) {
                testCount++;
                try {
                    method.invoke(null);
                    System.out.printf("Test %s failed: no exception thrown%n", method);
                } catch (InvocationTargetException itException) {
                    Throwable ex = itException.getCause();
                    int oldPassedCount = passedCount;

                    MadExceptionTest[] tests = method.getAnnotationsByType(MadExceptionTest.class);
                    for (MadExceptionTest test : tests) {
                        if (test.value().isInstance(ex)) {
                            passedCount++;
                            break;
                        }
                    }

                    if (passedCount == oldPassedCount) {
                        System.out.printf("Test %s failed: %s %n", method, ex);
                    }
                } catch (Exception e) {
                    System.out.println("Misused @MadTest: " + method);
                }
            }
        }
        System.out.printf("Passed: %d, Failed: %d%n", passedCount, testCount - passedCount);
    }
}

// Output
// Passed: 1, Failed: 0
```

In short, annotations require more logic to define and process, but they remain the preferred approach over naming patterns. You rarely implement annotation processors directly in production code, but using the standard Java annotations without exception is a sound default. If you build tooling that reads extra metadata from code, define and provide a well-designed annotation type.
