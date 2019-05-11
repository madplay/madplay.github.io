---
layout:   post
title:    "[이펙티브 자바 3판] 2장. 객체 생성과 파괴"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "Effective Java 3th Edition: Chapter2. Creating and Destroying Objects"  
category: Java
comments: true
---

<hr/>

> ## 목록

- <a href="#아이템-1-생성자-대신-정적-팩터리-메서드를-고려하라">아이템 1. 생성자 대신 정적 팩터리 메서드를 고려하라</a>
- <a href="#아이템-2-생성자에-매개변수가-많다면-빌더를-고려하라">아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라</a> 
- <a href="#아이템-3-private-생성자나-열거-타입으로-싱글턴임을-보증하라">아이템 3. private 생성자나 열거 타입으로 싱글턴임을 보증하라</a>
- <a href="#아이템-4-인스턴스화를-막으려거든-private-생성자를-사용하라">아이템 4. 인스턴스화를 막으려거든 private 생성자를 사용하라</a>
- <a href="#아이템-5-자원을-직접-명시하지-말고-의존-객체-주입을-사용하라">아이템 5. 자원을 직접 명시하지 말고 의존 객체 주입을 사용하라</a>
- <a href="#아이템-6-불필요한-객체-생성을-피하라">아이템 6. 불필요한 객체 생성을 피하라</a>
- <a href="#아이템-7-다-쓴-객체-참조를-해체하라">아이템 7. 다 쓴 객체 참조를 해체하라</a>
- <a href="#아이템-8-finalize와-cleaner-사용을-피하라">아이템 8. finalize와 cleaner 사용을 피하라</a>
- <a href="#아이템-9-try-finally보다는-try-with-resources를-사용하라">아이템 9. try-finally보다는 try-with-resources를 사용하라</a>

<br/><br/>

> ## 아이템 1. 생성자 대신 정적 팩터리 메서드를 고려하라
Consider static factory methods instead of constructors

클래스의 인스턴스는 기본적으로 **public 생성자**를 통해서 얻을 수 있다.
하지만 생성자와 별도로 정적 팩터리 메서드(static factory method)를 사용하면 아래와 같은 장점을 얻을 수 있다.

- **첫 번째, 이름을 가질 수 있다.** 
즉, 생성자처럼 클래스의 이름과 동일하지 않아도 된다. 예를 들어서 ```BigInteger(int, int, Random)``` 생성자와
정적 팩터리 메서드인 ```BigInteger.probablePrime``` 중에서 어느 쪽이 소수인 BigInteger 인스턴스를 반환한다는 의미를
더 잘 설명하는가? <br/><br/>
또한 하나의 클래스에서 시그니처가 같은 생성자가 여러 개 필요할 것 같은 경우에는 생성자를 정적 팩터리 메서드로 바꿔보자.
여기서 **시그니처란 메서드의 이름과 매개변수의 리스트**를 말한다. 만약 A, B 메서드가 매개변수의 개수와 타입 그리고 순서가
모두 같으면 두 메서드의 시그니처는 같다고 말할 수 있다. 

- **두 번째, 매번 인스턴스를 새로 만들지 않아도 된다.**
인스턴스를 미리 만들어두거나 생성된 인스턴스를 캐싱하여 재활용하는 방식으로 불필요한 객체 생성을 줄일 수 있다.
즉, 어느 시점에 어떤 인스턴스가 유효한지 제어할 수 있는 인스턴스 통제(instance-controlled) 클래스로 만들 수 있다.

- **세 번째, 반환 타입의 하위 타입 객체를 반환할 수 있는 능력이 있다.** 
반환할 객체의 클래스를 자유롭게 선택할 수 있는 ‘엄청난 유연성’을 선물한다. API를 만들 때 이 유연성을 응용하면 구현 클래스를
공개하지 않고도 그 객체를 반환할 수 있어 API를 작게 유지할 수 있다. API가 작아진 것은 물론 개념적인 무게,
즉 프로그래머가 API를 사용하기 위해 익혀야 하는 개념의 수와 난이도도 낮췄다.

- **네 번째, 입력 매개변수에 따라 매번 다른 클래스의 객체를 반환할 수 있다.**
대표적으로 ```EnumSet``` 클래스의 경우 원소가 64개 이하면 long 변수 하나로 관리하는 ```RegularEnumSet```을 반환하고
65개 이상이면 long 배열로 관리하는 ```JumboEnumSet```을 반환한다.

그렇다면 정적 팩터리 메서드를 사용하는 데 있어서 단점은 없을까?

- **첫 번째, 정적 팩터리 메서드만 제공하는 클래스는 상속할 수 없다.**
상속을 하려면 public 또는 protected 생성자가 필요하다.

- **두 번째, 생성자처럼 명확히 드러나지 않는다.**
정적 팩터리 메서드는 일반 메서드일뿐 생성자처럼 Java docs에 명확히 표현되지 않는다.
따라서 인스턴스화를 하려고 했을 때 생성자가 없으면 정적 팩터리 메서드를 찾는 등의 개발자의 불편함이 생긴다. 
알려진 규약에 따라 짓는 식으로 문제를 완해해줘야 한다.
  - **from:** 매개변수를 받아서 해당 타입의 인스턴스를 반환
    - ```Date date = Date.from(instant);```
  - **of:** 여러 매개변수를 받아서 인스턴스 반환
    - ```Set&lt;Rank> cards = EnumSet.of(JACK, QUEEN, KING);```
  - **valueOf:** from과 of의 더 자세한 버전
    - ```BigInteger prime = BigInteger.valueOf(Integer.MAX_VALUE);```
  - **instance / getInstance:** 인스턴스를 반환하지만, 같은 인스턴스임을 보장하지 않는다.
    - ```StackWalker luke = StackWalker.getInstance(options);```
  - **create / newInstance:** 매번 새로운 인스턴스를 생성해 반환한다.
    - ```Object newArray = Array.newInstance(classObject, arrayLen);```
  - **getType:** getInstance와 같으나 생성할 클래스가 아닌 다른 클래스에 팩터리 메서드를 정의할 때 사용
    - ```FileStore fs = Files.getFileStore(path);```
  - **newType:** newInstance와 같으나 생성할 클래스가 아닌 다른 클래스에 팩터리 메서드를 정의할 때 사용
    - ```BufferedReader br = Files.newBufferedReader(path);```
  - **type:** getType과 newType의 간결한 버전
    - ```List<Complaint> litany = Collections.list(someList);```

