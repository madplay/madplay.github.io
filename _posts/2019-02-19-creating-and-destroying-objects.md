---
layout:   post
title:    "[이펙티브 자바 3판] 2장. 객체 생성과 파괴"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Chapter 2. Creating and Destroying Objects"  
category: Java
comments: true
---

# 목차
- <a href="#아이템-1-생성자-대신-정적-팩터리-메서드를-고려하라">아이템 1. 생성자 대신 정적 팩터리 메서드를 고려하라</a>
- <a href="#아이템-2-생성자에-매개변수가-많다면-빌더를-고려하라">아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라</a> 
- <a href="#아이템-3-private-생성자나-열거-타입으로-싱글턴임을-보증하라">아이템 3. private 생성자나 열거 타입으로 싱글턴임을 보증하라</a>
- <a href="#아이템-4-인스턴스화를-막으려거든-private-생성자를-사용하라">아이템 4. 인스턴스화를 막으려거든 private 생성자를 사용하라</a>
- <a href="#아이템-5-자원을-직접-명시하지-말고-의존-객체-주입을-사용하라">아이템 5. 자원을 직접 명시하지 말고 의존 객체 주입을 사용하라</a>
- <a href="#아이템-6-불필요한-객체-생성을-피하라">아이템 6. 불필요한 객체 생성을 피하라</a>
- <a href="#아이템-7-다-쓴-객체-참조를-해체하라">아이템 7. 다 쓴 객체 참조를 해체하라</a>
- <a href="#아이템-8-finalize와-cleaner-사용을-피하라">아이템 8. finalize와 cleaner 사용을 피하라</a>
- <a href="#아이템-9-try-finally보다는-try-with-resources를-사용하라">아이템 9. try-finally보다는 try-with-resources를 사용하라</a>

<br/>

# 아이템 1. 생성자 대신 정적 팩터리 메서드를 고려하라
> Consider static factory methods instead of constructors

클래스의 인스턴스는 기본적으로 **public 생성자**를 통해서 얻을 수 있다.
하지만 생성자와 별도로 정적 팩터리 메서드(static factory method)를 사용하면 아래와 같은 장점을 얻을 수 있다.

## 정적 팩터리 메서드의 장점
### 이름을 가질 수 있다.
즉, 생성자처럼 클래스의 이름과 동일하지 않아도 된다. 예를 들어서 `BigInteger(int, int, Random)` 생성자와
정적 팩터리 메서드인 `BigInteger.probablePrime` 중에서 어느 쪽이 소수인 BigInteger 인스턴스를 반환한다는 의미를
더 잘 설명하는가?

또한 하나의 클래스에서 시그니처가 같은 생성자가 여러 개 필요할 것 같은 경우에는 생성자를 정적 팩터리 메서드로 바꿔보자.
여기서 **시그니처란 메서드의 이름과 매개변수의 리스트**를 말한다. 만약 A, B 메서드가 매개변수의 개수와 타입 그리고 순서가
모두 같으면 두 메서드의 시그니처는 같다고 말할 수 있다. 

<br>

### 매번 인스턴스를 새로 만들지 않아도 된다.
인스턴스를 미리 만들어두거나 생성된 인스턴스를 캐싱하여 재활용하는 방식으로 불필요한 객체 생성을 줄일 수 있다.
즉, 어느 시점에 어떤 인스턴스가 유효한지 제어할 수 있는 인스턴스 통제(instance-controlled) 클래스로 만들 수 있다.

<br>

### 반환 타입의 하위 타입 객체를 반환할 수 있는 능력이 있다.
반환할 객체의 클래스를 자유롭게 선택할 수 있는 ‘엄청난 유연성’을 선물한다. API를 만들 때 이 유연성을 응용하면 구현 클래스를
공개하지 않고도 그 객체를 반환할 수 있어 API를 작게 유지할 수 있다. API가 작아진 것은 물론 개념적인 무게,
즉 프로그래머가 API를 사용하기 위해 익혀야 하는 개념의 수와 난이도도 낮췄다.

<br>

### 입력 매개변수에 따라 매번 다른 클래스의 객체를 반환할 수 있다.
대표적으로 `EnumSet` 클래스의 경우 원소가 64개 이하면 long 변수 하나로 관리하는 `RegularEnumSet`을 반환하고
65개 이상이면 long 배열로 관리하는 `JumboEnumSet`을 반환한다.

