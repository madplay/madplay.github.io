---
layout:   post
title:    "[이펙티브 자바 3판] 8장. 메서드"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter8: Methods"
category: Java
date: "2019-08-03 02:11:01"
comments: true
---

# 목차
- <a href="#아이템-49-매개변수가-유효한지-검사하라">아이템 49. 매개변수가 유효한지 검사하라</a>
- <a href="#아이템-50-적시에-방어적-복사본을-만들라">아이템 50. 적시에 방어적 복사본을 만들라</a>
- <a href="#아이템-51-메서드-시그니처를-신중히-설계하라">아이템 51. 메서드 시그니처를 신중히 설계하라</a>
- <a href="#아이템-52-다중정의는-신중히-사용하라">아이템 52: 다중정의는 신중히 사용하라</a>
- <a href="#아이템-53-가변인수는-신중히-사용하라">아이템 53. 가변인수는 신중히 사용하라</a>
- <a href="#아이템-54-null이-아닌-빈-컬렉션이나-배열을-반환하라">아이템 54. null이 아닌, 빈 컬렉션이나 배열을 반환하라</a>
- <a href="#아이템-55-옵셔널-반환은-신중히-하라">아이템 55. 옵셔널 반환은 신중히 하라</a>
- <a href="#아이템-56-공개된-api-요소에는-항상-문서화-주석을-작성하라">아이템 56. 공개된 API 요소에는 항상 문서화 주석을 작성하라</a>

<br>

# 아이템 49. 매개변수가 유효한지 검사하라
> Check parameters for validity

매개변수의 유효성 검사는 메서드 몸체가 시작되기 전에 해야하며 매개변수에 대한 제약사항은 문서화가 필요하다.
만일 유효성 검사를 제대로 하지 못하는 경우에는 어떻게 될까? 

메서드가 수행되는 중간에 모호한 오류가 발생할 수 있으며 행여나 수행되더라도 잘못된 결과가 반환될 수 있을 것이다.
최악의 경우에는 잘 수행되다가 다른 객체의 상태 변경으로 인해 미래의 알 수 없는 시점에 오류가 발생할 수도 있다.

`public`과 `protected` 메서드는 매개변수 값이 잘못됐을 때 던지는 예외를 문서화해야 한다. 클래스 수준 주석은
그 클래스의 모든 public 메서드에 적용되므로 훨씬 깔끔하다. `@Nullable`과 같은 어노테이션을 사용할 수도 있지만 표준은 아니다.
더불어 생성자 매개변수 검사도 클래스 불변식을 어기는 객체가 생성되지 않게 하기 위하여 꼭 필요하다. 

## 유효성 검사 방법
자바 7에 추가된 `requireNonNull` 메서드를 이용하면 조금 더 유연한 null 검사가 가능하다.

```java
public void someMethod(Integer val) {
    Integer integer = Objects.requireNonNull(val, "매개변수가 null 이네요?");
    System.out.println(integer);
}
```

위 메서드에 `null`을 입력하면 아래와 같은 오류가 발생한다.

```bash
Exception in thread "main" java.lang.NullPointerException: 매개변수가 null 이네요?
	at java.base/java.util.Objects.requireNonNull(Objects.java:246)
```

자바 9에서는 Objects에 범위 검사 기능도 가능해졌다. `checkFromIndexSize`, `checkFromToIndex`, `checkIndex` 라는
메서드인데 null 검사 메서드만큼 유연하지는 않다. 예외 메시지를 지정할 수 없고 리스트와 배열 전용으로 설계됐다.

```java
List<String> list = List.of("a", "b", "c");

// Exception in thread "main" java.lang.IndexOutOfBoundsException: 
//      Index 4 out of bounds for length 3
Objects.checkIndex(4, list.size());
```

private으로 공개되지 않은 메서드라면 개발자가 직접 호출되는 상황을 통제할 수 있다. 이럴 때는 `assert`를 사용하여
매개변수 유효성을 검사할 수 있다. 실행시에 assert를 수행하려면 인텔리제이 기준으로 VM Options에 `-ea` 또는 `--enableassertions`
를 넘겨주어야 한다. 값을 넘겨주지 않으면 무시된다. 넘어온 매개변수가 조건식을 참으로 만들지 않으면 `AssertionError`를 던진다.