<div class="post_caption">정리하면, 무작정 public 생성자를 사용하는 습관은 버리자.</div>



<br/><br/>

> ## 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라
Consider a builder when faced with many constructor parameters

정적 팩터리와 생성자는 선택적 매개변수가 많을 때 적절하게 대응하기 어렵다.

- 점층적인 생성자 패턴
<pre class="line-numbers"><code class="language-java" data-start="1">Person person = new Person("탱", 29, "010-1234-1234", "hello@gmail.com");
</code></pre>

- 자바빈 패턴
<pre class="line-numbers"><code class="language-java" data-start="1">Person person = new Person();
person.setName("탱");
person.setAge(29);
person.setPhoneNumber("010-1234-1234");
person.setEmail("hello@gmail.com");
</code></pre>

**빌더 패턴**을 사용하면 점층적인 생성자 패턴의 안정성과 자바빈 패턴의 가독성을 함께할 수 있다.

<pre class="line-numbers"><code class="language-java" data-start="1">Person person = new Person().Builder("탱", 29)
            .phoneNumber("010-1234-1234")
            .email("hello@gmail.com")
            .build();
</code></pre>

- <a href="https://madplay.github.io/post/builder-when-faced-with-many-constructor-parameters">
더 상세한 내용은 링크 참고: 이펙티브 자바 2: 생성자에 매개변수가 많다면 빌더를 고려하라</a>

<div class="post_caption">생성자나 정적 팩터리에 매개변수가 많다면 빌더 패턴을 선택하는 게 더 낫다.
매개변수 중 대부분이 필수가 아니거나 같은 타입이면 더욱 그렇다. </div>

<br/><br/>

> ## 아이템 3. private 생성자나 열거 타입으로 싱글턴임을 보증하라
Enforce the singleton property with a private constructor or an enum type

싱글톤(singleton)이란 인스턴스를 오직 하나만 생성할 수 있는 클래스를 말하며 아래처럼 3가지 방법이 있다.

- **public static final 필드**를 사용하는 방식이 있다. 생성자는 private 으로 감춰둔다.
private 생성자는 ```MadPlay.INSTANCE```를 초기화할 때 딱 한번만 호출된다.
<pre class="line-numbers"><code class="language-java" data-start="1">public class MadPlay {
    public static final MadPlay INSTANCE = new MadPlay();
    private MadPlay() { }
}
</code></pre>

<br/>

- **정적 팩터리 메서드**를 제공하는 방식이 있다. 싱글턴이라는 것이 명백하게 드러나고 차후 변경에도 매우 유연하다.
또한 정적 팩터리를 제네릭 싱글턴 팩터리로 만들 수 있으며 ```MadPlay::getInstance```처럼 메서드 참조 방식으로 사용할 수 있다.

<pre class="line-numbers"><code class="language-java" data-start="1">public class MadPlay {
    private static final MadPlay INSTANCE = new MadPlay();
    private MadPlay() { }
    public static MadPlay getInstance() { return INSTANCE; }
}
</code></pre>

하지만 위 두가지 방식의 경우 리플렉션 API를 사용하는 경우 private 생성자 호출에 의해 싱글톤이 깨질 수 있다.
또한 역직렬화할 때 여러 인스턴스가 생성될 수 있는데, 모든 필드를 ```transient``` 키워드로 선언하고 무조건 싱글톤 인스턴스인
```INSTANCE```를 반환하도록 ```readResolve``` 메서드(역직렬화시에 호출된다)를 수정하는 대처가 필요하다.

<br/>

- **Enum**을 사용하는 방식이 있다. 

```public static final``` 필드 방식과 비슷하지만 매우 간결하며, 위에서 살펴본 리플렉션, 직렬화로 인한 문제를 막아준다.

<pre class="line-numbers"><code class="language-java" data-start="1">public enum MadPlay {
    INSTANCE;
}
</code></pre>

- <a href="/post/singleton-pattern" target="_blank">링크: 싱글톤 패턴(Singleton Pattern)</a>

<div class="post_caption">private 생성자나 열거 타입으로 싱글턴임을 보증하라</div>

<br/><br/>

> ## 아이템 4. 인스턴스화를 막으려거든 private 생성자를 사용하라
Enforce noninstantiability with a private constructor

<br/><br/>

> ## 아이템 5. 자원을 직접 명시하지 말고 의존 객체 주입을 사용하라
Prefer dependency injection to hardwiring resources

<br/><br/>

> ## 아이템 6. 불필요한 객체 생성을 피하라
Avoid creating unnecessary objects

<br/><br/>

> ## 아이템 7. 다 쓴 객체 참조를 해체하라
Eliminate obsolete object references

<br/><br/>

> ## 아이템 8. finalize와 cleaner 사용을 피하라
Avoid finalizers and cleaners

<br/><br/>

> ## 아이템 9. try-finally보다는 try-with-resources를 사용하라
Prefer try-with-resources to try-finally