<br>

## 정적 팩터리 메서드의 단점
### 정적 팩터리 메서드만 제공하는 클래스는 상속할 수 없다.
상속을 하려면 public 또는 protected 생성자가 필요하다.

<br>

### 생성자처럼 명확히 드러나지 않는다.
정적 팩터리 메서드는 일반 메서드일뿐 생성자처럼 Java docs에 명확히 표현되지 않는다.
따라서 인스턴스화를 하려고 했을 때 생성자가 없으면 정적 팩터리 메서드를 찾는 등의 개발자의 불편함이 생긴다. 
알려진 규약에 따라 짓는 식으로 문제를 완해해줘야 한다.

- **from:** 매개변수를 받아서 해당 타입의 인스턴스를 반환
  - `Date date = Date.from(instant);`
- **of:** 여러 매개변수를 받아서 인스턴스 반환
  - `Set<Rank> cards = EnumSet.of(JACK, QUEEN, KING);`
- **valueOf:** from과 of의 더 자세한 버전
  - `BigInteger prime = BigInteger.valueOf(Integer.MAX_VALUE);`
- **instance / getInstance:** 인스턴스를 반환하지만, 같은 인스턴스임을 보장하지 않는다.
  - `StackWalker luke = StackWalker.getInstance(options);`
- **create / newInstance:** 매번 새로운 인스턴스를 생성해 반환한다.
  - `Object newArray = Array.newInstance(classObject, arrayLen);`
- **getType:** getInstance와 같으나 생성할 클래스가 아닌 다른 클래스에 팩터리 메서드를 정의할 때 사용
  - `FileStore fs = Files.getFileStore(path);`
- **newType:** newInstance와 같으나 생성할 클래스가 아닌 다른 클래스에 팩터리 메서드를 정의할 때 사용
  - `BufferedReader br = Files.newBufferedReader(path);`
- **type:** getType과 newType의 간결한 버전
  - `List<Complaint> litany = Collections.list(someList);`

<div class="post_caption">정리하면, 무작정 public 생성자를 사용하는 습관은 버리자.</div>

<br><br>

# 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라
> Consider a builder when faced with many constructor parameters

정적 팩터리와 생성자는 선택적 매개변수가 많을 때 적절하게 대응하기 어렵다.

- 점층적인 생성자 패턴
```java
Person person = new Person("탱", 29, "010-1234-1234", "hello@gmail.com");
```

- 자바빈 패턴
```java
Person person = new Person();
person.setName("탱");
person.setAge(29);
person.setPhoneNumber("010-1234-1234");
person.setEmail("hello@gmail.com");
```

- **빌더 패턴**을 사용하면 점층적인 생성자 패턴의 안정성과 자바빈 패턴의 가독성을 함께할 수 있다.
```java
Person person = new Person().Builder("탱", 29)
            .phoneNumber("010-1234-1234")
            .email("hello@gmail.com")
            .build();
```

- <a href="/post/builder-when-faced-with-many-constructor-parameters" target="_blank">
더 자세한 내용은 링크 참고: [이펙티브 자바  3판] 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라</a>

<div class="post_caption">생성자나 정적 팩터리에 매개변수가 많다면 빌더 패턴을 선택하는 게 더 낫다.
매개변수 중 대부분이 필수가 아니거나 같은 타입이면 더욱 그렇다. </div>

<br><br>

# 아이템 3. private 생성자나 열거 타입으로 싱글턴임을 보증하라
> Enforce the singleton property with a private constructor or an enum type

**싱글톤(singleton)이란** 인스턴스를 오직 하나만 생성할 수 있는 클래스를 말하며 아래처럼 3가지 방법이 있다.

<br>

### public static final 필드를 사용하는 방식
생성자는 private 으로 감춰둔다. private 생성자는 `MadPlay.INSTANCE`를 초기화할 때 딱 한번만 호출된다.
```java
public class MadPlay {
    public static final MadPlay INSTANCE = new MadPlay();
    private MadPlay() { }
}
```

<br>

