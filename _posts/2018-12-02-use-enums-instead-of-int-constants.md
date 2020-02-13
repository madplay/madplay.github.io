---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 34. INT 상수 대신 열거 타입을 사용하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 34. Use enums instead of int constants"
category: Java
comments: true
---

# 자바에서 상수 선언
자바 언어의 열거 타입(enum type)은  `Java 1.5 `에 등장했습니다. 그 버전에서 상수 선언은 아래와 같이 했지요.

```java
public static final int APPLE_FUJI = 0; // 부사?
public static final int APPLE_PIPPIN = 1; // ..!?
public static final int APPLE_GRANNY_SMITH = 2; // 풋사과..?

public static final int ORANGE_NAVEL = 0; // 귤인가...
public static final int ORANGE_TEMPLE = 1; // 귤인듯...
public static final int ORANGE_BLOOD = 2; // 붉은색 오렌지?
```

위와 방식을 정수 열거 패턴(int enum pattern)이라고 하는데, 보기만해도 단점이 많아 보입니다.
먼저 **타입 안전성을 보장하기가 어렵습니다.** 예를 들어서 오렌지를 건네야 하는 메서드에 사과를 보낸다면 어떻게 될까요?
동등 연산자(==)로 비교해도 아무런 경고없이 동작하게 되겠지요.

그리고 **표현 방식이 참 애매합니다.** 사과용 상수와 오렌지용 상수의 이름 충돌을 방지하기 위해 접두사(prefix)를 사용했습니다.
마지막으로 이를 문자열로 출력하기도 다소 까다로운 점이 있습니다.

그렇다면 열거 타입(enum type)을 사용하면 어떻게 될까요?

<br/>

# 열거 타입의 등장
열거 타입의 등장으로 아래와 같이 간편하게 사용할 수 있습니다.

```java
public enum Apple {
    FUJI, PIPPIN, GRANNY_SMITH
}
public enum Orange {
    NAVEL, TEMPLE, BLOOD
}
```

그렇다면 열거 타입에는 어떠한 장점들이 있을까요?

- 자바의 열거 타입은 완전한 형태의 클래스라고 볼 수 있습니다.
- 열거 타입은 밖에서 접근할 수 있는 생성자를 제공하지 않으므로 사실상 final 이라고 볼 수 있습니다.
- 인스턴스들은 오직 하나만 존재합니다.
- 열거 타입은 컴파일 타임에서의 타입 안전성을 제공합니다.
  - 예를 들어 위의 예제에서 Apple 열거 타입을 매개변수로 받는 메서드를 선언했다면, 건네받은 참조는
  Apple의 세 가지 값 중 하나임이 확실합니다. 다른 타입의 값을 넘기려 하면 컴파일 오류가 발생합니다.
- 열거 타입의 toString 메서드는 출력하기에 적합한 문자열을 제공합니다.
- 임의의 메서드나 필드를 추가할 수 있고 임의의 인터페이스를 구현하게 할 수 있습니다.

<br/>

# 열거 타입의 예시
- 아래와 같이 태양계의 여덞 행성에 대한 열거 타입을 만드는 것도 그리 어렵지 않습니다.

```java
enum Planet {
    MERCURY(3.302e+23, 2.439e6),
    VENUS(4.869e+24, 6.052e6),
    EARTH(5.975e+24, 6.378e6);
    // ...

    private final double mass; // 질량
    private final double radius; // 반지름
    private final double surfaceGravity; // 표면중력

    private static final double G = 6.67300E-11;

    // 생성자
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

열거 타입 상수 각각을 특정 데이터와 연결지으려면 생성자에서 데이터를 받아 인스턴스 필드에 저장하면 됩니다.
한편 열거 타입은 근본적으로 불변이므로 모든 필드는  `final ` 이어야 합니다. 열거 타입은 자신 안에 정의된
상수들의 값을 배열에 담아 반환하는 정적 메서드  `values ` 를 제공합니다.

```java
public class EffectiveJava34 {
    public static void main(String []args) {
        double earthWeight = Double.parseDouble("150");
        double mass = earthWeight / Planet.EARTH.surfaceGravity();

        // 모든 enum 요소를 탐색할 수 있다.       
        for(Planet p : Planet.values()) {
            System.out.printf("%s에서의 무게는 %f이다.%n", p, p.surfaceWeight(mass));
        }
     }
}
```

<br/>

# 상수가 더 다양한 기능을 제공하길 원한다면?
예를 들어 사칙연산 계산기의 연산 종류를 열거 타입으로 선언하고, 실제 연산까지 열거 타입 상수가 직접 수행하게 된다면 어떨까요?

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
        throw new AssertionError("알 수 없는 연산: " + this);
    }
}
```

