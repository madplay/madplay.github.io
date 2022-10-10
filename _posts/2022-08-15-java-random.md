---
layout:   post
title:    "자바에서 난수를 만드는 방법과 주의할 점"
author:   Kimtaeng
tags:    java random
description: "자바에서 난수를 생성하는 방법에는 어떤 것들이 있을까? 그리고 주의할 점은 무엇일까?"
category: Java
date: "2022-08-15 21:54:23"
comments: true
---

기본적으로 제공되는 Math.random 정적 메서드, Apache Commons 프로젝트에 포함된 유틸성 메서드, 그리고 보안적으로 강력한 SecureRandom 클래스까지,
자바(Java)에는 랜덤한 수인 난수를 만들 수 있는 여러 가지 방법이 있다.

<br>

# Math.random 메서드
`java.lang.Math` 클래스의 `random` 메서드를 사용하는 방법이다. `Math.random` 메서드는 객체 생성 없이 바로 사용할 수 있는 정적(static) 메서드다.
반환값은 0.0 보다 크거나 같고 1.0 보다 작은 `double` 형 값이며, 현재 시간을 시드(Seed) 값으로 사용하기 때문에 매 실행마다 다른 난수가 반환된다.

```java
// 0.0 보다 크거나 같고(포함 O) 1.0 보다 작은(포함 X)
double randomValue = Math.random();
```

아래와 같이 최솟값(포함)과 최댓값(제외)으로 범위를 지정해서 정수형 난수를 얻을 수도 있다.

```java
// min 보다 크거나 같고 max 보다 작은 난수 
int random = (int)((Math.random() * (max - min)) + min);
```

<br>

# Random 클래스
`java.util` 패키지에 있는 `Random` 클래스를 사용하는 방법도 있다. 앞서 살펴본 `Math.random`와 다르게 인스턴스를 생성해서 사용해야 한다.
객체 생성 방법은 2가지인데, 인자 없이 기본 생성자를 사용하는 방법과 long 타입의 시드(seed)를 인자로 받는 생성자를 사용하는 방법이다.

```java
// 기본 생성자로 생성
Random random = new Random();

// seed 지정해서 생성
Random randomWithSeed = new Random(5);
```

난수의 범위를 지정하려면 아래와 같이 설정하면 된다.

```java
int randomValueWithRange = random.nextInt(max - min) + min;
```

자바 8버전부터 추가된 `ints` 메서드를 사용하면 난수로 구성된 `IntStream`을 쉽게 생성할 수 있다.

```java
// 무한대 난수 스트림
IntStream intStream = random.ints();

// 난수 5개를 갖는 스트림
IntStream intStreamWithSize = random.ints(5);

// 크기를 비롯하여 min, max 값도 지정할 수 있다.
// 1보다 크거나 같고(포함 O) 5보다 작은(포함 X) 난수 5개를 갖는 스트림 
IntStream intStreamWithSizeAndRange = random.ints(5, 1, 5);
```

<br>

## 난수에 패턴이 보인다?
시드값을 설정해서 `Random` 클래스를 사용할 때는 주의할 점이 있다. 아래 예시 코드를 보자.

```java
for (int i = 0; i < 5; i++) {
    Random random = new Random(5);
    for (int j = 0; j < 5; j++) {
        System.out.print(random.nextInt() + " ");
    }
    System.out.println();
}
```

실행 결과를 자세히 살펴보면 이상한 점을 볼 수 있다. 아래 출력된 결과를 통해서 알 수 있듯이, 동일한 시드값을 갖는 인스턴스가 생성한 난수는 일정 패턴을 갖는다는 것이다.

```bash
-1157408321 758500184 379066948 -1667228448 2099829013
-1157408321 758500184 379066948 -1667228448 2099829013
-1157408321 758500184 379066948 -1667228448 2099829013
-1157408321 758500184 379066948 -1667228448 2099829013
-1157408321 758500184 379066948 -1667228448 2099829013
```

**왜 그럴까?** 컴퓨터는 사람처럼 무의식적이고 우연적인 선택을 할 수 없고 정해진 입력에 따라 결과를 반환한다.
그렇기 때문에 진짜 난수가 생성되는 것이 아니다. 그저 우리가 볼 때 임의의 값인 것처럼 보이게 특정한 방법으로 난수 생성을 흉내 내는데,
이처럼 특정한 알고리즘으로 생성된 값을 <a href="https://ko.wikipedia.org/wiki/유사난수" rel="nofollow" target="_blank">유사 난수(pseudo-random)</a>라고 한다.