### 정적 팩터리 메서드를 제공하는 방식
싱글턴이라는 것이 명백하게 드러나고 차후 변경에도 매우 유연하다.
또한 정적 팩터리를 제네릭 싱글턴 팩터리로 만들 수 있으며 `MadPlay::getInstance`처럼 메서드 참조 방식으로 사용할 수 있다.
```java
public class MadPlay {
    private static final MadPlay INSTANCE = new MadPlay();
    private MadPlay() { }
    public static MadPlay getInstance() { return INSTANCE; }
}
```

하지만 위 두가지 방식의 경우 리플렉션 API를 사용하는 경우 private 생성자 호출에 의해 싱글톤이 깨질 수 있다.
또한 역직렬화할 때 여러 인스턴스가 생성될 수 있는데, 모든 필드를 `transient` 키워드로 선언하고 무조건 싱글톤 인스턴스인
`INSTANCE`를 반환하도록 `readResolve` 메서드(역직렬화시에 호출된다)를 수정하는 대처가 필요하다.

<br>

### Enum을 사용하는 방식
`public static final` 필드 방식과 비슷하지만 매우 간결하며,
위에서 살펴본 리플렉션, 직렬화로 인한 문제를 막아준다.
```java
public enum MadPlay {
    INSTANCE;
}
```

- <a href="/post/singleton-pattern" target="_blank">상세한 내용은 링크 참고: 싱글톤 패턴(Singleton Pattern)</a>

<div class="post_caption">private 생성자나 열거 타입으로 싱글턴임을 보증하라</div>

<br><br>

# 아이템 4. 인스턴스화를 막으려거든 private 생성자를 사용하라
> Enforce noninstantiability with a private constructor

생성자를 명시하지 않으면 컴파일러가 자동으로 기본 생성자를 만들어낸다. 따라서 인스턴스화를 막으려면 `private 생성자`를
명시적으로 생성해주어야 한다. 혹시라도 클래스 내부에서 생성자를 호출하지 않도록 오류를 던지는 것도 좋다.

```java
public class MadUtil {
    private MadUtil {
        throw new AssertionError();
    }
    // ... 생략
}
```

**추상 클래스**로 만드는 것은 자기 자신의 인스턴스화를 막을 수는 있지만 하위 클래스를 만들어 인스턴스화를 할 수 있기 때문에
완벽하게 **인스턴스화를 막을 수 없다.** 하지만 위와같이 생성자를 `private`으로 제한하면 상속도 방지된다.
모든 생성자는 명시적이든, 묵시적이든 상위 클래스의 생성자를 호출하는데 외부에 공개되어있지 않기 때문에 호출할 수가 없다.

<div class="post_caption">인스턴스화를 막는 최고의 방법은 private 생성자를 만드는 것이다.</div>

<br><br>

# 아이템 5. 자원을 직접 명시하지 말고 의존 객체 주입을 사용하라
> Prefer dependency injection to hardwiring resources

대부분의 클래스가 하나 이상의 자원에 의존한다. 이런 클래스를 정적 유틸리티 클래스로 구현하면 유연하지 않고 테스트하기도 어렵다.

```java
public class SpellChecker {
    private static final Lexicon dictionary = new KoreanDictionary();
    private SpellChecker() {} // 객체 생성을 방지한다.
    
    public static boolean isValid(String word) { /* 구현 생략 */ }
    public static List<String> suggestions(String type) { /* 구현 생략 */ }
}
```

유틸리티 클래스뿐만 아니라 싱글톤으로 구현하는 경우도 동일하다. 두 가지 모두 변경에 유연하게 대처하기 어렵다. 
만약에 다른 언어의 사전을 사용해야 한다면 어떻게 할 것인가? 간단한 방법으로 **인스턴스를 생성할 때 생성자에 필요한 자원을 넘겨**주면 된다.

```java
public class SpellChecker {
    private final Lexicon dictionary;
    
    public SpellChecker(Lexicon dictionary) {
        this.dictionary = Objects.requireNonNull(dictionary);
    }
    // 그 외 메서드 생략
}
```

불변을 보장하여 같은 자원을 사용하려는 여러 클라이언트가 의존 객체들을 안심하고 공유할 수 있다.
또한 생성자뿐만 아니라 정적 팩터리, 빌더 모두에 똑같이 응용할 수 있다.

