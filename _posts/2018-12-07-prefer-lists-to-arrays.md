---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 28. 배열보다는 리스트를 사용하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 28. Prefer lists to arrays" 
category: Java
comments: true
---

# 배열과 제네릭 타입의 차이
첫 번째로 배열은 공변(covariant)입니다. 예를들어 `Sub`가 `Super`의 하위 타입이라면
배열 `Sub[]`는 배열 `Super[]`의 하위 타입이 된다고 할 수 있습니다.
이를 공변이라고 합니다. 즉 함께 변한다는 뜻이지요.

반면에 제네릭은 불공변(invariant) 입니다. `List<Sub>`는 `List<Super>`의 하위 타입도 아니고
상위 타입도 되지 않습니다.

단순 비교만으로는 제네릭에 문제가 있다고 생각하지만, 사실 문제가 있는 건 배열입니다.
`Long` 타입용 저장소에 `String` 타입을 넣을 수는 없습니다. 아래의 코드처럼 배열에서는
코드가 실행되는 런타임 시점에서야 오류가 발생함을 알 수 있지만 리스트의 경우 컴파일 시점에 오류를 확인할 수 있습니다.

```java
Object[] objectArray = new Long[1];
// ArrayStoreException 발생
objectArray[0] = "Kimtaeng";

// 아예 컴파일 오류
List<Object> objectList = new ArrayList<Long>();
objectList.add("Kimtaeng");
```

다음으로 제네릭과 다르게 배열은 실체화(reify) 됩니다. 런타임에도 자신이 담기로 한 원소의 타입을
인지하게 확인함을 말합니다. 위의 코드에서 `ArrayStoreException`이 발생한 것도 그 이유입니다.

하지만 제네릭은 타입 정보가 런타임 시점에 소거(erasure)됩니다. 원소 타입을 컴파일 시점에만 검사하기 때문에
런타임 시점에는 알 수 없습니다. 타입 정보가 소거된 `로 타입(Raw type)`의 경우 제네릭이 지원되기 전의 레거시 코드와
제네릭 타입을 함께 사용할 수 있도록 해줍니다. 

- <a href="/post/dont-use-raw-types" target="_blank">참고 링크: [이펙티브 자바 3판] 26: 로 타입은 사용하지 말라</a> 

이처럼 결국 배열과 제네릭은 친해지기 어려운 관계입니다. 배열은 아래와 같이 제네릭 타입, 매개변수화 타입,
타입 매개변수로 사용할 수 없습니다.

```java
// 배열은 아래와 같이 사용하면 오류가 발생한다.
new List<E>[]; // 제네릭 타입
new List<String>[]; // 매개변수화 타입
new E[]; // 타입 매개변수
```

<br/>

# 왜 제네릭 배열을 생성 못하게 막았을까?
타입 안전성이 보장되지 않기 때문입니다. 제네릭 배열의 생성을 허용한다면 컴파일러가 자동으로 생성한 형변환 코드에서
런타임 시점의 `ClassCastException`이 발생할 수 있습니다. 런타임 시점의 형변환 예외가 발생하는 것을 막겠다는
제네릭의 취지에 맞지 않습니다. 아래 예시의 `(1)` 번처럼 제네릭 배열이 생성된다고 가정해봅시다.

```java
List<String>[] stringLists = new List<String>[1]; // (1) 
List<Integer> intList = List.of(42);              // (2)
Object[] objects = stringLists;                   // (3)
objects[0] = intList;                             // (4)
String s = stringLists[0].get(0);                 // (5)
```

