---
layout:   post
title:    "자바 직렬화: writeObject와 readObject"
author:   Kimtaeng
tags: 	  java readobject writeobject serialization
description: "자바 직렬화에 사용되는 writeObject 메서드와 readObject 메서드의 역할은 무엇일까? 그리고 왜 private 일까?"
category: Java
date: "2019-07-07 00:36:21"
comments: true
---

# 자바 직렬화란 무엇일까?
자바로 구현된 시스템 간에 데이터를 주고 받는 방법으로 자바 직렬화가 있다. 직렬화하고 싶은 클래스에 `Serializable` 인터페이스만
구현(implements) 해주면 **직렬화 가능한 클래스**가 된다. 클래스에서 `transient` 또는 `static` 키워드가 선언된 필드를 제외하고는
모두 직렬화 대상이 된다.

- <a href="/post/java-serialization" target="_blank">참고 링크: "자바 직렬화: 직렬화와 역직렬화"</a>

<br><br>

# 직렬화 예제
`writeObject`와 `readObject` 메서드에 대해서 알아보기 전에 간단한 자바 직렬화/역직렬화를 테스트 해보자.
직렬화 가능 클래스인 `Article` 에는 직렬화 대상에서 제외하기 위한 `transient` 필드도 포함되어 있다.

```java
/**
 * 직렬화 가능 클래스
 * @author madplay
 */
public class Article implements Serializable {
	private transient Integer id; // 직렬화 대상에서 제외한다.
	private String title;
	private String pressName;
	private String reporterName;

	public Article(Integer id, String title, String pressName, String reporterName) {
		this.id = id;
		this.title = title;
		this.pressName = pressName;
		this.reporterName = reporterName;
	}

    /**
     * 멤버 필드 확인 용도로 재정의한다.
     */
	@Override
	public String toString() {
		return String.format("id = %s, title = %s, pressName = %s, reporterName = %s",
			id, title, pressName, reporterName);
	}
}
```

`Article` 클래스는 `Serializable` 인터페이스를 구현했기 때문에 **직렬화 가능 클래스**이다. 아래와 같이 `main` 메서드를 정의하여
코드를 실행한 후 직렬화와 역직렬화 결과를 확인해보자.

```java
/**
 * 직렬화, 역직렬화 테스트 코드
 * @author madplay
 */
public class SerializationTester {

	public byte[] serialize() {
		Article article = new Article(1, "직렬화 테스트", "김탱일보", "김탱");

		ByteArrayOutputStream bos = new ByteArrayOutputStream();
		try (bos; ObjectOutputStream oos = new ObjectOutputStream(bos)) {
			oos.writeObject(article);
		} catch (Exception e) {
			// ... 구현 생략
		}
		return bos.toByteArray();
	}

	public Article deserialize(byte[] serializedData) {
		ByteArrayInputStream bis = new ByteArrayInputStream(serializedData);
		try (bis; ObjectInputStream ois = new ObjectInputStream(bis)) {
			Object object = ois.readObject();
			return (Article)object;
		} catch (Exception e) {
			// ... 구현 생략
		}
		return null;
	}

	public static void main(String[] args) {
		SerializationTester serializationTester = new SerializationTester();
		byte[] serializedData = serializationTester.serialize();
		Article article = serializationTester.deserialize(serializedData);
		System.out.println(article); // 결과 출력
	}
}
```

출력 결과는 아래와 같다. `transient` 키워드가 선언된 멤버 변수 `id`는 직렬화 대상에 제외되었기 때문에
자바 객체로 변환되는 역직렬화 결과에서도 값을 확인할 수 없다.

```bash
id = null, title = 직렬화 테스트, pressName = 김탱일보, reporterName = 김탱
```

<br><br>

# writeObject, readObject
기본적인 자바 직렬화 또는 역직렬화 과정에서 별도의 처리가 필요할 때는 `writeObject`와 `readObject` 메서드를 클래스 내부에
선언해주면 된다. 물론 해당 클래스는 `Serializable` 인터페이스를 구현한 직렬화 대상 클래스여야 한다.
직렬화 과정에서는 `writeObject`가 역직렬화 과정에서는 `readObject` 메서드가 자동으로 호출된다.

직렬화 가능 클래스인 `Article` 클래스에 아래와 같이 코드를 수정해보자. 발생할 수 있는 예외에 대한 처리는 아래와 같이 임의로
`try-catch` 문을 사용했다. 선호에 따라서 구현하면 되기 때문에 자세한 구현은 생략한다.