```java
private void someMethod(int arr[], int length) {
    assert arr != null;
    assert length >= 0 && arr.length == length;

    // do something
}
```

## 유효성 검사가 필요 없는 경우
매개변수에 대한 유효성 검사가 꼭 필요하지 않는 경우도 있다. 유효성을 검사하는 비용이 지나치게 큰 경우 또는 계산 과정에서 암묵적으로
유효성 검사가 진행될 때이다. 예를 들어 `Collections.sort(List)`처럼 리스트를 정렬할 때는 정렬 과정에서 모든 객체가 상호 비교된다.
만일 비교할 수 없는 타입의 객체가 있으면 `ClassCastException`이 발생할 것이기 때문에 비교하기에 앞서 모든 원소를 검증하는 것은
불필요한 과정이 된다.

<div class="post_caption">매개변수는 메서드 코드 시작 부분에서 검사하자</div>

<br><br>

# 아이템 50. 적시에 방어적 복사본을 만들라
> Make defensive copies when needed

자바는 안전한 언어다. 하지만 클라이언트가 언제든지 불변식을 깨드릴 수 있다고 가정하고 방어적인 프로그래밍을 해야 한다.
클래스가 클라이언트로부터 받거나 클라이언트에게 반환하는 구성 요소가 가변적이라면 그 요소는 반드시 방어적으로 복사해야 한다.

- <a href="/post/make-defensive-copies-when-needed" target="_blank">
더 상세한 내용은 링크 참고: [이펙티브 자바 3판] 아이템 50. 적시에 방어적 복사본을 만들라</a>

<div class="post_caption">경우에 따라서 방어적 복사본을 만들어야 한다.</div>

<br><br>

# 아이템 51. 메서드 시그니처를 신중히 설계하라
> Design method signatures carefully

**메서드 이름은 신중히 지어야한다.** 표쥰 명명 규칙에 따라 지으며 긴 이름은 지양해야 한다. 애매하다면 자바 라이브러리 가이드를
참조해도 좋다. 같은 패키지에 속한 다른 이름들과 일관되게 짓는 것이 좋다.

**편의 메서드를 많이 만드는 것은 좋지 않다.** 너무 많은 메서드는 그에 따른 문서화, 유지보수, 테스트를 요구한다.
메서드의 매개변수 목록도 4개 이하가 적절하며 특히 같은 타입의 매개변수 여러 개가 연달아 나오는 것은 좋지 않다.
매개변수를 줄일 수 있는 방법들을 살펴보자.

**여러 메서드로 나눠본다.** 예를 들어 리스트에서 특정 요소를 찾는다고 가정해보자. 이 기능을 하나의 메서드로 구현하려면
리스트의 시작과 끝 그리고 찾을 요소까지 총 3개의 매개변수가 필요하다. 하지만 List 인터페이스는 `subList`와 `indexOf`
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

- <a href="/post/creating-and-destroying-objects#아이템-2-생성자에-매개변수가-많다면-빌더를-고려하라" target="_blank">
링크 참고: [이펙티브 자바 3판] 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라</a>

한편 **파라미터의 타입으로는 클래스보다는 인터페이스 형태가 낫다.** 예를 들어 `HashMap` 보다는 `Map`을 사용하는
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

<br><br>

# 아이템 52: 다중정의는 신중히 사용하라
> Use overloading judiciously

**재정의(overriding, 오버라이딩)**를 한 메서드는 실행 중에 동적으로 선택되지만 **다중 정의(overloading, 오버로딩)**된 메서드의
호출 여부는 컴파일 타임에 정해진다. 그리고 이러한 다중 정의 메서드는 개발자가 기대한 것처럼 동작하지 않는 경우가 있다.

- <a href="/post/method-overriding-vs-method-overloading-in-java" target="_blank">참고 링크: 자바 오버라이딩과 오버로딩</a>

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

