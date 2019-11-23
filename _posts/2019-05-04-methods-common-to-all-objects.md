---
layout:   post
title:    "[이펙티브 자바 3판] 3장. 모든 객체의 공통 메서드"
author:   Kimtaeng
tags: 	  java effectivejava
subtitle: "[Effective Java 3th Edition] Chapter3: Methods Common to All Objects"  
category: Java
comments: true
---

<hr/>

# 목록

- <a href="#아이템-10-equals는-일반-규약을-지켜-재정의하라">아이템 10. equals는 일반 규약을 지켜 재정의하라</a>
- <a href="#아이템-11-equals를-재정의하려거든-hashCode도-재정의하라">아이템 11. equals를 재정의하려거든 hashCode도 재정의하라</a> 
- <a href="#아이템-12-toString을-항상-재정의하라">아이템 12. toString을 항상 재정의하라</a>
- <a href="#아이템-13-clone-재정의는-주의해서-진행하라">아이템 13. clone 재정의는 주의해서 진행하라</a>
- <a href="#아이템-14-Comparable을-구현할지-고려하라">아이템 14. Comparable을 구현할지 고려하라</a>

<br/>

# 아이템 10. equals는 일반 규약을 지켜 재정의하라
> Obey the general contract when overriding equals

먼저, 결론은 재정의하지 않고 아래의 기본 ```equals``` 메서드를 사용한다.

<pre class="line-numbers"><code class="language-java" data-start="1">public boolean equals(Object obj) {
    return (this == obj);
}
</code></pre>

특히 아래와 같은 상황에서는 재정의하지 않는 것이 최선일 수 있다.

첫 번째로, **값을 표현하는 것이 아니라 동작하는 개체를 표현하는 클래스인 경우**를 생각할 수 있다.
Object의 equals 메서드로도 충분한 경우인데 예를 들어 Thread 클래스가 있다. 인스턴스가 가지는 값보다
동작하는 개체임을 나타내는 것이 더 중요하다.

두 번째로 **논리적 동치성(logical equality)을 검사할 필요가 없는 경우**에도 재정의하지 않는 것이 좋다.
예를 들어서 두 개의 랜덤(Random) 객체가 같은 난수열을 만드는지 확인하는 것은 의미가 없다.
마지막으로 **private이나 패키지 전용 클래스라서 클래스의 equals 메서드가 절대 호출되지 않아야하는 경우**에 해당한다.
이런 경우에는 equals 메서드를 반드시 오버라이드(override)해서 호출되지 않도록 막아야 한다.

- <a href="/post/obey-the-general-contract-when-overriding-equals">더 상세한 내용은 링크 참고: 
[이펙티브 자바 3판] 아이템 2. 생성자에 매개변수가 많다면 빌더를 고려하라</a>

<div class="post_caption">꼭 필요한 경우가 아니면 equals를 재정의하지 말자.</div>

<br/>

# 아이템 11. equals를 재정의하려거든 hashCode도 재정의하라
> Always override hashCode when you override equals

equals 메서드를 재정의한 클래스 모두에서 hashCode도 재정의해야 한다. 그렇지 않은 경우에는 ```hashCode```의 일반 규약을
어기게 되므로 해당 클래스의 인스턴스를 ```HashMap```이나 ```HashSet``` 같은 컬렉션의 원소로 사용할 때 문제를 일으키게 된다.

아래는 Object 클래스의 명세에서 발췌한 hashCode 관련 규약이다.

1. equals 비교에 사용되는 정보가 변경되지 않았다면, 그 객체의 ```hashCode``` 메서드는 몇 번을 호출하더라도
애플리케이션이 실행되는 동안 매번 같은 값을 반환해야 한다. 단, 애플리케이션을 다시 실행한다면 값이 달라져도 상관없다.
2. ```equals(Object)```의 결과가 두 객체를 같다고 판단했다면, 두 객체의 ```hashCode```는 같은 값을 반환해야 한다.
3. ```equals(Object)```의 결과가 두 객체를 다르다고 판단했더라도, 두 객체의 ```hashCode``` 가 서로 다른 값을 반환할
필요는 없다. 단, 다른 객체에 대해서는 다른 값을 반환해야 해시 테이블(hash table)의 성능이 좋아진다.

여기서 ```hashCode``` 재정의를 잘못했을 때, 크게 문제가 되는 것은 두 번째 규약이다. 즉, 논리적으로 같은 객체는
같은 해시값을 반환해야 한다. ```equals(Object)``` 메서드의 호출 결과가 false인 두 객체들의 hashCode 값이 최대한
다르게 나오도록 ```hashCode``` 메서드를 오버라이드 해야 한다. 구현 후에는 동치인 인스턴스에 대해 똑같은 해시코드를
반환하는지 단위 테스트가 필요하다.

#### 좋은 hashCode 메서드를 작성하는 방법

좋은 해시 함수라면 서로 다른 인스턴스에 대해서 다른 해시코드를 반환한다. 이상적인 해시 함수는 주어진 인스턴스들을
32비트 정수 범위에 균일하게 분배해야 한다.

1. int 변수 result를 선언한 후 아래 2의 방법으로 계산한 해시코드 값으로 초기화한다.
2. ```Type.hashCode```, ```Arrays.hashCode``` 등을 사용하여 각 필드에 대한 해시코드 값을 구한다.
3. 1에서 선언한 result 값을 ```result = 31 * result * c;``` 처럼 갱신한다. 그리고 반환한다.
  - 31인 이유는 홀수이면서 소수이다. 숫자가 짝수이고 오버플로우가 발생한다면 정보를 잃게 된다.
