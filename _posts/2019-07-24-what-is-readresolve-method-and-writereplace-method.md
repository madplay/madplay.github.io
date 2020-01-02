---
layout:   post
title:    "자바 직렬화: readResolve와 writeReplace"
author:   Kimtaeng
tags: 	  java readresolve writereplace serialization
description: "자바 직렬화에 사용되는 readResolve 메서드와 writeReplace 메서드의 역할은 무엇일까?"
category: Java
date: "2019-07-24 01:21:46"
comments: true
---

# 진짜 싱글톤일까?
클래스의 객체 개수(보통 1개)를 제어하는 방법을 싱글톤 패턴이라고 한다. 객체가 여러 개 생성될 필요가 없을 때 하나만 생성하여
사용할 때마다 같은 객체를 참조하여 사용하도록 한다. 싱글톤 패턴이 적용된 클래스를 살펴보자.

- <a href="/post/singleton-pattern" target="_blank">참고 링크: 싱글톤 패턴(Singleton Pattern)</a>

```java
/**
 * @author madplay
 */
public final class MySingleton {
	private static final MySingleton INSTANCE = new MySingleton();

	private MySingleton() {
	}

	public static MySingleton getINSTANCE() {
		return INSTANCE;
	}
}
```

하지만 싱글톤 클래스는 직렬화 가능한 클래스가 되기 위해 `Serializable` 인터페이스를 구현(implements) 하는 순간, 
싱글톤 클래스가 아닌 상태가 된다. 직렬화를 통해 초기화해둔 인스턴스가 아닌 다른 인스턴스가 반환되기 때문이다.

- <a href="/post/java-serialization" target="_blank">참고 링크: "자바 직렬화: 직렬화와 역직렬화"</a>

아래와 같이 직렬화 가능 클래스로 만들고 직렬화/역직렬화를 해보자. 직렬화 과정에서도 같은 인스턴스가 사용되는지 확인해볼 수 있다.

```java
import java.io.Serializable;

/**
 * @author madplay
 */
public final class MySingleton implements Serializable { // Serializable
	private static final MySingleton INSTANCE = new MySingleton();

	private MySingleton() {
	}

	public static MySingleton getINSTANCE() {
		return INSTANCE;
	}
}
```

싱글턴 클래스를 직렬화 가능한 클래스로 만들었다. 이제 직렬화/역직렬화를 테스트할 수 있는 코드를 만들어서 확인해보자.

```java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

/**
 * @author madplay
 */
public class SerializationTester {

	public byte[] serialize(Object instance) {
		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		try (bos; ObjectOutputStream oos = new ObjectOutputStream(bos)) {
			oos.writeObject(instance);
		} catch (Exception e) {
			// ... 구현 생략
		}
		return bos.toByteArray();
	}

	public Object deserialize(byte[] serializedData) {
		ByteArrayInputStream bis = new ByteArrayInputStream(serializedData);
		try (bis; ObjectInputStream ois = new ObjectInputStream(bis)) {
			return ois.readObject();
		} catch (Exception e) {
			// ... 구현 생략
		}
		return null;
	}

	public static void main(String[] args) {
		MySingleton instance = MySingleton.getINSTANCE();
		SerializationTester serializationTester = new SerializationTester();
		byte[] serializedData = serializationTester.serialize(instance);
		MySingleton result = (MySingleton)serializationTester.deserialize(serializedData);
		System.out.println("instance == result : " + (instance == result));
		System.out.println("instance.equals(result) : " + (instance.equals(result)));
	}
}
```

실행 결과는 아래와 같다. 싱글턴 클래스라면 매번 같은 인스턴스가 반환되기 때문에 `==`연산자와 `equals` 메서드로 비교한 결과가
항상 `true` 여야 한다. 하지만 출력된 결과와 같이 결과가 `false`다. 그러니까 서로 다른 인스턴스다.

```bash
instance == result : false
instance.equals(result) : false
```

참고로 `hashCode`로 비교하는 경우는 정확하지 않을 수 있다. 서로 다른 객체임에도 해시 코드 값이 같을 수 있다.
예를 들어 문자열 `hypoplankton`와 `unheavenly`의 `hashCode()` 값을 출력해보면 같은 해시 코드 값이 반환되는 것을 알 수 있다.