참고로 `Random` 클래스는 시드값을 설정하지 않은 경우 시스템의 현재 시간을 활용한다. 

```java
public Random() {
    this(seedUniquifier() ^ System.nanoTime());
}

private static long seedUniquifier() {
    // L'Ecuyer, "Tables of Linear Congruential Generators of
    // Different Sizes and Good Lattice Structure", 1999
    for (;;) {
        long current = seedUniquifier.get();
        long next = current * 1181783497276652981L;
        if (seedUniquifier.compareAndSet(current, next))
            return next;
    }
}
```

<br><br>

# Apache Commons Math
Apache Commons Math 프로젝트의 `RandomDataGenerator`를 사용하는 방법이다.

```java
RandomDataGenerator randomDataGenerator = new RandomDataGenerator();
int randomIntWithRange = randomDataGenerator.nextInt(min, max);
```

사용을 위해서는 다음과 같은 의존성(dependency) 추가가 필요하다.
참고로 2022년 7월 기준으로 최신 버전은 2016년 3월에 릴리즈된 3.6.1 버전이다.

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-math3</artifactId>
    <version>3.6.1</version>
</dependency>
```

<br><br>

# Apache Commons Lang3
Apache Commons Lang3 프로젝트에 포함된 `RandomUtils` 클래스를 사용할 수도 있다. `Random` 클래스를 보완하는 유틸리티성 라이브러리로
아래 코드처럼 정적 메서드로 사용할 수 있다.

```java
int randomInt = RandomUtils.nextInt();
int randomIntWithRange = RandomUtils.nextInt(min, max)
```

역시나 사용하려면 의존성 추가가 필요하다. 2022년 7월 기준으로 최신 버전은 2021년 3월에 릴리즈된 3.12.0 버전이다.

```xml
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <version>3.12.0</version>
</dependency>
```

<br><br>

# ThreadLocalRandom 클래스
자바 7버전에 추가된 `java.util.concurrent.ThreadLocalRandom` 클래스를 사용하는 방법이다.

```java
int randomValue = ThreadLocalRandom.current().nextInt();

// 5보다 작은(포함 X) 난수 생성
int randomValueWithMax = ThreadLocalRandom.current().nextInt(5);

// 1보다 크거나 같고(포함 O) 5보다 작은(포함 X) 난수 생성
int randomValueWithRange = ThreadLocalRandom.current().nextInt(1, 5);
```

자바 8버전부터는 앞서 살펴본 `Random` 클래스처럼 `ThreadLocalRandom` 클래스에서도 `ints` 메서드를 사용하여 난수 스트림을 생성할 수 있다.

```java
IntStream intStream = ThreadLocalRandom.current().ints();
IntStream intStreamWithSize = ThreadLocalRandom.current().ints(5);
IntStream intStreamWithSizeAndRange = ThreadLocalRandom.current().ints(5, 1, 5);
```

<br>

## Random vs ThreadLocalRandom
`ThreadLocalRandom` 클래스는 `Random` 클래스와 비교했을 때 다음과 같이 장점이 있다.

### 매번 새로운 인스턴스를 생성할 필요가 없다.
생성자를 통해 인스턴스를 생성했던 `Random` 클래스와 다르게 `ThreadLocalRandom` 클래스는
`current` 메서드를 통해 인스턴스에 접근한 후 메서드를 사용하면 된다.

```java
int randomValue = ThreadLocalRandom.current().nextInt();
```

### 시드 값을 생성할 필요가 없다.
`Random` 클래스와 다르게 `ThreadLocalRandom` 클래스는 시드값 설정으로 발생할 수 있는 문제를 원천 차단한다.
`setSeed` 메서드의 구현도 아래와 같이 예외를 던지도록 설계돼있다.

```java
public void setSeed(long seed) {
    // only allow call from super() constructor
    if (initialized)
        throw new UnsupportedOperationException();
}
```

### 멀티 스레드 환경에서 더 좋은 성능을 갖는다.
`Random` 클래스는 멀티 스레드 환경에서 안전하나(thread-safe) 하나의 인스턴스를 공유하여 전역적으로 동작한다.
따라서 여러 스레드에서 동일한 인스턴스를 사용하면 경합이 발생하기 때문에 성능이 떨어진다.

```java
private final AtomicLong seed;