위 코드의 출력 결과는 "그 외" 만 연달아 세 번 출력한다. 컴파일 타임에서는 for 문 안의 c는 항상 `Collection<?>` 타입이다.
이처럼 오버로딩이 혼란을 일으키지 않도록 프로그래밍해야 한다. 특히, 매개변수가 같은 다중정의는 피해야 한다. 헷갈릴 소지가 많다.
더불어 가변인수를 사용하는 메서드는 다중정의를 아예 하면 안된다.

다중정의를 하는 대신에 메서드 이름을 다르게 짓는 방법도 있다. `ObjectOutputStream` 클래스를 보면 다중정의 대신에 메서드의
이름을 다르게 지었다. `writeBoolean(boolean)`, `writeInt(int)` 처럼 말이다. 짝꿍 클래스인 `ObjectInputStream`은
`readBoolean()`, `readInt()` 처럼 짝에 맞는 메서드를 가지고 있다.

한편, 생성자의 경우는 이름을 다르게 지을 수 없다. 그렇기 때문에 두 번째 생성자부터는 무조건 다중정의를 하게 되는 셈이다.
생성자는 정적 팩터리를 사용하는 대안을 활용할 수 있다.

<div class="post_caption">일반적으로 매개변수 개수가 같을 때는 다중 정의를 피하는 것이 좋다.</div>

<br><br>

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

<br><br>

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

<div class="post_caption">null이 아닌, 빈 배열이나 컬렉션을 반환하라.</div>

<br><br>

# 아이템 55. 옵셔널 반환은 신중히 하라
> Return optionals judiciously

메서드가 특정 조건에서 값을 반환할 수 없을 때를 생각해보자. 자바 8 전에는 예외를 던지거나 null을 반환했다.
하지만 예외는 진짜 예외적인 경우에만 사용해야 하며, null은 `NullPointerException`과 null 처리 코드를 만들게 한다.

하지만 자바 8 이후로는 조금 다르다. `Optional<T>`이 등장했기 때문인데, null이 아닌 T 타입 참조를 하나 담거나 또는
아무것도 담지 않는 객체이다. 원소를 최대 1개 가질 수 있는 '불변' 컬렉션이며, 보다 null-safe한 코드를 작성할 수 있다.

```java
// 옵셔널을 사용하지 않았을 때
public static <E extends Comparable<E>> E max(Collection<E> c) {
    if (c.isEmpty()) {
        throw new IllegalArgumentException("빈 컬렉션");
    }        

    E result = null;
    for (E e : c) {
        if (result == null || e.compareTo(result) > 0)
            result = Objects.requireNonNull(e);
    }
    return result;
}

// 옵셔널 + 스트림을 사용할 때
public static <E extends Comparable<E>>
        Optional<E> max(Collection<E> c) {
    return c.stream().max(Comparator.naturalOrder());
}
```

## Optional 활용
### 기본값을 설정한다.
옵셔널을 반환하는 메서드로부터 원하는 값을 받지 못했을 때, 기본 값을 설정할 수 있다.

```java
String lastWordInLexicon = max(words).orElse("단어 없음...");
```

### 원하는 예외를 던진다.
값이 없는 경우 원하는 예외를 던질 수 있다. 한편 여기서는 실제 예외가 아니라 예외 팩터리를 건넸다.
이렇게 하면 예외가 실제 발생하지 않는 한 예외 생성 비용이 들지 않는다.

```java
Toy myToy = max(toys).orElseThrow(TemperTantrumException::new);
```

### 항상 값이 채워짐을 가정한다.
옵셔널에 항상 값이 있음을 확신할 때 사용해야 한다. 값이 없다면 `NoSuchElementException`이 발생한다.

```java
Element lastNobleGas = max(Elements.NOBLE_GASES).get();
```

### 기본값 설정 비용이 큰 경우
기본값 설정 비용이 커서 부담이라면 `orElseGet`을 사용해보자. 값이 처음 필요할 때 `Supplier<T>`를 사용하여 생성하므로
초기 설정 비용을 낮출 수 있다.

