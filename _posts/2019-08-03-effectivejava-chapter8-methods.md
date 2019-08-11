---
layout:   post
title:    "[이펙티브 자바 3판] 8장. 메서드"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "[Effective Java 3th Edition] Chapter8: Methods"
category: Java
date: "2019-08-03 02:11:01"
comments: true
---

<hr/>

# 목록

- <a href="#아이템-49-매개변수가-유효한지-검사하라">아이템 49. 매개변수가 유효한지 검사하라</a>
- <a href="#아이템-50-적시에-방어적-복사본을-만들라">아이템 50. 적시에 방어적 복사본을 만들라</a>
- <a href="#아이템-51-메서드-시그니처를-신중히-설계하라">아이템 51. 메서드 시그니처를 신중히 설계하라</a>
- <a href="#아이템-52-다중정의는-신중히-사용하라">아이템 52: 다중정의는 신중히 사용하라</a>
- <a href="#아이템-53-가변인수는-신중히-사용하라">아이템 53. 가변인수는 신중히 사용하라</a>
- <a href="#아이템-54-null이-아닌-빈-컬렉션이나-배열을-반환하라">아이템 54. null이 아닌, 빈 컬렉션이나 배열을 반환하라</a>
- <a href="#아이템-55-옵셔널-반환은-신중히-하라">아이템 55. 옵셔널 반환은 신중히 하라</a>
- <a href="#아이템-56-공개된-api-요소에는-항상-문서화-주석을-작성하라">아이템 56. 공개된 API 요소에는 항상 문서화 주석을 작성하라</a>

<br/>


# 아이템 49. 매개변수가 유효한지 검사하라
> Check parameters for validity

매개변수의 유효성 검사는 메서드 몸체가 시작되기 전에 해야 한다. 그리고 매개변수에 대한 제약사항은 문서화가 필요하다.
유효성 검사를 제대로 하지 못하는 경우에는 어떻게 될까? 메서드가 수행되는 중간에 모호한 오류가 발생할 수 있으며
행여나 수행되더라도 잘못된 결과가 반환될 수 있다. 최악의 경우에는 잘 수행되다가 다른 객체의 상태 변경으로 인해
미래의 알 수 없는 시점에 오류가 발생할 수도 있다.

```public```과 ```protected``` 메서드는 매개변수 값이 잘못됐을 때 던지는 예외를 문서화해야 한다. 클래스 수준 주석은
그 클래스의 모든 public 메서드에 적용되므로 훨씬 깔끔하다. ```@Nullable```과 같은 어노테이션을 사용할 수도 있지만 표준은 아니다.
더불어 생성자 매개변수 검사도 클래스 불변식을 어기는 객체가 생성되지 않게 하기 위하여 꼭 필요하다. 

## 유효성 검사 방법

자바 7에 추가된 ```requireNonNull``` 메서드를 이용하면 조금 더 유연한 null 검사가 가능하다.

```java
public void someMethod(Integer val) {
    Integer integer = Objects.requireNonNull(val, "매개변수가 null 이네요?");
    System.out.println(integer);
}
```

위 메서드에 ```null```을 입력하면 아래와 같은 오류가 발생한다.

```bash
Exception in thread "main" java.lang.NullPointerException: 매개변수가 null 이네요?
	at java.base/java.util.Objects.requireNonNull(Objects.java:246)
```

자바 9에서는 Objects에 범위 검사 기능도 가능해졌다. ```checkFromIndexSize```, ```checkFromToIndex```, ```checkIndex``` 라는
메서드인데 null 검사 메서드만큼 유연하지는 않다. 예외 메시지를 지정할 수 없고 리스트와 배열 전용으로 설계됐다.

```java
List<String> list = List.of("a", "b", "c");

// Exception in thread "main" java.lang.IndexOutOfBoundsException: 
//      Index 4 out of bounds for length 3
Objects.checkIndex(4, list.size());
```

