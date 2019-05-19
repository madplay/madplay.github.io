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

- <a href="/post/builder-when-faced-with-many-constructor-parameters">
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

생성자를 명시하지 않으면 컴파일러가 자동으로 기본 생성자를 만들어낸다. 따라서 인스턴스화를 막으려면 ```private 생성자```를
명시적으로 생성해주어야 한다. 혹시라도 클래스 내부에서 생성자를 호출하지 않도록 오류를 던지는 것도 좋다.

<pre class="line-numbers"><code class="language-java" data-start="1">public class MadUtil {
    private MadUtil {
        throw new AssertionError();
    }
    // ... 생략
}
</code></pre>

**추상 클래스**로 만드는 것은 자기 자신의 인스턴스화를 막을 수는 있지만 하위 클래스를 만들어 인스턴스화를 할 수 있기 때문에
완벽하게 **인스턴스화를 막을 수 없다.** 하지만 위와같이 생성자를 ```private```으로 제한하면 상속도 방지된다.
모든 생성자는 명시적이든, 묵시적이든 상위 클래스의 생성자를 호출하는데 외부에 공개되어있지 않기 때문에 호출할 수가 없다.

<div class="post_caption">인스턴스화를 막는 최고의 방법은 private 생성자를 만드는 것이다.</div>

<br/><br/>

> ## 아이템 5. 자원을 직접 명시하지 말고 의존 객체 주입을 사용하라
Prefer dependency injection to hardwiring resources

대부분의 클래스가 하나 이상의 자원에 의존한다. 이런 클래스를 정적 유틸리티 클래스로 구현하면 유연하지 않고 테스트하기도 어렵다.

<pre class="line-numbers"><code class="language-java" data-start="1">public class SpellChecker {
    private static final Lexicon dictionary = new KoreanDictionary();
    private SpellChecker() {} // 객체 생성을 방지한다.
    
    public static boolean isValid(String word) { /* 구현 생략 */ }
    public static List&lt;String> suggestions(String type) { /* 구현 생략 */ }
}
</code></pre>

유틸리티 클래스뿐만 아니라 싱글톤으로 구현하는 경우도 동일하다. 두 가지 모두 변경에 유연하게 대처하기 어렵다. 
만약에 다른 언어의 사전을 사용해야 한다면 어떻게 할 것인가? 간단한 방법으로 **인스턴스를 생성할 때 생성자에 필요한 자원을 넘겨**주면 된다.

<pre class="line-numbers"><code class="language-java" data-start="1">public class SpellChecker {
    private final Lexicon dictionary;
    
    public SpellChecker(Lexicon dictionary) {
        this.dictionary = Objects.requireNonNull(dictionary);
    }
    // 그 외 메서드 생략
}
</code></pre>

불변을 보장하여 같은 자원을 사용하려는 여러 클라이언트가 의존 객체들을 안심하고 공유할 수 있다.
또한 생성자뿐만 아니라 정적 팩터리, 빌더 모두에 똑같이 응용할 수 있다.

더 나아가 생성자에 자원 팩터리를 넘겨줄 수도 있다. 팩터리는 호출할 때마다 특정 타입의 인스턴스를 반복해서 만들어주는 
객체를 말한다. 자바 8에서 등장한 ```Supplier<T>``` 를 이용할 수 있다.

<pre class="line-numbers"><code class="language-java" data-start="1">public SpellChecker(Supplier&lt;? extends Lexicon> dicFactory) {
    this.dictionary = dicFactory.get();
}
</code></pre>

<div class="post_caption">클래스가 하나 이상의 동작에 영향을 주는 자원에 의존한다면,
자원을 생성자(또는 정적 팩터리나 빌더)에 넘겨주자</div>

<br/><br/>

> ## 아이템 6. 불필요한 객체 생성을 피하라
Avoid creating unnecessary objects

생성자로 문자열을 만들어내는 경우 매번 새로운 String 인스턴스를 생성하게 된다.

<a href="/post/java-string-literal-vs-string-object" target="_blank">링크: 자바의 String 객체와 String 리터럴</a>

<pre class="line-numbers"><code class="language-java" data-start="1">// 예시1 - 문자열 생성
String myId1 = "MadPlay";
String myId2 = "MadPlay";
System.out.println(myId1 == myId2); // true

// 예시2 - 생성자로 문자열 생성 
String myId3 = new String("MadPlay");
String myId4 = new String("MadPlay");
System.out.println(myId3 == myId4); // false
</code></pre>

정적 팩터리 메서드에서도 불필요한 객체 생성을 줄일 수 있다. 예를 들어 ```Boolean(String)``` 생성자 대신에
```Boolean.valueOf(String)``` 팩터리 메서드를 사용하는 것이 좋다. (자바 9에서 생성자는 Deprecated 되었다.)

생성 비용이 비싼 객체를 재사용하는 것도 중요하다. Pattern 인스턴스는 한 번 사용되고 바로 가비지가 된다.

<pre class="line-numbers"><code class="language-java" data-start="1">// AS-IS: 내부에서 생성되는 Pattern 인스턴스는 사용 후 가비지가 된다.
static boolean isTwoAndFourLengthKoreanWord(String s) {
    // 한글 2~4글자 단어 정규식
    return s.matches("[가-힣]{2,4}");
}