- `(2)` 번은 원소가 하나인 `List`를 생성합니다. 참고로 `List.of` 메서드는 `JDK 9`부터 사용할 수 있습니다.
- `(3)` 번은 `(1)`번 과정에서 생성된다고 가정한 제네릭 배열을 `Object[]`에 할당합니다.
배열은 공변(Covariant)이므로 아무런 문제가 없습니다.
- `(4)` 번은 `(2)`에서 생성한 `List<Integer>`의 인스턴스를 Object 배열의 첫 원소로 저장합니다.
제네릭은 런타임 시점에서 타입이 사라지므로 `List<Integer>은 List`가 되고 `List<Integer>[]는 List[]`가 됩니다.
따라서 `ArrayStoreException`이 발생하지 않습니다.
- 문제되는 부분은 `(5)` 번입니다. `List<String>` 인스턴스만 담겠다고 선언한 stringLists 배열에
다른 타입의 인스턴스가 담겨있는데 첫 원소를 꺼내려고 합니다. 그리고 이를 String으로 형변환하는데, 이 원소는
Integer 타입이므로 런타임에 `ClassCastException` 이 발생합니다. 

따라서 이러한 일을 방지하려면 제네릭 배열이 생성되지 않도록 `(1)` 번 과정에서 컴파일 오류가 발생해야 합니다.

<br/>

# 실체화 불가 타입
`E, List<E>, List<String>` 같은 타입을 실체화 불가 타입(non-reifiable type)이라 합니다.
제네릭 소거로 인해 실체화되지 않아서 런타임 시점에 컴파일타임보다 타입 정보를 적게 가지는 타입을 말합니다.

- <a href="https://docs.oracle.com/javase/tutorial/java/generics/nonReifiableVarargsType.html#non-reifiable-types"
rel="nofollow" target="_blank">참조 링크: Oracle Docs: Non-Reifiable Types</a>

소거로 인해 매개변수화 타입 가운데 실체화될 수 있는 타입은 `List<?>`와 `Map<?,?>` 같은 비한정적 와일드카드 타입뿐입니다.

<br/>

# 배열로 형변환시 오류가 발생한다면
배열로 형변환할 때 제네릭 배열 생성 오류나 비검사 형변환 경고가 뜨는 경우
대부분은 배열인 `E[]` 대신에 컬렉션인 `List<E>`를 사용하면 해결됩니다. 

```java
public class Chooser {
    private final Object[] choiceArray;
    
    public Chooser(Collection choices) {
        this.choiceArray = choices.toArray();
    }
    
    // 이 메서드를 사용하는 곳에서는 매번 형변환이 필요하다.
    // 형변환 오류의 가능성이 있다.
    public Object choose() {
        Random rnd = ThreadLocalRandom.current();
        return choiceArray[rnd.nextInt(choiceArray.length)];
    }
}
```

위 코드를 제네릭을 사용하여 아래와 같이 변경할 수 있습니다. 

```java
public class Chooser<T> {
    private final T[] choiceArray;

    public Chooser(Collection<T> choices) {
        // 오류 발생 incompatible types: java.lang.Object[] cannot be converted to T[]
        this.choiceArray = choices.toArray();
    }

    // choose 메소드는 동일하다.
}
```

`incompatible types` 오류는 아래와 같이 코드를 변경하면 해결됩니다.

```java
// Object 배열을 T 배열로 형변환하면 된다.
this.choiceArray = (T[]) choices.toArray();
```

컴파일 오류는 사라졌지만 `Unchecked Cast` 경고가 발생합니다. 타입 매개변수 T가 어떤 타입인지 알 수 없으니 형변환이
런타임에도 안전한지 보장할 수가 없다는 메시지입니다. 제네릭은 런타임에는 타입 정보가 소거되므로 무슨 타입인지 알 수 없습니다.
`Unchecked Cast`과 같은 비검사 형변환 경고를 제거하려면 배열 대신 리스트를 사용하면 됩니다.

```java
class Chooser<T> {
    private final List<T> choiceList;

    public Chooser(Collection<T> choices) {
        this.choiceList = new ArrayList<>(choices);
    }

    public T choose() {
        Random rnd = ThreadLocalRandom.current();
        return choiceList.get(rnd.nextInt(choiceList.size()));
    }
}
```

정리해보면 배열은 공변이고 실체화되는 반면, 제네릭은 불공변이고 타입 정보가 소거됩니다.
따라서 배열은 런타임에는 타입 안전하지만 컴파일타임에는 안전하지 않습니다. 제네릭은 그 반대로 적용됩니다.