protected int next(int bits) {
    long oldseed, nextseed;
    AtomicLong seed = this.seed;
    do {
        oldseed = seed.get();
        nextseed = (oldseed * multiplier + addend) & mask;
    } while (!seed.compareAndSet(oldseed, nextseed));

    return (int)(nextseed >>> (48 - bits));
}
```

반대로 `ThreadLocalRandom` 인스턴스는 현재 스레드에 격리된다.
따라서 인스턴스에 대한 오버헤드나 경합이 훨씬 적게 되므로 멀티 스레드 환경에서 `ThreadLocalRandom` 클래스의 성능이 일반적으로 좋다.

```java
public static ThreadLocalRandom current() {
    if (U.getInt(Thread.currentThread(), PROBE) == 0)
        localInit();
    return instance;
}
```

## 주의할 점: 매번 꼭 current를 호출해야 하나?
참고로 `ThreadLocalRandom`을 사용할 때는 반드시 `current` 메서드를 통해서 접근해야 한다. 인스턴스를 생성하거나(또는 current 메서드의 반환 값을)
멤버 변수 등에 저장해서 사용하는 방법은 스레드 별로 랜덤 인스턴스를 격리시키지 못하므로 기대한 성능과 결과를 얻지 못한다.

<br><br>

# SecureRandom
생성된 난수 등을 추측할 수 없도록 보안적으로 더 강력한 처리가 필요한 경우 `SecureRandom`을 고려해 볼 수 있다.
아래와 같이 정수형, 실수형 등의 기본형 타입에 대해서 난수를 생성할 수 있다.

```java
SecureRandom secureRandom = new SecureRandom();

final int randomInt = secureRandom.nextInt();
final long randomLong = secureRandom.nextLong();
final float randomFloat = secureRandom.nextFloat();
final double randomDouble = secureRandom.nextDouble();
final boolean randomBoolean = secureRandom.nextBoolean();
```

최솟값(포함)과 최댓값(제외)으로 범위를 지정해서 난수를 생성할 수 있다.

```java
int randomInt = secureRandom.nextInt(max - min) + min
```

`Random` 클래스를 상속하므로 동일하게 자바 8버전부터 난수 스트림도 생성할 수 있다.

```java
IntStream randomInts = secureRandom.ints();
LongStream randomLongs = secureRandom.longs();
DoubleStream randomDoubles = secureRandom.doubles();
```

<br>

## Random vs SecureRandom
`SecureRandom` 클래스는 `Random` 클래스와 비교했을 때 암호학적으로 더 강력하다.

`Random` 클래스는 시스템 시간을 시드로 사용하거나 시드를 생성한다. 그러므로 공격자가 시드의 생성된 시간을 알면 쉽게 재현해낼 수 있지만 `SecureRandom`은
OS의 무작위 데이터(하단의 엔트로피에 관한 내용 참고)를 가져와서 시드로 사용한다. 또한 48비트를 갖는 `Random`과 다르게 `SecureRandom`은 최대 128비트를
포함할 수 있기 때문에 반복될 확률도 적고 보안을 깨뜨리기 위해서는 상대적으로 더 많은 시도가 필요하다.

<br>

## getInstanceStrong
자바 8버전에 `getInstanceStrong` 라는 정적 메서드가 추가되었다.
이 메서드는 시스템에서 사용 가능한 강력한 암호화 알고리즘을 사용하여 인스턴스를 얻도록 한다.

```java
SecureRandom secureRandom = SecureRandom.getInstanceStrong();
```

사용할 수 있는 알고리즘은 자바 8버전 기준으로 `${JAVA_HOME}/jre/lib/security/java.security` 경로를
OpenJDK 17 버전에서는 `${JAVA_HOME}/conf/security` 경로에서 `java.security` 파일을 확인하면 된다.

```bash
securerandom.strongAlgorithms=NativePRNGBlocking:SUN
```

MacOS Monterey + temurin OpenJDK 환경을 기준으로, 생성자로 생성한 `SecureRandom` 인스턴스는 기본적으로 `NativePRNG` 알고리즘을 사용하는데,
이는 `/dev/urandom` 라는 난수 생성을 위한 특수 파일을 사용한다. 반대로 `getInstanceStrong` 메서드로 생성한 인스턴스는 앞서 살펴본 것처럼
`NativePRNGBlocking` 알고리즘을 사용하는데 이 알고리즘은 상대적으로 더 안전한 `/dev/random`을 사용한다.


## 주의할 점: SecureRandom의 속도가 너무 느리다? 
리눅스와 같은 유닉스 계열 환경에서 `SecureRandom` 클래스를 사용할 때 일부 느린 성능을 보이는 문제점이 있다. 우선 발생하는 원인은 `/dev/random`이 있다.
어떤 문제인지 좀 더 자세히 살펴보자.

보통 유닉스 계열 운영체제에서는 유사난수(pseudo-random) 생성을 위해 `/dev/random`과 `/dev/urandom` 이라는 특수한 장치 파일을 사용한다. 
이들은 난수를 생성하기 위해 아래 이미지처럼 엔트로피 소스(Entropy Source)가 담긴 엔트로피 풀(Entropy Pool)에서 데이터를 가져다 쓴다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2022-08-15-java-random_linux-random-number-generator.png" width="600" alt="linux random number generator"/>

> 이미지 출처: <a href="https://pt.slideshare.net/nij05/slideshare-linux-random-number-generator" target="_blank" rel="nofollow">https://pt.slideshare.net/nij05/slideshare-linux-random-number-generator</a>

두 파일의 차이는 사용하는 엔트로피 풀에 있다. `/dev/urandom`은 논 블로킹 풀(non-blocking pool)을 사용하고 `/dev/random`은 블로킹 풀(blocking pool)을 사용한다.
`/dev/urandom`은 충분한 엔트로피가 쌓이지 않아도 현재 엔트로피 풀 내의 데이터로 난수를 생성하지만, `/dev/random`은 엔트로피 풀에 필요한 크기만큼의 데이터가 없다면 블로킹(blocking) 상태로 기다린다.

바로 이 차이에서 문제가 발생한다. 엔트로피가 쌓일 때까지 대기하므로 성능 저하가 발생한다. 이러한 내용은 `SecureRandom` 클래스의 API 코멘트에서도 확인할 수 있다.

> Note: Depending on the implementation, the generateSeed and nextBytes methods may block as entropy is being gathered, for example, if they need to read from /dev/random on various Unix-like operating systems.

예를 들어 아래와 같이 `getInstanceStrong` 메서드를 통해서 사용하면, 리눅스 환경에서 성능 저하를 확인할 수 있다.

```java
SecureRandom secureRandom = SecureRandom.getInstanceStrong();
int randomInt = secureRandom.nextInt();