private으로 공개되지 않은 메서드라면 개발자가 직접 호출되는 상황을 통제할 수 있다. 이럴 때는 ```assert```를 사용하여
매개변수 유효성을 검사할 수 있다. 실행시에 assert를 수행하려면 인텔리제이 기준으로 VM Options에 ```-ea``` 또는 ```--enableassertions```
를 넘겨주어야 한다. 값을 넘겨주지 않으면 무시된다. 넘어온 매개변수가 조건식을 참으로 만들지 않으면 ```AssertionError```를 던진다.

```java
private void someMethod(int arr[], int length) {
    assert arr != null;
    assert length >= 0 && arr.length == length;

    // do something
}
```

## 유효성 검사가 필요 없는 경우

매개변수에 대한 유효성 검사가 꼭 필요하지 않는 경우도 있다. 유효성을 검사하는 비용이 지나치게 큰 경우 또는 계산 과정에서 암묵적으로
유효성 검사가 진행될 때이다. 예를 들어 ```Collections.sort(List)```처럼 리스트를 정렬할 때는 정렬 과정에서 모든 객체가 상호 비교된다.
만일 비교할 수 없는 타입의 객체가 있으면 ```ClassCastException```이 발생할 것이기 때문에 비교하기에 앞서 모든 원소를 검증하는 것은
불필요한 과정이 된다.

<div class="post_caption">매개변수는 메서드 코드 시작 부분에서 검사하자</div>

<br/>

# 아이템 50. 적시에 방어적 복사본을 만들라
> Make defensive copies when needed

자바는 안전한 언어다. 하지만 클라이언트가 언제든지 불변식을 깨드릴 수 있다고 가정하고 방어적인 프로그래밍을 해야 한다.
클래스가 클라이언트로부터 받거나 클라이언트에게 반환하는 구성 요소가 가변적이라면 그 요소는 반드시 방어적으로 복사해야 한다.

- <a href="/post/make-defensive-copies-when-needed">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 50. 적시에 방어적 복사본을 만들라</a>

<div class="post_caption">경우에 따라서 방어적 복사본을 만들어야 한다.</div>

<br/>

# 아이템 51. 메서드 시그니처를 신중히 설계하라
> Design method signatures carefully

**메서드 이름은 신중히 지어야한다.** 표쥰 명명 규칙에 따라 지으며 긴 이름은 지양해야 한다. 애매하다면 자바 라이브러리 가이드를
참조해도 좋다. 같은 패키지에 속한 다른 이름들과 일관되게 짓는 것이 좋다.

**편의 메서드를 많이 만드는 것은 좋지 않다.** 너무 많은 메서드는 그에 따른 문서화, 유지보수, 테스트를 요구한다.
메서드의 매개변수 목록도 4개 이하가 적절하며 특히 같은 타입의 매개변수 여러 개가 연달아 나오는 것은 좋지 않다.
매개변수를 줄일 수 있는 방법들을 살펴보자.

**여러 메서드로 나눠본다.** 예를 들어 리스트에서 특정 요소를 찾는다고 가정해보자. 이 기능을 하나의 메서드로 구현하려면
리스트의 시작과 끝 그리고 찾을 요소까지 총 3개의 매개변수가 필요하다. 하지만 List 인터페이스는 ```subList```와 ```indexOf```
메서드를 별개로 제공한다. 이들을 조합하면 원하는 기능을 구현할 수 있다.

```java
List<String> list = Lists.of("a", "b", "c", "d");

List<String> newList = list.subList(1, 3);
int index = newList.indexOf("b"); // 0
```

다른 방법으로는 **도우미(Helper) 클래스가 있다.** 여러 개의 매개변수를 묶어주는 역할을 하도록 말이다.

```java
// 기존 메서드
public void someMethod(String name, String address, String email, String job) {
    // do something
}

// Helper 클래스 적용
class SomeHelper {
    String name;
    String address;
    String email;
    String job;
}

public void someMethod(SomeHelper someHelper) {
    // do something
}
```

