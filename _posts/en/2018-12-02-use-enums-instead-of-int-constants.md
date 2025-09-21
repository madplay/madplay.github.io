---
layout:   post
title:    "[Effective Java 3rd Edition] Item 34. Use Enums Instead of Int Constants"
author:   madplay
tags: 	  java effectivejava
description: "[Effective Java 3rd Edition] Item 34. Use enums instead of int constants"
category: Java
comments: true
slug:     use-enums-instead-of-int-constants
lang:     en
permalink: /en/post/use-enums-instead-of-int-constants
---

# Declaring Constants in Java
Java introduced enum types in `Java 1.5`. Before that, constants often looked like this:

```java
public static final int APPLE_FUJI = 0; // Fuji
public static final int APPLE_PIPPIN = 1; // Pippin
public static final int APPLE_GRANNY_SMITH = 2; // Granny Smith

public static final int ORANGE_NAVEL = 0; // Navel
public static final int ORANGE_TEMPLE = 1; // Temple
public static final int ORANGE_BLOOD = 2; // Blood
```

This approach is called the int enum pattern, and the downsides are obvious.
First, **type safety is weak.** If a method expects an orange but receives an apple, the code still compiles and runs.
A simple equality check (`==`) offers no warnings.

Second, the **naming is awkward.** You have to use prefixes to avoid collisions between apples and oranges.
Finally, converting these values to readable strings is clumsy.

So what do enums give you instead?

<br/>

# Enums Arrive
With enums, the same constants become concise and safe.

```java
public enum Apple {
    FUJI, PIPPIN, GRANNY_SMITH
}
public enum Orange {
    NAVEL, TEMPLE, BLOOD
}
```

Enums provide several advantages:

- Java enums are full classes.
- Enums expose no public constructors, so they are effectively final.
- Each instance exists exactly once.
- Enums provide compile-time type safety.
  - If a method accepts an `Apple`, the argument must be one of the three `Apple` values.
  Passing any other type causes a compilation error.
- `toString` returns a readable name by default.
- Enums can define methods, fields, and implement interfaces.

<br/>

# Example: A Planet Enum
- Creating an enum for the eight planets is straightforward.

```java
enum Planet {
    MERCURY(3.302e+23, 2.439e6),
    VENUS(4.869e+24, 6.052e6),
    EARTH(5.975e+24, 6.378e6);
    // ...

    private final double mass; // mass
    private final double radius; // radius
    private final double surfaceGravity; // surface gravity

    private static final double G = 6.67300E-11;

    // constructor
    Planet(double mass, double radius) {
        this.mass = mass;
        this.radius = radius;
        surfaceGravity = G * mass / (radius * radius);
    }

    public double mass() { return mass; }
    public double radius() { return radius; }
    public double surfaceGravity() { return surfaceGravity; }

    public double surfaceWeight(double mass) {
        return mass * surfaceGravity; // F = ma
    }
}
```

To associate data with each enum constant, pass the data into the constructor and store it in instance fields.
Enums are inherently immutable, so all fields must be `final`.
Enums also provide `values()`, which returns an array of all constants.

```java
public class EffectiveJava34 {
    public static void main(String []args) {
        double earthWeight = Double.parseDouble("150");
        double mass = earthWeight / Planet.EARTH.surfaceGravity();

        // iterate all enum elements
        for(Planet p : Planet.values()) {
            System.out.printf("%s weight is %f%n", p, p.surfaceWeight(mass));
        }
     }
}
```

<br/>

# When Constants Need Behavior
Consider an enum for calculator operations where each constant performs the operation.

```java
enum Operation {
    PLUS, MINUS, TIMES, DIVIDE;
    
    public double apply(double x, double y) {
        switch(this) {
            case PLUS: return x + y;
            case MINUS: return x - y;
            case TIMES: return x * y;
            case DIVIDE: return x / y;
        }
        throw new AssertionError("Unknown operation: " + this);
    }
}
```

This works, but it is not ideal.
The final `throw` is technically reachable.
The code is also fragile because you must update the `switch` whenever you add a new constant.

So what is a better approach?

<br/>

# Constant-Specific Method Implementations
A constant-specific method implementation overrides behavior per constant.

```java
enum Operation {
    PLUS {
        public double apply(double x, double y) {
            return x + y;
        }
    },
    MINUS {
        public double apply(double x, double y) {
            return x - y;
        }
    }
    // ...
    public abstract double apply(double x, double y);
}
```

With `apply` declared right next to the constants, it is hard to forget to override it.
Because `apply` is abstract, the compiler rejects any constant that does not implement it.