더 나아가 생성자에 자원 팩터리를 넘겨줄 수도 있다. 팩터리는 호출할 때마다 특정 타입의 인스턴스를 반복해서 만들어주는 
객체를 말한다. 자바 8에서 등장한 `Supplier<T>` 를 이용할 수 있다.

```java
public SpellChecker(Supplier<? extends Lexicon> dicFactory) {
    this.dictionary = dicFactory.get();
}
```

<div class="post_caption">클래스가 하나 이상의 동작에 영향을 주는 자원에 의존한다면, 자원을 생성자 또는 정적 팩터리나 빌더에 넘겨주자</div>

<br><br>

# 아이템 6. 불필요한 객체 생성을 피하라
> Avoid creating unnecessary objects

생성자로 문자열을 만들어내는 경우 매번 새로운 String 인스턴스를 생성하게 된다.

- <a href="/post/java-string-literal-vs-string-object" target="_blank">링크: 자바의 String 객체와 String 리터럴</a>

```java
// 예시1 - 문자열 생성
String myId1 = "MadPlay";
String myId2 = "MadPlay";
System.out.println(myId1 == myId2); // true

// 예시2 - 생성자로 문자열 생성 
String myId3 = new String("MadPlay");
String myId4 = new String("MadPlay");
System.out.println(myId3 == myId4); // false
```

정적 팩터리 메서드에서도 불필요한 객체 생성을 줄일 수 있다. 예를 들어 `Boolean(String)` 생성자 대신에
`Boolean.valueOf(String)` 팩터리 메서드를 사용하는 것이 좋다. (자바 9에서 생성자는 Deprecated 되었다.)

생성 비용이 비싼 객체를 재사용하는 것도 중요하다. Pattern 인스턴스는 한 번 사용되고 바로 가비지가 된다.

```java
// AS-IS: 내부에서 생성되는 Pattern 인스턴스는 사용 후 가비지가 된다.
static boolean isTwoAndFourLengthKoreanWord(String s) {
    // 한글 2~4글자 단어 정규식
    return s.matches("[가-힣]{2,4}");
}

// TO-BE: Pattern 인스턴스를 만들어두고 메서드가 호출될 때마다 재사용한다.
private static final Pattern KOREAN_WORD = Pattern.compile("[가-힣]{2,4}");
static boolean isTwoAndFourLengthKoreanWord(String s) {
    return KOREAN_WORD.matcher(s).matches();
}
```

실제 작업은 뒷단 객체에 위임하고 자신은 제 2의 인터페이스 역할을 해주는 객체인 어댑터의 경우도 마찬가지이다.
뒷단 객체 외에는 관리할 상태가 없기때문에 뒷단 객체 하나당 하나의 어댑터만 있으면 된다.
예를 들어 Map 인터페이스의 `keySet` 메서드는 호출할 때마다 새로운 Set 인스턴스를 반환하지 않는다.

```java
Map<String, String> phoneBook = new HashMap<>();
phoneBook.put("김탱", "010-1234-1234");
phoneBook.put("MadPlay", "010-4321-4321");
Set<String> keySet1 = phoneBook.keySet();
Set<String> keySet2 = phoneBook.keySet();


System.out.println(keySet1 == keySet2); // true
System.out.println(keySet1.size() == keySet2.size()); // true
keySet1.remove("MadPlay");
System.out.println(phoneBook.size()); // 1
```

한변 기본 타입과 박싱된 기본 타입을 섞어 쓸 때 자동으로 상호 변환해주는 **오토 박싱(auto boxing)**을 통해서도
불필요한 객체가 만들어진다.

```java
// long이 아닌 Long으로 선언되었다.
// 불필요한 Long 인스턴스가 만들어질 것이다. (변수 i가 sum 변수에 더해질 때마다)
Long sum = 0L;
for (long i = 0; i <= Integer.MAX_VALUE; i++) {
    sum += i;
}
```

<div class="post_caption">불필요한 객체 생성을 피하자.</div>

<br><br>

# 아이템 7. 다 쓴 객체 참조를 해체하라
> Eliminate obsolete object references