그리고 **빌더 패턴을 사용하는 방법이 있다.** 

- <a href="/post/creating-and-destroying-objects#아이템-2-생성자에-매개변수가-많다면-빌더를-고려하라">
링크 참고: [이펙티브 자바 3판] 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라</a>

한편 **파라미터의 타입으로는 클래스보다는 인터페이스 형태가 낫다.** 예를 들어 ```HashMap``` 보다는 ```Map```을 사용하는
편이 좋다. 클래스를 사용하는 것은 클라이언트에게 특정 구현체만 사용하도록 제한하는 것이다.
그리고 **boolean 보다는 원소 2개짜리 enum이 더 낫다.** 물론 이름상 boolean 형태가 명확한 경우는 예외다.

```java
public void setProgram(boolean isNews) {
    if (isNews) {
        // set program for news
    } else {
        // set anything
    }
}
```

만일 여기에 뉴스가 아닌 새로운 프로그램을 추가해야 한다면 어떻게 해야 할까? boolean을 사용한다면 새로운 타입에 대한
boolean 매개 변수가 필요할 것이다. 하지만 열거 타입으로 구현한다면 아래처럼 간결하게 작성할 수 있다.

```java
public enum ProgramType { NEWS, SPORTS, ENTERTAINMENT }

public void setProgram(ProgramType type) {
    switch (type) {
        case NEWS:
            // do something
            break;
        case SPORTS:
            // do something
            break;
        case ENTERTAINMENT:
            // do something
            break;
    }
}
```

<div class="post_caption">메서드의 이름과 매개변수 리스트는 신중히 설계해야 한다.</div>

<br/>

# 아이템 52: 다중정의는 신중히 사용하라
> Use overloading judiciously

재정의(overriding, 오버라이딩)를 한 메서드는 실행 중에 동적으로 선택되지만  다중 정의(overloading, 오버로딩)된 메서드의
호출 여부는 컴파일 타임에 정해진다. 그리고 이러한 다중 정의 메서드는 개발자가 기대한 것처럼 동작하지 않는 경우가 있다.

```java
class ColectionClassifier {
    public static String classify(Set<?> set) {
        return "집합";
    }

    public static String classify(List<?> list) {
        return "리스트";
    }

    public static String classify(Collection<?> collection) {
        return "그 외"
    }

    public static void main(String[] args) {
        Collection<?>[] collections = {
            new HashSet<String>(),
            new ArrayList<Integer>(),
            new HashMap<String, String>().values()
        };

        for (Collection<?> c : collections) {
            System.out.println(classfy(c));
        }
    }
}
```

위 코드의 출력 결과는 "그 외" 만 연달아 세 번 출력한다. 컴파일 타임에서는 for 문 안의 c는 항상 ```Collection<?>``` 타입이다.
이처럼 오버로딩이 혼란을 일으키지 않도록 프로그래밍해야 한다. 특히, 매개변수가 같은 다중정의는 피해야 한다. 헷갈릴 소지가 많다.
더불어 가변인수를 사용하는 메서드는 다중정의를 아예 하면 안된다.

다중정의를 하는 대신에 메서드 이름을 다르게 짓는 방법도 있다. ```ObjectOutputStream``` 클래스를 보면 다중정의 대신에 메서드의
이름을 다르게 지었다. ```writeBoolean(boolean)```, ```writeInt(int)``` 처럼 말이다. 짝꿍 클래스인 ```ObjectInputStream```은
```readBoolean()```, ```readInt()``` 처럼 짝에 맞는 메서드를 가지고 있다.

한편, 생성자의 경우는 이름을 다르게 지을 수 없다. 그렇기 때문에 두 번째 생성자부터는 무조건 다중정의를 하게 되는 셈이다.
생성자는 정적 팩터리를 사용하는 대안을 활용할 수 있다.

<div class="post_caption">일반적으로 매개변수 개수가 같을 때는 다중 정의를 피하는 것이 좋다.</div>