// TO-BE: Pattern 인스턴스를 만들어두고 메서드가 호출될 때마다 재사용한다.
private static final Pattern KOREAN_WORD = Pattern.compile("[가-힣]{2,4}");
static boolean isTwoAndFourLengthKoreanWord(String s) {
    return KOREAN_WORD.matcher(s).matches();
}
</code></pre>

실제 작업은 뒷단 객체에 위임하고 자신은 제 2의 인터페이스 역할을 해주는 객체인 어댑터의 경우도 마찬가지이다.
뒷단 객체 외에는 관리할 상태가 없기때문에 뒷단 객체 하나당 하나의 어댑터만 있으면 된다.
예를 들어 Map 인터페이스의 ```keySet``` 메서드는 호출할 때마다 새로운 Set 인스턴스를 반환하지 않는다.

<pre class="line-numbers"><code class="language-java" data-start="1">Map&lt;String, String> phoneBook = new HashMap&lt;>();
phoneBook.put("김탱", "010-1234-1234");
phoneBook.put("MadPlay", "010-4321-4321");
Set&lt;String> keySet1 = phoneBook.keySet();
Set&lt;String> keySet2 = phoneBook.keySet();


System.out.println(keySet1 == keySet2); // true
System.out.println(keySet1.size() == keySet2.size()); // true
keySet1.remove("MadPlay");
System.out.println(phoneBook.size()); // 1
</code></pre>

한변 기본 타입과 박싱된 기본 타입을 섞어 쓸 때 자동으로 상호 변환해주는 **오토 박싱(auto boxing)**을 통해서도
불필요한 객체가 만들어진다.

<pre class="line-numbers"><code class="language-java" data-start="1">// long이 아닌 Long으로 선언되었다.
// 불필요한 Long 인스턴스가 만들어질 것이다. (변수 i가 sum 변수에 더해질 때마다)
Long sum = 0L;
for (long i = 0; i <= Integer.MAX_VALUE; i++) {
    sum += i;
}
</code></pre>

<div class="post_caption">불필요한 객체 생성을 피하자.</div>

<br/><br/>

> ## 아이템 7. 다 쓴 객체 참조를 해체하라
Eliminate obsolete object references

자바는 C, C++ 처럼 직접 메모리를 관리하지 않는다. GC가 알아서 사용이 끝난 객체를 회수한다.
그렇다고 메모리 관리에 신경 쓰지 않아도 되는 것은 아니다. 특히 자기 메모리를 직접 관리하는 클래스면 메모리 누수에 주의해야 한다.

<pre class="line-numbers"><code class="language-java" data-start="1">public class MyStack {
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
</code></pre>

```pop``` 메서드 내부에서 size를 감소시키고 있으나 스택에서 꺼내진 객체들을 가비지 컬렉터가 회수하지 않는다.
size 값보다 작은 elements 배열의 원소들로 구성된 **활성 영역** 밖의 참조들도 해당된다. 이런 경우 명시적으로 **null 처리**하면
참조를 해제할 수 있다.

<pre class="line-numbers"><code class="language-java" data-start="1">public Object pop() {
    if(size ==0) {
        throw new EmptyStackException();
    }
    Object result = elements[--size];
    elements[size] = null; // 참조 해제
    return result;
}
</code></pre>

그렇다고 모든 객체를 다 쓰고나서 null 처리해야 하는 것은 아니다. 가장 좋은 방법은 그 참조를 담은 변수를 유효 범위(scope)
밖으로 밀어내는 것이다. 변수의 범위를 최소가 되게 정의했다면 자연스럽게 이뤄진다.

**캐시(Cache)**도 메모리 누수를 일으키는 주범이다. 객체 참조를 캐시에 넣고 해당 객체를 사용한 후에 잊는 경우 누수가 생긴다.
```WeakHasHMap```, ```LinkedHashMap.removeEldestEntry``` 등을 권장한다. 아래는 WeakHashMap을 테스트하는 간단한 예이다.

<pre class="line-numbers"><code class="language-java" data-start="1">// WeakHashMap가 내부적으로 Key 객체를
WeakReference로 만드는 것을 표현하기 위해 명시적으로...
WeakHashMa&lt;<WeakReference, String> phoneCacheMap = new WeakHashMap&lt;>();
WeakReference&lt;String> weakNameKey1 = new WeakReference&lt;>("김탱");
WeakReference&lt;String> weakNameKey2 = new WeakReference&lt;>("MadPlay");

phoneCacheMap.put(weakNameKey1, "010-1234-1234");
phoneCacheMap.put(weakNameKey2, "010-4321-4321");
System.out.println(phoneCacheMap.size()); // 2

weakNameKey1 = null;
System.gc(); // 물론 호출이 보장되지 않는다.
System.out.println(phoneCacheMap.size()); // gc가 동작한다면 사이즈가 줄어서 1
</code></pre>

```System.gc()``` 메서드는 가비지 컬렉션 실행을 요청하는 메서드이지만, 반드시 실행을 보장하는 것은 아니다.

<a href="/post/java-garbage-collection-and-java-reference" target="_blank">
링크: 자바 레퍼런스와 가비지 컬렉션(Java Reference & Garbage Collection)</a>

<div class="post_caption">메모리 누수에 주의하고 예방법을 익혀두자.</div>

<br/><br/>

> ## 아이템 8. finalize와 cleaner 사용을 피하라
Avoid finalizers and cleaners

<br/><br/>

> ## 아이템 9. try-finally보다는 try-with-resources를 사용하라
Prefer try-with-resources to try-finally