위 코드는 정상적으로 실행되나 그리 적절한 코드라고 보기는 어렵습니다.
마지막에 선언된 throw 문은 실제로 실행될 경우가 적지만 기술적으로는 도달할 수 있습니다.
그리고 깨지기 쉬운 코드인데요. 예컨대 새로운 상수를 추가하면 해당 case 문장도 추가해야 합니다.

그렇다면 상수에서 알맞게 재정의하는 방법을 쓰는 것은 어떨까요?

<br/>

# 상수별 메서드 구현
상수별 메서드 구현(constant-specific method implementation)은 상수에서 자신에 맞게 재정의하는 것을 말합니다.

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

apply 메서드가 상수 선언 바로 밑에 있으니 새로운 상수를 추가할 때도 apply 메서드를 항상 재정의해야 한다는
사실을 까먹기 어렵습니다. 그리고 apply 메서드가 추상 메서드이므로 재정의하지 않았다면 컴파일 오류도 알려줍니다.

상수별 메서드 구현을 상수별 데이터와 결합할 수도 있습니다. 예를 들어 아래와 같이 Operation의 toString을
재정의하여 해당 연산을 뜻하는 기호를 반환하도록 해봅시다.

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

// 출력
2.000000 + 3.000000 = 5.000000
2.000000 - 3.000000 = -1.000000
2.000000 * 3.000000 = 6.000000
2.000000 / 3.000000 = 6.000000
```

열거 타입에는 상수 이름을 입력받아 그 이름에 해당하는 상수를 반환해주는  `valueOf(String) ` 메서드가
자동 생성됩니다. 열거 타입의 toString 메서드를 재정의했다면,  `toString `이 반환하는 문자열을 해당 열거 타입 상수로
변환해주는  `fromString ` 메서드도 고려해볼 수 있습니다.

```java
private static final Map<String, Operation> stringToEnum =
		Stream.of(values()).collect(Collectors.toMap(Object::toString, e -> e));

/*
 * 가끔 안 읽혀서... 풀어보면ㅎ
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

그런데, 이런 상수별 메서드에도 단점은 있습니다. 열거 타입 상수끼리 코드를 공유하기가 어려운 점인데요.
예를 들어서 살펴봅시다.

```java
enum PayrollDay {
	MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY,
	SATURDAY, SUNDAY;

	private static final int MINS_PER_SHIFT = 8 * 60; // 하루 8시간

	int pay(int minutesWorked, int payRate) {
        int basePay = minutesWorked * payRate;

		int overtimePay;
		switch(this) {
			case SATURDAY: case SUNDAY: // 주말
				overtimePay = basePay / 2;
				break;
			default: // 주중
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

휴가와 같이 새로운 값을 열거 타입에 추가하려면 그 값을 처리하는 case 문을 넣어야 합니다.
그렇지 않으면 휴가 기간에 일해도 평일과 똑같은 임금을 받게 되겠죠... 그럼 어떻게 해야 할까요?

<br/>

# 전략 열거 타입 패턴
안전성과 유연함을 고려한다면 **전략 열거 타입 패턴**을 고려해볼 수 있습니다. switch 문이나 상수별 메서드 구현이
필요 없어지지요. 새로운 상수를 추가할 때마다 잔업수당 **전략**을 선택하도록 하는 것입니다.

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

		private static final int MINS_PER_SHIFT = 8 * 60; // 하루 8시간

		int pay(int minutesWorked, int payRate) {
			int basePay = minutesWorked * payRate;
			return basePay + overtimePay(minutesWorked, payRate);
		}
	}
}
```

<br/>

# 그래서 정리해보면
열거 타입은 확실히 정수 상수보다 효율적입니다. 읽기도 쉽고 강력합니다. 물론 메서드도 쓸 수 있고요.
필요한 원소를 컴파일 타임에 모두다 알 수 있는 상수의 집합이라면 열거 타입을 강력히 추천합니다.
바이너리 수준에서 호환되도록 설계되었기 때문에 열거 타입에 정의된 상수 개수가 영원히 고정 불변일 필요도 없습니다.