<br/>

# 아이템 53. 가변인수는 신중히 사용하라
> Use varargs judiciously

가변인수 메서드를 호출하면 인수의 개수와 길이가 같은 배열을 만들고 인수들을 만들어진 배열에 저장한 후에 가변인수 메서드에
전달해준다. 인수가 1개 이상이어야 할 때는 아래와 같이 가변인수 앞에 필수 매개변수를 받도록 하자.

```java
static int min(int firstArg, int... remainingArgs) {
    int min = firstArg;
    for (int arg : remainingArgs) {
        if (arg < min) {
            min = arg;
        }
    }
    return min;
}
```

하지만 가변인수는 성능에 해가 될 수 있기 때문에 사용할 때는 신중해야 한다. 가변인수 메서드가 호출될 때마다 배열을 새로
할당하고 초기화하기 때문이다. 따라서 아래와 같은 패턴으로 변경할 수도 있다.

```java
public void foo() {}
public void foo(int arg1) {}
public void foo(int arg1, arg2) {}
public void foo(int arg1, arg2, arg3) {}
public void foo(int arg1, arg2, arg3, int... restArg) {}
```

책에서는 메서드 호출의 95%가 3개 이하의 인수를 사용한다고 가정했다. 그렇기 때문에 가변인수는 5%의 호출을 담당한다.

<div class="post_caption">가변인수는 성능에 문제가 있을 수 있다. 신중히 사용하자.</div>

<br/>

# 아이템 54. null이 아닌, 빈 컬렉션이나 배열을 반환하라
> Return empty collections or arrays, not nulls

컬렉션이 빈 경우에 null을 반환하는 메서드를 자주 보았을 것이다.

```java
private final List<Cheese> cheesesInStock = ...;

public List<Cheese> getCheeses() {
    return cheesesInStock.isEmpty() ? null : new ArrayList<>(cheesesInStock);
}
```

이렇게 되는 경우 코드를 사용하는 클라이언트에서는 null을 방어하는 코드를 반드시 추가해주어야 한다.
null 반환과 빈 컨테이너 반환의 성능 차이는 신경 쓸 수준이 되지 않기 때문에 꼭 null 을 반환하지 않아도 된다.
빈 컬렉션과 배열은 새로 할당하지 않고도 반환할 수 있다.

```java
public List<Cheese> getCheeses() {
    return new ArrayList<>(cheesesInStock);
}
```

가능성이 낮지만 사용 패턴에 따라 빈 컬렉션 할당이 성능을 저하시킬 수 있다. 이럴 때는 매번 같은 불변 컬렉션을 반환하면 된다.

```java
public List<Cheese> getCheeses() {
    return cheesesInStock.isEmpty() ? Collections.emptyList() : new ArrayList<>(cheesesInStock);
}
```

배열의 경우도 마찬가지다. null 반환 대신에 길이가 0인 배열을 반환하면 된다. 그리고 컬렉션과 동일하게 빈 배열을 매번 새롭게
할당하지 않고 반환하는 방법도 있다.

```java
// 길이가 0인 배열 반환
public Cheese[] getCheeses() {
    return cheesesInStock.toArray(new Cheese[0]);
}

// 매번 새로 할당하지 않게 하는 방법
private static final Cheese[] EMPTY_CHEESE_ARRAY = new Cheese[0];


public Cheese[] getCheeses() {
    return cheesesInStock.toArray(EMPTY_CHEESE_ARRAY);
    // 아래와 같이 미리 할당하는 것은 오히려 성능을 떨어뜨릴 수 있다.
    // return cheesesInStock.toArray(new Cheese[cheesesInStock.size()]);
}
```



<br/>

# 아이템 55. 옵셔널 반환은 신중히 하라
> Return optionals judiciously

<br/>

# 아이템 56. 공개된 API 요소에는 항상 문서화 주석을 작성하라
> Write doc comments for all exposed API elements