4. 추가적으로 equals 비교에 사용되지 않는 필드는 해시코드 계산 로직에서 반드시 제외해야 한다.
   
#### 간단한 한 줄짜리 hashCode 메서드

```Objects``` 클래스의 정적 메서드 ```hash```를 이용하는 방법이다. 임의의 개수만큼 객체를 받아 해시코드를 계산해준다.
이 메서드를 활용하면 앞에서 구현한 코드와 비슷한 수준의 hashCode 함수를 단 한 줄로 작성할 수 있다.

<pre class="line-numbers"><code class="language-java" data-start="1">@Override public int hashCode() {
    return Objects.hash(lineNum, prefix, areaCode);
}
</code></pre>

하지만 속도가 상대적으로 더 느리다. 입력 인수를 담기 위한 배열이 필요하고 입력 값 중에 기본 타입(Primitive Type)이
있다면 박싱(Boxing)과 언박싱(UnBoxing)도 필요하다.

#### 해시코드를 지연 초기화(lazy initialization)하는 방법

클래스가 불변이고 해시코드를 계산하는 비용이 너무 크다면 매번 새로 계산하는 것보다는 캐쉬 처리하는 방식을 고려하면 좋다.
**지연 초기화**를 통해 캐쉬 처리하면 유용한데 필드를 지연 초기화하려면 스레드 안전성까지 고려해야 한다.
아래는 해시코드를 지연 초기화하는 ```hashCode``` 메서드다.

<pre class="line-numbers"><code class="language-java" data-start="1">private int hashCode; //자동으로 0으로 초기화된다.

@Override public int hashCode() {
    int result = hashCode;
    if (result == 0) {
        result = Short.hashCode(areaCode);
        result = 31 * result + Short.hashCode(prefix);
        result = 31 * result + Short.hashCode(lineNum);
        hashCode = result;
    }
    return result;
}
</code></pre>

#### 실무에서 권장하는 방법

실무에서는 ```HashCodeBuilder```나 ```@EqualsAndHashCode```를 사용하는 것을 추천한다.

<pre class="line-numbers"><code class="language-java" data-start="1">// HashCodeBuilder
public int hashCode() {
    return HashCodeBuilder.reflectionHashCode(this);
}
</code></pre>

```@EqualsAndHashCode``` 어노테이션은 클래스에 추가해주면 된다. ```equals``` 메서드와 ```hashCode``` 메서드를
생성해주는데, static과 transient가 아닌 모든 필드들이 대상이 된다.

<pre class="line-numbers"><code class="language-java" data-start="1">@EqualsAndHashCode
public class Example {
    private transient int transientVal = 10;
    private String name;
    private int id;
}
</code></pre>

#### 주의사항

성능을 높이기 위해 해시코드를 계산할 때 핵심 필드를 생략해서는 안된다. 속도는 빨라지겠지만 해시테이블의 성능을 심각하게
떨어뜨릴 수 있다. 그리고 ```equals``` 비교에 사용되지 않은 필드는 hashCode 에서도 반드시 제외해야 한다.
끝으로 hashCode가 반환하는 값의 생성 규칙을 API 사용자에게 공개해서는 안된다. 이를 사용하는 개발자가 이 값에 의지하지 않고
추후에 계산 방식을 바꿀 수도 있다. 그렇게 되면 차후에 계산 방식을 바꾸려고 할 때 문제가 될 수 있다. 

<div class="post_caption">equals를 재정의할 때는 hashCode도 반드시 재정의해야 한다.</div>

<br/>

# 아이템 12. toString을 항상 재정의하라
> Always override toString

```toString``` 메서드는 간결하고 읽기 쉬운 형태의 유익한 정보를 반환해야 한다. 
이를 잘 구현한 클래스는 사용하기 좋고 디버깅을 쉽게 해준다.

### 좋은 toString 재정의 방법

- 객체가 가진 주요 정보 모두를 반환해야 한다.
- 주석으로 ```toString```이 반환하는 포맷을 명시하든 아니든 의도를 명확하게 해야 한다.
- ```toString```이 반환한 값에 포함된 정보를 얻어올 수 있는 API를 제공하자.
  - 없다면 이 정보가 필요한 개발자는 ```toString```의 반환값을 파싱할 수 밖에 없다.

### toString 재정의가 필요 없는 경우

- 대부분의 정적 유틸리티 클래스
- 대부분의 열거(enum) 타입
- 수퍼 클래스에서 이미 적절하게 재정의한 경우

### 실무에서는 ToStringBuilder을 추천

```apache-commons-lang3``` 라이브러리를 사용하면 간편하게 ```toString``` 포맷을 이용할 수 있습니다. 

<pre class="line-numbers"><code class="language-java" data-start="1">public String toString() {
    /*
     * 두 번째 인자를 변경하여 포맷을 바꿀 수 있다.
     * ToStringStyle.JSON_STYLE 등
     */
    return ToStringBuilder.reflectionToString(this, ToStringStyle.MULTI_LINE_STYLE);
}
</code></pre>

<div class="post_caption">toString은 해당 객체에 관해 명확하고 유용한 정보를 반환해야 한다.</div>

<br/>

# 아이템 13. clone 재정의는 주의해서 진행하라
> Override clone judiciously


<br/>

# 아이템 14. Comparable을 구현할지 고려하라
> Consider implementing Comparable