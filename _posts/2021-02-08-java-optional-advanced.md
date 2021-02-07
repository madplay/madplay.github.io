---
layout:   post
title:    "자바 Optional: 5. Optional 톺아보기"
author:   Kimtaeng
tags: 	  java optional
description: Optional 클래스를 의도에 맞게 잘 사용하려면 어떻게 해야할까?
category: Java
date: "2021-02-08 00:59:35"
comments: true
---

# 목차
- <a href="/post/what-is-null-in-java">자바 Optional: 1. null은 무엇인가?</a>
- <a href="/post/introduction-to-optional-in-java">자바 Optional: 2. Optional 소개</a>
- <a href="/post/how-to-handle-optional-in-java">자바 Optional: 3. Optional 중간 처리 메서드</a>
- <a href="/post/how-to-return-value-from-optional-in-java">자바 Optional: 4. Optional 종단 처리 메서드</a>
- 자바 Optional: 5. Optional 톺아보기

<br>

# 이게 맞나..?
지금까지 `Optional` 클래스 객체를 생성하고 다루는 방법에 대해서 알아보았다. 이제 잘 사용하기만 하면 된다!
'NPE를 예방하는 고전적인 방법' 에서 살펴본 `getPhoneManufacturerName` 메서드를 떠올려보자.
`null` 체크를 위한 `if` 조건문이 꾸덕꾸덕 중첩해서 붙어진 그 메서드를 말이다.

이 메서드에 지금까지 배운 내용들을 활용해 적용해보면 어떨까? `Optional`의 활용 방법을 정확하게 이해하지 못한 채로
사용한다면, 아래와 같은 코드를 작성할지도 모른다. `if` 조건문으로 `null` 체크하는 것과 별반 차이를 못 느끼게 해준다.
아니면 오히려 더 혼동될 것만 같은 스타일이다.

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

그럼 어떻게 해야 `Optional` 클래스를 의도에 맞게 잘 사용할 수 있을까? 이번 글에서는 `Optional` 클래스를 조금 더
효율적으로 사용할 수 있는 방법에 대해서 소개한다.

<br>

# isPresent와 get 메서드보다는 orElse, orElseXXX
앞서 살펴본 `isPresent`와 `get` 메서드의 조합으로 안전하게 값을 꺼내는 것보다는 `orElse`, `orElseGet` 메서드를 활용하는
것이 더 좋다. 아래와 같이 바꿔보자.

```java
public String getPhoneManufacturerName(Person person){
    return Optional.ofNullable(person)
        .map(Person::getPhone)
        .map(Phone::getManufacturer)
        .map(Manufacturer::getName)
        .orElse("Samsung");
}
```

<br>

# orElse 메서드 보다는 orElseGet 메서드
`orElseGet` 메서드는 `Optional` 객체에 값이 없을 때만 실행되지만, `orElse` 메서드는 그렇지 않다. 
값이 있든 없든 무조건 실행되기 때문에 메서드로 넘겨지는 매개변수의 생성 비용이 큰 경우 주의해야 한다.

예를 들어, `Collections` 클래스의 `emptyList`, `emptyMap`, `emptySet` 메서드와 같은 메서드는 매번 생성자를 호출하는
것이 아니라 클래스의 정적 필드로 선언된 `EMPTY_LIST`, `EMPTY_MAP`, `EMPTY_SET`을 반환하므로 비용이 적다.
하지만 이마저도 `orElseGet` 메서드를 활용해서 아래와 같이 변경할 수 있다.

```java
// 생성 비용이 크지 않아 나쁘지 않지만,
Optional.ofNullable(someObj).orElse(Collections.emptyList());
Optional.ofNullable(someObj).orElse(Collections.emptyMap());
Optional.ofNullable(someObj).orElse(Collections.emptySet());

// 이렇게 변경하는 것이 더 좋다.
Optional.ofNullable(someObj).orElseGet(Collections::emptyList);
Optional.ofNullable(someObj).orElseGet(Collections::emptyMap);
Optional.ofNullable(someObj).orElseGet(Collections::emptySet);
```

<br>

# Optional은 직렬화할 수 없다.
`Optional` 클래스는 직렬화(Serialize) 할 수 없다. 클래스의 내부를 살펴보면 `java.io.Serializable` 인터페이스를
구현(implements) 하지 않는다. 만일 직렬화를 시도한다면 `NotSerializableException` 예외가 발생하는 것을 볼 수 있다.

기본적으로 이 클래스의 목적은 선택형 반환값을 지원하는 것이기 때문에, 설계한 도메인 클래스에 `Optional`과 직렬화가
모두 필요하다면, 아래와 같은 방법을 사용해볼 수 있다.

```java
class Person {
	private Phone phone;

	public Optional<Phone> getPhoneAsOptional() {
		return Optional.ofNullable(phone);
	}
}
```

아니면 구글(Google)에서 제공하는 라이브러리인 `guava`의 `Optional` 클래스를 사용하는 방법도 있다. 
`Serializable` 인터페이스를 상속하기 직렬화가 가능하다. 다만, `ifPresent`, `flatMap`과 같은 추가적인 메서드를
사용하지 못하며, 기본형 타입(primitive type)에 특화된 `OptionalInt`, `OptionalLong` 등을 사용하지 못한다.