```java
/**
 * 직렬화 가능한 클래스
 * @author madplay
 */
public class Article implements Serializable {
	private transient Integer id; // 직렬화 대상에서 제외한다.
	private String title;
	private String pressName;
	private String reporterName;

    /**
    * 직렬화 때 자동으로 호출된다.
    * 반드시 private으로 선언해야 한다.
    */
    private void writeObject(ObjectOutputStream oos) {
        try {
            oos.defaultWriteObject();
            oos.writeObject(this.id); // transient 키워드가 선언된 필드
            oos.writeObject(this.title);
            oos.writeObject(this.pressName);
            oos.writeObject(this.reporterName);
            System.out.println("writeObject method called");
        } catch (IOException e) {
            // ... 구현 생략
        }
    }

    /**
    * 역직렬화 때 자등올 호출된다.
    * 반드시 private으로 선언해야 한다.
    */
    private void readObject(ObjectInputStream ois) {
        try {
            ois.defaultReadObject();
            this.id = (Integer)ois.readObject();
            this.title = (String)ois.readObject();
            this.pressName = (String)ois.readObject();
            this.reporterName = (String)ois.readObject();
            System.out.println("readObject method called");
        } catch (IOException | ClassNotFoundException e) {
            // ... 구현 생략
        }
    }

    // ... 그 외는 기존 코드와 동일하다.
}
```

중요하게 봐야하는 것은 `writeObject`와 `readObject` 메서드의 접근 지정자를 `private`으로 선언한 것이다.
다른 접근 지정자로 지정한 경우 자동으로 호출되지 않는다.

또한 `writeObject` 메서드에서는 `ObjectOutputStream`의 `defaultWriteObject` 메서드를 가장 먼저 호출해야 하며,
이어서 클래스의 직렬화할 필드를 `writeObject` 메서드의 인수로 넘기면 된다. 예제에서는 `transient`로 선언된 필드도 포함했다.

같은 맥락으로 `readObject` 메서드에서는 `ObjectInputStream`의 `defaultReadObject` 메서드가 가장 먼저 선언돼야 한다.
그리고 `writeObject` 메서드에서 직렬화한 필드 순서대로 `ObjectInputStream`의 `readObject` 메서드를 수행하여 클래스의 멤버 필드에
대입해준다.

`Article` 클래스에 메서드를 추가했다면 다시 코드를 실행해보자. 결과가 어떻게 될까?

```bash
writeObject method called
readObject method called
id = 1, title = 직렬화 테스트, pressName = 김탱일보, reporterName = 김탱
```

콘솔 출력을 통해 `writeObject` 메서드와 `readObject` 메서드가 호출된 것을 알 수 있다.
한편 유심히 봐야하는 것은 `transient`가 선언된 키워드도 직렬화 대상에 포함되는 것이다.

이처럼 직렬화 과정에서 추가적인 조치를 취하고 싶을 때 사용하면 된다.

<br>

# 조금 더 자세히 살펴보자.
`writeObject` 메서드와 `readObject` 메서드에서 기본적인 내용과 동작은 살펴보았다.
이들에 대해서 조금 더 자세히 알아보자.

## 왜 private 일까?
`writeObject` 메서드와 `readObject` 메서드는 반드시 `private` 으로 선언해야 한다. 다른 접근 지정자로 선언된 경우 호출되지 않는다.
`private` 으로 선언되었다는 것은 이 클래스를 상속한 서브 클래스에서 메서드를 **재정의(override)**를 하지 못하게 한다는 것이다.

또한 다른 객체는 호출할 수 없기 때문에 클래스의 무결성이 유지되며 수퍼 클래스와 서브 클래스는 독립적으로 직렬화 방식을 유지하며 확장될 수 있다.
직렬화 과정에서는 **리플렉션(reflection)**을 통해 메서드를 호출하기 때문에 접근 지정자는 문제가 되지 않는다.

## 기본 직렬화 수행을 위한 규칙
`writeObject` 메서드를 사용할 때는 `defaultWriteObject` 메서드를 가장 먼저 호출해야 한다. 같은 맥락에서 `readObject` 메서드는
`defaultReadObject` 메서드를 가장 먼저 호출해야한다. 그래야 기본 직렬화를 수행한다.


## 또 다른 생성자가 생긴다.
한편 `readObject` 메서드는 클래스의 또 다른 `public` 생성자와도 같기 때문에 주의해서 작성해야 한다.
매개변수로 바이트 스트림을 받는 생성자가 생긴다고 보면 된다.

- <a href="/post/write-readobject-methods-defensively" target="_blank">
참고 링크: [이펙티브 자바 3판] 아이템 88. readObject 메서드는 방어적으로 작성하라</a>