자바는 C, C++ 처럼 직접 메모리를 관리하지 않는다. GC가 알아서 사용이 끝난 객체를 회수한다.
그렇다고 메모리 관리에 신경 쓰지 않아도 되는 것은 아니다. 특히 자기 메모리를 직접 관리하는 클래스면 메모리 누수에 주의해야 한다.

```java
public class MyStack {
    private Object[] elements;
    private int size = 0;
    
    public Object pop() {
        if(size ==0) {
            throw new EmptyStackException();
        }
        return elements[--size]; // 이곳이 문제다.
    }
    // ...생략
}
```

`pop` 메서드 내부에서 size를 감소시키고 있으나 스택에서 꺼내진 객체들을 가비지 컬렉터가 회수하지 않는다.
size 값보다 작은 elements 배열의 원소들로 구성된 **활성 영역** 밖의 참조들도 해당된다. 이런 경우 명시적으로 **null 처리**하면
참조를 해제할 수 있다.

```java
public Object pop() {
    if(size ==0) {
        throw new EmptyStackException();
    }
    Object result = elements[--size];
    elements[size] = null; // 참조 해제
    return result;
}
```

그렇다고 모든 객체를 다 쓰고나서 null 처리해야 하는 것은 아니다. 가장 좋은 방법은 그 참조를 담은 변수를 유효 범위(scope)
밖으로 밀어내는 것이다. 변수의 범위를 최소가 되게 정의했다면 자연스럽게 이뤄진다.

**캐시(Cache)**도 메모리 누수를 일으키는 주범이다. 객체 참조를 캐시에 넣고 해당 객체를 사용한 후에 잊는 경우 누수가 생긴다.
`WeakHasHMap`, `LinkedHashMap.removeEldestEntry` 등을 권장한다. 아래는 WeakHashMap을 테스트하는 간단한 예이다.

```java
// WeakHashMap는 내부적으로 Key를 WeakReference로 만든다.
// GC로그 출력은 아래와 같은 VM Options을 추가
// -XX:+PrintGC -XX:+PrintGCDetails (자바 9는 -Xlog:gc)
WeakHashMap<Integer, String> testMap = new WeakHashMap<>();
Integer testWeakKey1 = 185;
Integer testWeakKey2 = 189;
testMap.put(testWeakKey1, "testValue1");
testMap.put(testWeakKey2, "testValue2");

System.out.println("before call gc() : " + testMap.size()); // 2
testWeakKey1 = null;
System.gc(); // 물론 호출이 보장되지 않는다.
System.out.println("after call gc() : " + testMap.size()); // 동작했다면 1
```

`System.gc()` 메서드는 가비지 컬렉션 실행을 요청하는 메서드이지만, 반드시 실행을 보장하는 것은 아니다.
실행이 된다면 아래의 수행 결과처럼 testMap의 사이즈가 달라진 것을 확인할 수 있다.

```bash
before call gc() : 2
[GC (System.gc()) [PSYoungGen: 7864K->783K(76288K)] 7864K->791K(251392K), 0.0012243 secs] [Times: user=0.00 sys=0.00, real=0.00 secs] 
[Full GC (System.gc()) [PSYoungGen: 783K->0K(76288K)] [ParOldGen: 8K->667K(175104K)] 791K->667K(251392K), [Metaspace: 3103K->3103K(1056768K)], 0.0058476 secs] [Times: user=0.01 sys=0.00, real=0.00 secs] 
after call gc() : 1
Heap
 PSYoungGen      total 76288K, used 1748K [0x000000076ab00000, 0x0000000770000000, 0x00000007c0000000)
  eden space 65536K, 2% used [0x000000076ab00000,0x000000076acb5040,0x000000076eb00000)
  from space 10752K, 0% used [0x000000076eb00000,0x000000076eb00000,0x000000076f580000)
  to   space 10752K, 0% used [0x000000076f580000,0x000000076f580000,0x0000000770000000)
 ParOldGen       total 175104K, used 667K [0x00000006c0000000, 0x00000006cab00000, 0x000000076ab00000)
  object space 175104K, 0% used [0x00000006c0000000,0x00000006c00a6de8,0x00000006cab00000)
 Metaspace       used 3110K, capacity 4496K, committed 4864K, reserved 1056768K
  class space    used 341K, capacity 388K, committed 512K, reserved 1048576K
```