You can also combine this with constant-specific data. For example, override `toString` to return the symbol.

```java
public class EffectiveJava34 {
    public static void main(String []args){
        double x = Double.parseDouble("2");
        double y = Double.parseDouble("3");
        for (Operation op : Operation.values()) {
            System.out.printf("%f %s %f = %f%n", x, op, y, op.apply(x, y));
        }
    }
}

enum Operation {
    PLUS("+") {
        public double apply(double x, double y) {
            return x + y;
        }
    },
    MINUS("-") {
        public double apply(double x, double y) {
            return x - y;
        }
    },
    TIMES("*") {
        public double apply(double x, double y) {
            return x * y;
        }
    },
    DIVIDE("/") {
        public double apply(double x, double y) {
            return x * y;
        }
    };

    private final String symbol;

    Operation(String symbol) {
        this.symbol = symbol;
    }

    @Override
    public String toString() {
        return symbol;
    }

    public abstract double apply(double x, double y);
}

// output
// 2.000000 + 3.000000 = 5.000000
// 2.000000 - 3.000000 = -1.000000
// 2.000000 * 3.000000 = 6.000000
// 2.000000 / 3.000000 = 6.000000
```

Enums automatically generate `valueOf(String)` to return a constant by name.
If you override `toString`, you may also want a `fromString` that maps the string back to the enum constant.

```java
private static final Map<String, Operation> stringToEnum =
		Stream.of(values()).collect(Collectors.toMap(Object::toString, e -> e));

/*
 * For readability, expanded version:
private static final Map<String, Operation> stringToEnum =
    Stream.of(values()).collect(Collectors.toMap(new Function<Operation, String>() {
        @Override
        public String apply(Operation o) {
            return o.toString();
        }
    }, new Function<Operation, Operation>() {
        @Override
        public Operation apply(Operation o) {
            return o;
        }
    }));
*/
public static Optional<Operation> fromString(String symbol) {
    return Optional.ofNullable(stringToEnum.get(symbol));
}
```

This design still has a weakness: it is hard for enum constants to share code.
Consider the following example.

```java
enum PayrollDay {
	MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY,
	SATURDAY, SUNDAY;

	private static final int MINS_PER_SHIFT = 8 * 60; // 8 hours per day

	int pay(int minutesWorked, int payRate) {
        int basePay = minutesWorked * payRate;

		int overtimePay;
		switch(this) {
			case SATURDAY: case SUNDAY: // weekend
				overtimePay = basePay / 2;
				break;
			default: // weekday
				if (minutesWorked <= MINS_PER_SHIFT) {
					overtimePay = 0	;
				} else {
					overtimePay = (minutesWorked - MINS_PER_SHIFT) * payRate / 2;
				}
		}
		return basePay + overtimePay;
	}
}
```

If you add a new value like a holiday, you must update the `switch`.
Otherwise, holiday work still receives weekday pay.

<br/>

# The Strategy Enum Pattern
For safety and flexibility, consider the **strategy enum pattern**.
It eliminates the `switch` and constant-specific method problems by assigning a **pay strategy** per constant.

```java
enum PayrollDay {
	MONDAY(), TUESDAY, WEDNESDAY, THURSDAY, FRIDAY,
	SATURDAY(PayType.WEEKEND), SUNDAY(PayType.WEEKEND);

	private final PayType payType;

	PayrollDay() {
		this(PayType.WEEKDAY);
	}

	PayrollDay(PayType payType) {
		this.payType = payType;
	}

	enum PayType {
		WEEKDAY {
			int overtimePay(int minsWorked, int payRate) {
				int overtimePay;
				if (minsWorked <= MINS_PER_SHIFT) {
					overtimePay = 0;
				} else {
					overtimePay = (minsWorked - MINS_PER_SHIFT) * payRate / 2;
				}
				return overtimePay;
			}
		},
		WEEKEND {
			int overtimePay(int minsWorked, int payRate) {
				return minsWorked * payRate / 2;
			}
		};

		abstract int overtimePay(int mins, int payRate);

		private static final int MINS_PER_SHIFT = 8 * 60; // 8 hours per day

		int pay(int minutesWorked, int payRate) {
			int basePay = minutesWorked * payRate;
			return basePay + overtimePay(minutesWorked, payRate);
		}
	}
}
```

<br/>

# Summary
Enums are clearer and more powerful than int constants.
They are easier to read and allow methods and fields.
If the set of required values is known at compile time, enums are the right choice.
Enums are designed for binary compatibility, so the number of constants does not need to stay fixed forever.