- <a href="https://guava.dev/releases/snapshot-jre/api/docs/com/google/common/base/Optional.html" target="_blank">참고 링크: "guava 라이브러리: Optional"</a>

<br>

# Optional에 null 할당하지 않기
혹시나 `Optional`의 등장한 잠시 잊었다면, 값이 없는 `Optional` 객체를 표현하기 위해 `null` 할당할지 모른다.
`Optional` 객체의 초기화가 필요하다면, 내부적으로 싱글턴 객체를 사용하는 `empty` 메서드를 사용하자.

```java
// 나쁜 예시
public Optional<Person> findByName(String name) {
	// ...코드 생략
    
	if (result == 0) {
		return null;
    }
}

// 좋은 예시
public Optional<Person> findByName(String name) {
    // ...코드 생략
    if (result == 0) {
    	return Optional.empty();
    }
} 
```



<br>

# 기본형 특화 Optional을 사용하기 전에,
`Stream` 클래스에도 기본형 타입(primitive type)에 특화된 `IntStream`, `LongStream` 클래스 등이 있는 것처럼
`Optional` 클래스에도 `OptionalInt`, `OptionalLong` 등과 같이 기본형 타입에 특화된 클래스를 제공한다.

```java
// 이렇게 선언한 `Optional` 객체들은
Optional<Integer> intOpt = Optional.of(5);
Optional<Long> longOpt = Optional.of(5L);
Optional<Double> doubleOpt = Optional.of(5.0);

// 아래와 같이 대체할 수 있다.
	
OptionalInt intOpt = OptionalInt.of(5);
OptionalLong longOpt = OptionalLong.of(5L);
OptionalDouble doubleOpt = OptionalDouble.of(5.0);
```

이 클래스들은 보통 박싱(boxing)/언박싱(unboxing) 비용을 줄이기 위해 제공된다. 하지만, 기본형에 특화된 `Stream` 클래스들에
비해서 기본형에 특화된 `Optional` 클래스는 그렇게 큰 성능 개선 효과를 주지 못한다. 단일 원소이기 때문이다.

조금 더 나아가, `Optional<T>` 형태에서 사용할 수 있는 `map`, `filter` 등의 메서드를 사용하지 못한다.
물론, 자바 9에서 추가된 `stream` 메서드를 활용해서 해결할 수 있겠지만, 기본형 특화 `Optional`은 일반적인 `Optional<T>`와
같이 사용할 수 있다는 점도 고려해야 한다.

<br>

# Optional과 컬렉션을 사용할 때는,
빈(empty) 컬렉션이나 배열을 반환할 때는 빈 컬렉션을 반환하는 것이 좋다. `Optional` 클래스로 사용하여 래핑하면 사용하는 쪽에서
`Optional`을 다루기 위한 비용이 든다. 컬렉션을 다루는 메서드라면, `Optional`이나 `null`과 같은 값을 반환하지 않고
빈 컬렉션을 반환하도록 처리하자.

- <a href="/post/effectivejava-chapter8-methods#아이템-54-null이-아닌-빈-컬렉션이나-배열을-반환하라">참고 링크: "이펙티브 자바 아이템 54. null이 아닌, 빈 컬렉션이나 배열을 반환하라"</a>

또한, `Optional` 클래스를 컬렉션의 요소(element)로 사용하는 것은 좋지 않다.

```java
// `Optional`을 사용할 필요가 없다.
Map<String, Optional<String>> map = new HashMap<>();
map.put("testKey", Optional.of("testValue"));
map.put("testKey2", Optional.ofNullable(null));

String value = map.get("testKey2").orElse("testValue2");

// 컬렉션에서 제공하는 메서드를 활용하자
Map<String, String> map = new HashMap<>();
map.put("tesKey", "testValue");
map.put("testKey2", null);

String value = map.getOrDefault("testKey2", "testValue2");
```

<br>

# Optional 간의 내부 값 비교
`Optional` 클래스의 `equals` 메서드는 아래와 같이 구현되어 있다. 즉, 객체 `a`, `b`에 대해 `a.equals(b)`가 `true`라면,
`Optional.of(a).equals(Optional.of(b))`도 `true`가 성립한다. 

따라서 객체가 담고 있는 값까지 비교하기 때문에, `Optional` 객체가 같은지 비교할 때 일부러 값을 꺼내서 비교할 필요가 없다.

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

# 마치며
자바 언어에서 `null`이 무엇인지에 대해서 알아보는 것을 시작으로 `Optional` 클래스에 대한 소개 그리고 `Optional` 클래스의
객체를 생성하고 다루는 방법, 마지막으로 `Optional` 클래스를 조금 더 의도에 맞게 잘 사용하는 방법까지 살펴보았다.

메서드의 종류나 클래스의 구조가 생각보다 간단하기 때문에 사용 방법은 그렇게 어려운 편은 아니다. 다만 `Optional` 클래스가
등장한 배경이나, 자바 언어 아키텍트가 강조하는 `Optional` 클래스의 의도를 잘 숙지하고 사용하는 것은 생각보다 어렵다.
무심코 놓치고 지나갈 수 있는 부분이 많기 때문에 연습이 필요할 것 같다.