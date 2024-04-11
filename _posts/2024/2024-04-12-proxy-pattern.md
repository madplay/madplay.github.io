---
layout: post
title: "@Transactional 뒤에 숨은 프록시 패턴"
author: madplay
tags: design-pattern java spring
description: "Spring의 @Transactional은 어떻게 메서드 실행 전후에 트랜잭션을 관리할까? 그 뒤에는 프록시 패턴이 있다!"
category: Algorithm/CS
date: "2024-04-12 08:14:29"
comments: true
---

# @Transactional을 붙이면 무슨 일이 생기는가

Spring에서 `@Transactional`을 메서드에 붙이면 트랜잭션 관리가 자동으로 이루어진다.
메서드가 성공하면 커밋하고, unchecked 예외(RuntimeException, Error)가 발생하면 롤백한다.
그런데 이 동작은 메서드 본문에 트랜잭션 코드를 작성하지 않아도 일어난다. 어떻게 가능할까?

답은 프록시에 있다.
Spring은 `@Transactional`이 붙은 빈의 프록시 객체를 생성하고, 메서드 호출을 가로채서 트랜잭션 로직을 실행 전후에 끼워 넣는다.
프록시 패턴은 이처럼 실제 객체에 대한 접근을 제어하거나 부가 기능을 부여하기 위해 대리 객체를 두는 패턴이다.

<br>

# 프록시 패턴의 구조

구성 요소는 세 가지다.

- **Subject:** 클라이언트가 사용하는 인터페이스
- **RealSubject:** 실제 비즈니스 로직을 담고 있는 구현 클래스
- **Proxy:** Subject를 구현하며, 내부에서 RealSubject를 참조하여 호출을 제어한다

클라이언트는 Subject 인터페이스를 통해 호출하므로, 실제 객체와 프록시를 구분할 수 없다.
프록시가 호출을 가로채서 접근 제어, 지연 로딩, 로깅 등의 부가 기능을 수행한 뒤 실제 객체에 위임한다.

프록시의 종류에 따라 용도가 나뉜다.

- **보호 프록시(Protection Proxy):** 접근 권한을 검사한다
- **가상 프록시(Virtual Proxy):** 비용이 큰 객체의 생성을 지연시킨다
- **로깅/캐싱 프록시:** 호출 전후에 부가 기능을 수행한다

<br>

# 캐싱 프록시를 만들어보기

데이터를 조회하는 서비스에 캐싱 프록시를 적용해보자.

```java
public interface ArticleService {
    Article findById(Long id);
}

class ArticleServiceImpl implements ArticleService {
    @Override
    public Article findById(Long id) {
        // 실제로는 데이터베이스에서 조회하는 비용이 큰 작업
        System.out.println("DB에서 Article 조회: " + id);
        return new Article(id, "프록시 패턴 활용");
    }
}
```

캐싱 프록시를 만든다.

```java
class CachingArticleServiceProxy implements ArticleService {
    private final ArticleService delegate;
    private final Map<Long, Article> cache = new HashMap<>();

    public CachingArticleServiceProxy(ArticleService delegate) {
        this.delegate = delegate;
    }

    @Override
    public Article findById(Long id) {
        if (cache.containsKey(id)) {
            System.out.println("캐시에서 반환: " + id);
            return cache.get(id);
        }
        Article article = delegate.findById(id);
        cache.put(id, article);
        return article;
    }
}
```

호출하는 쪽은 프록시의 존재를 모른다.

```java
ArticleService service = new CachingArticleServiceProxy(new ArticleServiceImpl());
service.findById(1L); // DB에서 Article 조회: 1
service.findById(1L); // 캐시에서 반환: 1
```

첫 번째 호출에서는 실제 서비스에 위임하고, 두 번째 호출부터는 캐시에서 반환한다.
실제 서비스의 코드를 한 줄도 건드리지 않았다.

<br>

# JDK Dynamic Proxy

위 예시처럼 프록시를 직접 작성하면 인터페이스마다 프록시 클래스를 만들어야 한다.
JDK는 이를 자동화하는 `java.lang.reflect.Proxy` 클래스를 제공한다.

```java
ArticleService proxy = (ArticleService) Proxy.newProxyInstance(
    ArticleService.class.getClassLoader(),
    new Class[]{ArticleService.class},
    new InvocationHandler() {
        private final ArticleService target = new ArticleServiceImpl();

        @Override
        public Object invoke(Object proxyObj, Method method, Object[] args) throws Throwable {
            System.out.println("[Proxy] " + method.getName() + " 호출");
            Object result = method.invoke(target, args);
            System.out.println("[Proxy] " + method.getName() + " 완료");
            return result;
        }
    }
);

proxy.findById(1L);
// [Proxy] findById 호출
// DB에서 Article 조회: 1
// [Proxy] findById 완료
```