// 참고로 `nextInt` 메서드에서는 `next` 메서드를 호출한다.
@Override
public int nextInt() {
    return next(32);
}

// 그리고 `next` 메서드 내부에서는 `nextBytes` 메서드를 호출한다.
@Override
protected final int next(int numBits) {
	int numBytes = (numBits+7)/8;
	byte[] b = new byte[numBytes];
	int next = 0;

	nextBytes(b);
	for (int i = 0; i < numBytes; i++) {
	    next = (next << 8) + (b[i] & 0xFF);
	}

	return next >>> (numBytes*8 - numBits);
}
```

오라클(Oracle)에서 제시하는 해결 방법은 다음과 같다. `java.security` 내의 아래 내용을 수정하면 된다.
참고로 해당 파일 위치는 자바 17버전 기준으로 `${JAVA_HOME}/conf/security` 하위에 있다.

```bash
# 수정 전
securerandom.source=file:/dev/random

# 수정 후
securerandom.source=file:/dev/urandom
```

보안적인 측면에서는 `/dev/urandom/` 보다 `/dev/random`이 더 안전하지만, 애플리케이션의 성능 저하를 야기할 수 있으므로 관련 오라클 가이드에서도 경우에 따른 변경을 권고하고 있다.
특히 이러한 문제는 개인 로컬 환경과 원격 서버의 환경이 다를 경우, 소스 코드를 서버에 배포할 때까지 징후를 발견하기 어려우므로 잘 숙지해야 할 것 같다.

<br>

# 참고
- <a href="https://docs.oracle.com/cd/E13209_01/wlcp/wlss30/configwlss/jvmrand.html" target="_blank" rel="nofollow">Oracle Guide: Avoiding JVM Delays Caused by Random Number Generation</a>
- <a href="http://bugs.java.com/view_bug.do?bug_id=6521844" target="_blank" rel="nofollow">JDK-6521844 : SecureRandom hangs on Linux Systems</a>
- <a href="https://stackoverflow.com/a/2325109/9212562" target="_blank" rel="nofollow">StackOverflow: How to deal with a slow SecureRandom generator?</a>