<br>

# 그럼 어떻게 해야 할까?
이럴 때 `readResolve` 메서드를 사용하면 된다. 이 메서드를 직접 정의하여 역직렬화 과정에서 만들어진 인스턴스 대신에
기존에 생성된 싱글톤 인스턴스를 반환하도록 하면 된다.

만일 역직렬화 과정에서 자동으로 호출되는 `readObject` 메서드가 있더라도 `readResolve` 메서드에서 반환한 인스턴스로 대체된다.
`readObject` 메서드를 통해 만들어진 인스턴스는 가비지 컬렉션 대상이 된다.


- <a href="/post/what-is-readobject-method-and-writeobject-method" target="_blank">
참고 링크: "자바 직렬화: writeObject와 readObject"</a>

```java
import java.io.Serializable;

/**
 * @author madplay
 */
public final class MySingleton implements Serializable {
	private static final MySingleton INSTANCE = new MySingleton();

	private MySingleton() {
	}

	public static MySingleton getINSTANCE() {
		return INSTANCE;
	}

    // readResolve 메서드를 정의한다.
	private Object readResolve() {
        // 싱글턴을 보장하기 위함!
		return INSTANCE;
	}
}
```

`readResolve` 메서드를 추가한 뒤에 다시 실행해보자.
아래와 같이 `==` 연산자와 `equals` 메서드로 비교한 결과가 `true`인 것을 확인할 수 있다.

```bash
instance == result : true
instance.equals(result) : true
```

<br>

# writeReplace
`readResolve` 메서드와 같이 등장하는 것이 `writeReplace` 메서드이다. 자바 직렬화에서 다시 객체의 형태로 만드는 역직렬화 과정에서
사용하는 것이 `readResolve`라면 직렬화 과정에서는 `writeReplace` 메서드가 사용된다.

객체를 스트림에 작성할 때, 그러니까 직렬화 할때 원래 객체가 아닌 다른 객체를 직렬화 시키도록 할 수 있다.
아래 예제 코드를 통해 살펴보자.

```java
import java.io.Serializable;

/**
 * @author madplay
 */
public class Gender implements Serializable {
	public final static Gender MALE = new Gender(Detail.DETAIL_MALE);
	public final static Gender FEMALE = new Gender(Detail.DETAIL_FEMALE);

	private Detail detail;

	private Gender(Detail detail) {
		this.detail = detail;
	}

    // 직렬화 과정에서 호출된다.
	private Object writeReplace() {
		if (this.equals(MALE)) {
			return Detail.DETAIL_MALE;
		} else {
			return Detail.DETAIL_FEMALE;
		}
	}

	private static class Detail implements Serializable {
		final static Detail DETAIL_MALE = new Detail(0);
		final static Detail DETAIL_FEMALE = new Detail(1);

		private int value;

		private Detail(int value) {
			this.value = value;
		}

        // 역직렬화 과정에서 호출된다.
		private Object readResolve() {
			if (value == DETAIL_MALE.value) {
				return Gender.MALE;
			} else {
				return Gender.FEMALE;
			}
		}
	}
}
```

앞서 살펴본 직렬화/역직렬화 테스트 코드를 재사용해 테스트 해보자.


```java
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;

/**
 * @author madplay
 */
public class SerializationTester {

	// serialize, deserialize 메서드는 앞의 예제와 동일

	public static void main(String[] args) {
		Gender male = Gender.MALE;
		SerializationTester serializationTester = new SerializationTester();
		byte[] serializedData = serializationTester.serialize(male);
		Gender result = (Gender)serializationTester.deserialize(serializedData);
		System.out.println("male == result : " + (male == result));
		System.out.println("male.equals(result) : " + (male.equals(result)));
	}
}
```

출력 결과는 `true`가 반환된다. 사실 같은 객체라는 것보다는 `writeReplace` 메서드를 통해 다른 객체를 직렬화 시키는 것이 포인트다.
디버깅해보면 알 수 있지만, 직렬화 과정에서 `writeReplace` 메서드가 호출되고 메서드에 정의된 내용처럼 직렬화할 원래의 `Gender` 타입의
객체 대신에 `Detail` 타입의 객체가 대신 반환된다.