```java
Connection conn = getConnection(dataSource).orElseGet(() -> getLocalConn());
```

## 사용시 주의점
컬렉션, 스트림, 배열, 옵셔널 같은 컨테이너를 옵셔널로 감싸면 안된다. 그러니까 `Optional<List<T>>`를 반환하는 것보다
그저 빈 리스트 `List<T>`를 반환하는 것이 낫다. 빈 컨테이너를 그대로 반환하면 클라이언트에서는 옵셔널 처리 코드를 만들지
않아도 되기 때문이다.

한편 옵셔널을 컬렉션의 키, 값, 원소 그리고 배열의 원소로 사용하는 것은 좋지 않다. `Map`에 사용하는 것을 예로 들어보자.
맵 안에 키가 없다는 정의가 2가지가 된다. "키 자체가 없는 경우"와 "키는 있지만 속이 빈 옵셔널인 경우" 이렇게 모호해진다.

<div class="post_caption">성능에 민감한 메서드라면 null을 반환하거나 예외를 던지는 것이 낫다.</div>

<br><br>

# 아이템 56. 공개된 API 요소에는 항상 문서화 주석을 작성하라
> Write doc comments for all exposed API elements

API의 사용성을 높이려면 잘 작성된 문서도 있어야 한다. 자바에서 제공하는 자바독(javadoc)은 소스 코드 파일에서 문서화
주석(document comment)을 취합해서 API 문서로 만들어준다.

올바르게 문서화하려면 공개된 모든 클래스, 인터페이스, 메서드 필드 선언에 문서화 주석을 달아야 한다. 메서드용 문서화 주석에는
해당 메서드와 클라이언트 사이의 규약을 명료하게 기술해야 하는데, 상속용이 아니라면 어떻게 동작하는지가 아닌 무엇을 하는지
기술해야 한다.

## 작성 가이드

태그 | 용도 | 가이드
|:--|:--|:--|
@param | 모든 매개변수 | 관례상 명사구를 사용하며 마침표 없이 작성한다.
@return | void가 아닌 반환 | 관례상 명사구를 사용하며 마침표 없이 작성한다. <br/> 메서드 설명과 같을 때는 생략할 수 있다.
@throws | 발생할 가능성 있는 모든 예외 | 관례상 마침표 없이 작성한다.
@code | 코드용 폰트로 렌더링 | HTML 요소나 다른 자바독 태그를 무시한다.
@implSpec | 구현스펙 안내 | 해당 메서드와 하위 클래스 사이의 계약 설명
@literal | HTML 요소 무시 | @code와 다르게 코드용 폰트로 렌더링하지 않는다.
@index | 색인화 | 자바 9에서 추가되었으며 지정한 용어를 색인화할 수 있다.
@summary | 요약 설명 | 해당 설명에 대한 요약(자바 10부터)

## 일반 가이드
- 가독성 좋게 작성해야 한다.
  - `{@literal |r| < 1}` VS `|r| {@literal < } 1`
  - `@literal`이 필요한 곳은 `<` 한 곳이지만 가독성을 위해 문장 전체를 감싼다.
- 패키지 설명 문서 주석은 `package-info.java`에 작성한다.
- 모듈 설명은 `module-info.java` 파일에 작성한다.
- 제네릭 타입은 모든 타입 매개변수에 주석을 달아준다.
- 열거형 타입은 상수에도 주석을 달아준다.
- 애너테이션 타입은 멤버들에도 주석을 달아준다.
- 클래스 혹은 정적 메서드는 스레드 안전 수준을 반드시 포함한다.
- 직렬화 할 수 있는 클래스라면 직렬화 형태도 기술한다.
- 메서드 주석은 상속할 수 있다. 주석이 없는 경우 상위 클래스를 참고한다.
  - 클래스 주석보다는 인터페이스 주석이 더 우선순위가 높다.

<div class="post_caption">문서화 주석은 API를 문서화하는 가장 좋은 방법이다.</div>