<a href="/post/java-garbage-collection-and-java-reference" target="_blank">
더 자세한 내용은 링크 참고: 자바 레퍼런스와 가비지 컬렉션(Java Reference & Garbage Collection)</a>

<div class="post_caption">메모리 누수에 주의하고 예방법을 익혀두자.</div>

<br><br>

# 아이템 8. finalize와 cleaner 사용을 피하라
> Avoid finalizers and cleaners

자바에서는 2가지의 객체 소멸자를 제공한다. 첫 번째로 `finalizer`인데, 예측할 수 없고 상황에 따라 위험할 수 있어
일반적으로 불필요하다. 두 번째로 `cleaner`가 있다. **Deprecated된 finalizer**의 대안으로 등장하여 덜 위험하지만,
여전히 예측할 수 없고, 일반적으로 불필요하며 느리다.

finalizer가 언제, 어떠한 스레드에서 실행되는지 알 수도 없고 finalizer의 동작 과정에서 발생한 예외는 무시되며
처리할 작업이 남았더라도 그 순간 종료되버리는 부작용도 있다. 그나마 cleaner를 사용하는 라이브러리는 자신의 스레드를
통제하기 때문에 이러한 문제가 발생되지는 않는다.

**그럼 대체 언제 쓸까?** 혹시나 `close` 메서드를 호출하지 않는 것에 대비한 안전망 역할을 한다.
실제로 `FileOutputStream`, `ThreadPoolExecutor` 등에는 안전망으로 동작하는 finalizer가 있다.

그리고 네이티브(native) 객체는 가비지 컬렉터가 회수하지 못한다. 자바 객체가 아니므로 가비지 컬렉터가 그 존재를 알지 못한다.
이럴 때 cleaner나 finalizer가 나서서 처리하기에 적당하다. 물론 성능 저하를 감당할 수 있고 네이티브 객체가 심각한 자원을
가지고 있지 않을 때에만 해당된다.

- <a href="/post/java-finalize" target="_blank">더 자세한 내용은 링크 참고: 자바 소멸자 finalize</a>

<div class="post_caption">그냥 사용하지 않는 것이 나은 것 같다.</div>

<br><br>

# 아이템 9. try-finally보다는 try-with-resources를 사용하라
> Prefer try-with-resources to try-finally

자바 라이브러리에는 `close()` 메서드를 통해 닫아야 하는 자원들이 있다. 자바 7이전에는 `try-finally`를 이용했다.

```java
public void someMethod() throws IOException {
    InputStream in = new FileInputStream("filePath");
    try {
        OutputStream out = new FileOutputStream("filePath");
        try {
            // do something
        } finally {
            out.close();
        }
    } finally {
        in.close();
    }
}
```

위 코드에서 예외는 try 블록과 finally 블록 모두에서 발생할 수 있다. 즉, close 메서드에서도 예외가 발생할 수 있는데
그러한 경우 try 블록 내에서 발생한 예외가 무시될 수 있다.

이러한 문제는 자바 7에서 등장한 `try-with-resources`구문을 사용하면 해결할 수 있다.
물론, `AutoCloseable` 인터페이스를 구현한 클래스에 대해서만 사용이 가능하며 여러 개의 자원도 한 번에 처리할 수 있다.

```java
public void someMethod() throws IOException {
    try (InputStream in = new FileInputStream("filePath");
         OutputStream out = new FileOutputStream("filePath")) {
        // do something
    }
}
```

더 나아가 자바 9 버전부터는 조금 더 향상된 `try-with-resources` 문장을 사용할 수 있다.
자원의 초기화를 try 문장 밖에서 한 경우에 그 변수를 try 문장 안에서 사용할 수 없었으나, 이제 그럴 필요가 없다. 

```java
public void someMethod() throws IOException {
    InputStream in = new FileInputStream("filePath");
    OutputStream out = new FileOutputStream("filePath");
    try (in; out) {
        // do something
    }
}
```

주의할 점은 사용할 변수가 `final`이거나 초기화 이후 절대 바뀌지 않는 `effectively final` 변수여야 한다.

<div class="post_caption">꼭 회수해야 하는 자원은 try-with-resources 문장을 사용하자.</div> 