`InvocationHandler`를 구현하면 모든 메서드 호출을 하나의 핸들러에서 처리할 수 있다.
런타임에 프록시 클래스가 동적으로 생성되므로 인터페이스별로 프록시를 만들 필요가 없다.

다만 JDK Dynamic Proxy는 인터페이스가 있어야만 동작한다.
인터페이스 없이 클래스를 직접 프록싱하려면 CGLIB 같은 라이브러리가 필요하다.

<br>

# Spring AOP와 프록시

Spring AOP는 프록시 패턴 위에 구축되어 있다.
`@Transactional`, `@Cacheable`, `@Async` 같은 어노테이션이 동작하는 원리가 모두 프록시다.

## JDK Dynamic Proxy vs CGLIB

Spring은 두 가지 프록시 생성 방식을 지원한다.

| 기준 | JDK Dynamic Proxy | CGLIB |
|------|-------------------|-------|
| 요구 사항 | 인터페이스 필수 | 인터페이스 불필요 |
| 프록시 대상 | 인터페이스 | 클래스 (바이트코드 조작) |
| 성능 | 리플렉션 기반 | 바이트코드 생성으로 상대적으로 빠름 |
| Spring Boot 기본값 | 아니오 | Spring Boot 2.0부터 기본값 |

Spring Boot 2.0 이후부터는 CGLIB가 기본 프록시 방식이다.
`spring.aop.proxy-target-class` 속성으로 변경할 수 있지만, 특별한 이유가 없다면 기본값을 유지하는 편이 낫다.

## @Transactional의 동작 흐름

`@Transactional`이 붙은 메서드의 호출 흐름을 단순화하면 다음과 같다.

<pre class="mermaid">
sequenceDiagram
    participant C as 클라이언트
    participant P as 프록시 객체
    participant R as 실제 객체

    C->>P: updateInventory() 호출
    P->>P: 트랜잭션 시작
    P->>R: updateInventory() 위임
    R-->>P: 결과 반환
    P->>P: 트랜잭션 커밋 또는 롤백
    P-->>C: 결과 반환
</pre>

주의할 점은, 같은 클래스 내부에서 `@Transactional` 메서드를 호출하면 프록시를 거치지 않는다는 것이다.
프록시는 외부에서 들어오는 호출만 가로채기 때문이다.

```java
@Service
public class OrderService {

    public void placeOrder() {
        updateInventory(); // 프록시를 거치지 않는다! 트랜잭션이 적용되지 않음
    }

    @Transactional
    public void updateInventory() {
        // ...
    }
}
```

이 문제는 Spring AOP의 프록시 기반 동작을 이해하고 있어야 발견할 수 있다.
자기 자신을 주입받거나(`self-injection`), `ApplicationContext`에서 빈을 가져오는 방식으로 우회할 수 있지만,
가능하면 설계를 분리하는 편이 깔끔하다.

<br>

# 프록시 vs 데코레이터

<a href="/post/decorator-pattern" target="_blank">데코레이터 패턴</a>과 프록시 패턴은 구조가 거의 동일하다.
둘 다 원본 객체와 같은 인터페이스를 구현하고, 내부에서 원본에 위임한다.

차이는 의도에 있다.

- **데코레이터:** 기능을 추가하는 것이 목적. 클라이언트가 데코레이터의 존재를 알 수 있다.
- **프록시:** 접근을 제어하는 것이 목적. 클라이언트가 프록시의 존재를 모르는 것이 이상적이다.

Spring의 `@Transactional`은 프록시 패턴의 좋은 예다.
개발자가 트랜잭션 프록시의 존재를 의식하지 않아도 어노테이션 하나로 트랜잭션이 적용된다.
반면 Java I/O의 `BufferedInputStream`은 데코레이터의 좋은 예다.
개발자가 명시적으로 감싸는 행위를 통해 버퍼링 기능을 추가한다.

<br>

# 마치며

프록시 패턴은 실제 객체에 대한 접근을 제어하거나 부가 기능을 부여하기 위해 대리 객체를 두는 접근 방식을 취한다.
Spring AOP가 이 패턴 위에 구축되어 있어서, `@Transactional`, `@Cacheable`, `@Async` 등의 동작 원리를 이해하려면
프록시에 대한 이해가 선행되어야 한다.

프록시 패턴에서 실무적으로 가장 자주 마주치는 함정은 self-invocation이다.
같은 클래스 안에서 `@Transactional` 메서드를 호출했는데 트랜잭션이 안 걸리는 상황, 이 글에서 다룬 프록시 구조를 떠올리면 원인이 바로 보인다.
