---
layout:   post
title:    "스프링 프레임워크 정리: 제어의 역전"
author:   Kimtaeng
tags: 	  spring framework 
description: 스프링의 제어의 역전(IOC, Inversion of Control)에 대해서 알아보자
category: Spring
comments: true
---

# 목차
- <a href="/post/spring-framework-basic-design-pattern" target="_blank">스프링 프레임워크 정리: 디자인 패턴 (링크)</a>
- 스프링 프레임워크 정리: 제어의 역전
- <a href="/post/spring-framework-basic-test" target="_blank">스프링 프레임워크 정리: 테스트 (링크)</a>

<br/>

# Inversion of Control : Object Factory
지난 글에서는 **책임의 분리**를 통해서 클라이언트에서 인터페이스 ConnectionMaker의 구현 클래스를 결정하도록 변경했다.

- <a href="/post/spring-framework-basic-design-pattern" target="_blank">링크: 스프링 프레임워크 기초 - 디자인패턴</a>

하지만 변경하기 이전의 클라이언트는 UserDAO의 기능을 단순히 테스트만 하는 책임을 가지고 있었다. 그러니까, **기존 의도와 다른 책임**을 가지게 되었다.
이러한 문맥에서 우리는 객체의 생성 방법을 결정하고 만들어진 오브젝트를 반환하는 **오브젝트 팩토리(Object Factory)**라는 개념을 도입할 필요가 있다.
이를 이용해서 클라이언트가 갖는 책임을 분리하도록 해보자.

```java
package post.springframework.chapter2;

/**
 * 팩토리 클래스.
 * UserDAO 타입의 오브젝트를 어떻게 만들고,
 * 어떻게 준비시킬지를 결정한다.
 *
 * @author Kimtaeng
 */
public class DAOFactory {
    /**
     * 팩토리의 메서드는 User 타입의 오브젝트를 어떻게 만들고, 어떻게 준비시킬지를 결정한다.
     */
    public UserDAO userDAO() {
        ConnectionMaker connectionMaker = new SimpleConnectionMaker();

        UserDAO userDAO = new UserDAO(connectionMaker);
        return userDAO;
    }
}
```

```java
package post.springframework.chapter2;

/**
 * @author Kimtaeng
 */
public class Main {
    public static void main(String[] args) throws Exception {
        /*
         * 이제 UserDAO가 어떻게 만들어지는지, 어떻게 초기화되어 있는지에
         * 신경쓰지 않고 팩토리로부터 UserDAO 오브젝트를 받아다가 테스트에만 활용한다!
         */
        UserDAO userDAO = new DAOFactory().userDAO();
        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");

        userDAO.add(user);
        System.out.println(user.getId() + " : Complete!");
    }
}
```

이전보다는 클라이언트의 책임이 분리된 것 같아 더 나아보인다. 하지만, UserDAO 오브젝트를 반환하는 `userDAO 메서드`에 이슈가 있다.
만일 UserDAO가 아닌 다른 DAO의 오브젝트 생성 기능이 추가되면 어떻게 될까?

<br/>

# Inversion of Control : 오브젝트 팩토리의 활용
> 중복된 코드를 메서드로 분리해서 중복되는 부분을 제거한다.

```java
package post.springframework.chapter2;

public class DAOFactory {
    public UserDAO userDAO() {
        return new UserDAO(makeConnectionMaker());
    }

    public MessageDAO messageDAO() {
        return new MessageDAO(makeConnectionMaker());
    }
    
    /**
     * 메서드 추출 기법.
     * 분리해서 중복을 제거한 오브젝트를 생성하는 코드
     * 수정이 있을 때는 이 부분만 수정해주면 된다.
     */
    public ConnectionMaker makeConnectionMaker() {
        return new SimpleConnectionMaker();
    }
}
```

역할이 바뀌었다. 자신이 사용할 오브젝트를 선택하지도, 생성하지도 않는다. 그리고 자신이 어떻게 만들어지고 어디서 사용되는지를 알 수가 없다.

여기서 **제어의 역전(Inversion of Control)**이라는 개념이 등장하게 된다. 제어의 역전이란 제어 흐름의 개념을 거꾸로 뒤집는 것을 말한다.

또 흐름이란, 가장 처음에 UserDAO의 main 메서드에서 UserDAO 클래스의 오브젝트를 직접 생성하고 만들어진 오브젝트의 메서드를 사용하여
ConnectionMaker 인터페이스의 구현(implements) 클래스를 결정하는 과정을 말한다.

정리해보자면, **모든 제어의 권한을 자기 자신이 아닌 다른 대상에게 위임**한다는 것이다.

<br/>

# Inversion of Control : 적용 사례
> 제어의 역전의 개념은 이미 다양한 곳에서 사용되고 있습니다. (벌써 예제코드에서 썼고요.)

먼저 **서블릿(Servlet)**에서 그 예를 찾아볼 수 있다. 서블릿에 대한 제어권을 가진 컨테이너가 적절한 시점에서 서블릿 클래스의 오브젝트를 생성하고
그 안의 메서드를 호출한다.

그리고 **디자인 패턴(Design Pattern)**에서도 찾을 수 있다. 추상 클래스인 UserDAO를 상속한 서브 클래스는 getConnection 메서드를 구현하지만
이 메서드가 언제 사용되는지는 자기 자신은 알 수가 없다.

```java
class CustomDAO extends UserDAO {
    public Connection getConnection() throws Exception {
        // Custom DB Connection
    }
}
```

서브 클래스에서 사용하는 시점을 결정하는 것이 아니라 슈퍼 클래스인 UserDAO의 템플릿 메서드인 바로 add, get 메서드 등에서 필요로할 때 호출해서 사용된다.

마지막으로 **프레임워크(Framework)**에서도 제어의 역전을 찾아볼 수 있다. 프레임워크 위에 자신이 개발한 클래스를 등록해두고 프레임워크가 흐름을
주도하는 중에 개발자가 작성한 애플리케이션 코드를 사용하도록 만드는 방식이다.

- **참고. 라이브러리와 프레임워크**
  - 라이브러리 : 자주 사용될만한 기능들을 모아 놓은 것, 사용자가 직접 전체적인 흐름을 만든다.
  - 프레임워크 : 디자인 패턴, 라이브러리 요소를 포함하여 제어의 흐름이 내재되있다. 가져다가 사용한다기보다 그 안에 들어가서 사용하는 개념이 적절하다.

<br/>

# 스프링의 Inversion of Control
> 그렇다면 스프링 프레임워크에서의 제어의 역전은 어떤가?

스프링 프레임워크에서 등장하는 제어의 역전을 알아보기 전에 아래의 단어 정리가 필요하다.

- 빈(Bean) : 스프링 프레임워크가 제어권을 가지고 직접 만들고 관계를 부여하는 오브젝트
- 빈 팩토리(Bean Factory) : 빈의 생성과 관계의 설정과 같은 제어를 담당하는 Inversion of Control 오브젝트

하지만 스프링 프레임워크에서는 빈 팩토리보다 이를 더 확장한 개념인 **애플리케이션 컨텍스트(Application Context)**를 주로 사용한다.

그럼 앞서 작성한 코드의 DAOFactory 클래스를 스프링의 빈 팩토리가 사용할 수 있도록 변경해보자.
클라이언트에서는 **AnnotationConfigApplicationContext** 클래스를 이용해 `@Configuration` 어노테이션이 붙은 자바 코드를 설정 정보로
사용하도록 한다.

```java
package post.springframework.chapter2;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// 빈 팩토리 또는 애플리케이션 컨텍스트가 사용할 설정 정보라는 표시
@Configuration
public class DAOFactory {

    // 오브젝트 생성을 담당하는 IoC용 메서드라는 표시
    @Bean
    public UserDAO userDAO() {
        return new UserDAO(makeConnectionMaker());
    }

    @Bean
    public ConnectionMaker makeConnectionMaker() {
        return new SimpleConnectionMaker();
    }
}
```

```java
package post.springframework.chapter2;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

/**
 * @author Kimtaeng
 */
public class Main {
    public static void main(String[] args) throws Exception {
        ApplicationContext context = new AnnotationConfigApplicationContext(DAOFactory.class);
        UserDAO userDAO = context.getBean("userDAO", UserDAO.class);
        // 코드 생략
    }
}
```

그렇다면 오브젝트 팩토리인 DAOFactory와 이를 수정하여 애플리케이션 컨텍스트를 적용한 것과는 어떤 차이가 있을까?

**오브젝트 팩토리는** DAO 오브젝트 팩토리를 생성하고 DB 생성 오브젝트와 관계를 맺어주는 제한적인 역할을 수행하지만
**애플리케이션 컨텍스트는** IoC를 적용하여 관리해야 하는 모든 오브젝트에 대한 생성과 관계의 설정을 수행한다.

한편으로 팩토리와는 다르게 직접 오브젝트를 생성하고 관계를 맺어주는 코드가 보이지 않으며 `@Configuration` 어노테이션이
붙은 설정 정보를 통해 정보를 얻어온다.

<br/>

## 애플리케이션 컨텍스트의 장점은 무엇일까?
그렇다면 애플리케이션 컨텍스트의장점은 무엇일까?

**클라이언트가 구체적인 팩토리 클래스를 알 필요가 없다.** 오브젝트 팩토리의 개수가 많아져도 어떤 팩토리 클래스를
생성해야 하는지, 필요할 때마다 팩토리 오브젝트를 생성해야 하는 번거로움이 없다.

**종합적인 IoC 서비스를 제공한다.** 오브젝트의 생성과 관계 설정뿐만 아니라 오브젝트가 만들어지는 방식, 시점과 전략,
부가적인 자동생성, 오브젝트에 대한 후처리 기능 그리고 인터셉터의 수행 등 다양한 기능을 제공한다.

**빈을 검색하는 다양한 방법을 제공한다.** getBean 메서드는 빈의 이름을 이용해 빈을 찾는다.
타입만으로 빈을 검색하거나 특별한 어노테이션 설정이 되어 있는 빈을 찾을 수도 있다.

그러니까 유연하게 IoC 기능을 확장하기 위하여 애플리케이션 컨텍스트를 주로 사용하지 않을까?

<br/>

# 싱글톤 레지스트리
> 자바에서 두 개의 오브젝트가 '같다' 라는 말은 짚고 넘어갈 필요가 있다.

`싱글톤(Singleton)`에 대해서 알아보기 전에 ```같다```라는 표현에 대해서 잠시 생각해보자. 자바에서는 두 개의 오브젝트가 동일한 정보를
담고 있는(Equivalent) 오브젝트라고 말하는 것과 완전히 동일한(Identical) 오브젝트라고 말하는 것이 있다.

전자의 경우는 동등성(Equality) 비교라고 말하며 `equals 메서드`로, 후자의 경우는 동일성(Identity) 비교라고 말하며 `== 연산자`로 비교한다.
(자바의 최상위 클래스인 Object 클래스에 구현되어 있는 equals 메서드는 동일성 비교)

그러니까 두 개의 오브젝트가 동일하다면 실제로는 하나만 존재한다는 것이다. 기본적으로 스프링은 생성하는 빈 오브젝트를 모두 `싱글톤`으로 생성한다.

**이유는 무엇일까?** 스프링 프레임워크는 대부분 서버 사이드 환경에서 사용되기 때문이다. (만일 사용자의 요청마다 오브젝트를 계속적으로 만들게 되면...)
위에서 살펴본 동등성과 동일성을 오브젝트 팩토리와 이를 변경한 애플리케이션 컨텍스트의 동작 방식으로 비교해보자.

```java
package post.springframework.chapter2;

import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

/**
 * @author Kimtaeng
 */
public class UserDAOTest {
    public static void main(String[] args) {
        DAOFactory daoFactory = new DAOFactory();
        UserDAO factoryDAO1 = daoFactory.userDAO();
        UserDAO factoryDAO2 = daoFactory.userDAO();

        System.out.println(factoryDAO1);
        System.out.println(factoryDAO2);

        System.out.println("---------------------");

        ApplicationContext context = new AnnotationConfigApplicationContext(DAOFactory.class);
        UserDAO contextDAO1 = context.getBean("userDAO", UserDAO.class);
        UserDAO contextDAO2 = context.getBean("userDAO", UserDAO.class);

        System.out.println(contextDAO1);
        System.out.println(contextDAO2);

        // post.springframework.chapter2.UserDAO@27716f4
        // post.springframework.chapter2.UserDAO@8efb846
        // ---------------------
        // post.springframework.chapter2.UserDAO@15d9bc04
        // post.springframework.chapter2.UserDAO@15d9bc04
    }
}
```

facotryDAO1과 factoryDAO2는 다른 레퍼런스의 값이 출력되지만 contextDAO1과 contextDAO2는 같은 레퍼런스 값이 출력되는 것을 알 수 있다.
그러니까 스프링은 여러 번에 걸쳐 빈을 요청하더라도 매번 동일한 오브젝트를 돌려준다. (싱글톤 오브젝트)

<br/>

## 싱글톤 패턴의 문제
> 한편 싱글톤 패턴에는 몇가지 문제점이 있다.
- <a href="/post/singleton-pattern" target="_blank">참고 링크: 싱글톤 패턴(Singleton Pattern)</a>

- **private 생성자를 가지고 있어 상속을 할 수 없다.** 
  - private 생성자를 가진 클래스는 다른 생성자가 없다면 상속이 불가능하다.
- **테스트하기가 어렵다.**
  - 오브젝트가 만들어지는 방식이 제한적이어서 테스트에서 사용될 때 목(Mock) 오브젝트로 대체하기 어렵다.
  - _Mock Object : 실제로 구현되지 않은 인터페이스를 가상으로 구현하여 테스트를 가능하게 하는 오브젝트_
- **서버 환경에서는 싱글톤이 하나만 만들어지는 것을 보장하지 못한다.**
  - 클래스 로더(Class Loader)의 구성에 따라서 싱글톤임에도 하나 이상의 오브젝트가 만들어질 수 있다..
- **싱글톤의 사용은 전역 상태를 만들 수 있기 때문에 좋지않다는 의견도 있다.**
  - 싱글톤의 스태틱 메서드(Static Method)를 이용해 언제든지 싱글톤 오브젝트에 접근할 수 있다.

하지만 걱정하지 않아도 된다. 스프링이 직접 싱글톤 형태의 오브젝트를 만들고 관리하는 싱글톤 레지스트리(Singleton Registry)가 있다.

**싱글톤 레지스트리**는 정적(static) 메서드와 private 접근자로 지정된 생성자를 가진 클래스만이 아니라
평범한 클래스를 싱글톤으로 활용할 수 있게 해주며 public 생성자를 가질 수 있다.

또한 스프링이 관리하는 빈(Bean)이 생성되며 적용 범위인 스코프(scope) 개념도 있다.
그러니까 무작정으로 싱글톤 스코프로 생성되는 것이 아니라 경우에 따라서는 싱글톤 외의 스코프를 가질 수 있다는 것이다.

<br/><br/>

# Dependency Injection
오브젝트 레퍼런스를 외부로부터 제공받고 이러한 과정을 통해서 동적으로 다른 오브젝트와 의존하는 관계가
만들어지는 것을 **의존관계 주입(Dependency Injection)**이라고 한다.

스프링이 갖는 제어의 역전(Inversion of Control)의 대표적인 동작원리, 주로 의존관계 주입이라고 불린다.
그래서 IoC 컨테이너라고 불리는 스프링이 DI 컨테이너라고 불리기도 한다.

그렇다면 의존관계라는 것은 무엇일까? UML 모델링 관점에서 살펴보자.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-22-spring-framework-basic-inversion-of-control-1.png"
width="700" alt="dependency in uml"/> 

<br/>

의존관계에는 **방향성**이 존재한다. 위 그림에서 보면 A가 B에 의존하고 있지만 반대의 경우는 아니다.
앞선 예제에서는 UserDAO가 ConnectionMaker 인터페이스에 의존하고 있지만 인터페이스를 구현하는 클래스와는 의존관계가 없다.

```java
public class UserDAO {
    private ConnectionMaker connectionMakaer;
    
    public UserDAO(ConnectionMaker connectionMaker) {
        this.connectionMaker = connectionMaker;
    }
}
```

모델링 관점에서의 의존성뿐만 아니라 **런타임 의존관계**와 같이 실행 시점에 생기는 의존 관계도 있다.

```java
public UserDAO(ConnectionMaker connectionMaker) {
    this.connectionMaker = connectionMakaer;
}
```

실제 사용대상인 오브젝트를 **의존 오브젝트** 말한다. **의존관계 주입**은 구체적인 의존 오브젝트와 그것을 사용할 주체,
보통 클라이언트라고 부르는 오브젝트를 실행 시점에 연결해주는 작업을 말한다.

클래스 모델이나 코드에는 인터페이스에만 의존하기 때문에 실행 시점의 의존관계가 드러나지 않는다. 런타임 시점의 의존관계는 컨테이너나 팩토리같은
제 3의 존재가 결정한다. 의존관계는 사용할 오브젝트에 대한 레퍼런스를 외부에서 주입함으로서 생성된다.

<br/>

# 예제와 함께 Dependency Injection
진행했던 예제를 조금 더 자세히 살펴보며 의존관계 주입에 대해서 알아보자.

```java
public UserDAO() {
    simepleConnectionMaker = new  SimpleConnectionMaker();
}
```

최초로 문제가 발생한 부분이다. 설계 시점에서 인터페이스의 구현 클래스를 알고 있다는 문제가 있다.

```java
public class DAOFactory {
    public UserDAO userDAO() {
        ConnectionMaker connectionMaker = new NewConnectionMaker();
        
        UserDAO userDAO = new UserDAO(connectionMaker);
        return userDAO;
    }
}
```

**결정 권한을 위임**해보자. 위와 같은 문제를 해결하기 위해 제 3의 존재인 DAOFactory에게 의존관계 결정 권한을 위임한다.
여기서의 DAOFactory는 두 오브젝트 사이의 런타임 의존관계를 설정해주는 존재이며 Inversion Of Control 방식으로 오브젝트의 생성과 초기화
그리고 제공 등의 작업을 수행하는 DI 컨테이너의 역할을 한다.

```java
public class UserDAO {
    private ConnectionMaker connectionMaker;
    
    public UserDAO(ConnectionMaker connectionMaker) {
        this.connectionMaker = connectionMaker;
    }
}
```

DI 컨테이너인 DAOFactory는 자신이 결정한 의존관계를 맺을 클래스의 오브젝트를 만들고 이를 생성자의 파라미터로 전달한다.

예제에서는 생성자 메서드를 통해서 의존관계 주입을 진행하였지만 수정자(Setter) 메서드를 통해서도 가능하다.
물론 일반 메서드도 가능합니다. 수정자 메서드처럼 set이라는 prefix로 시작하지 않아도 되고 한 개 이상의 파라미터를 가져도 된다.

<br/>

# 의존관계 검색
> 자신이 필요로 하는 오브젝트를 능동적으로 찾는다. 하지만 자신이 어떤 클래스의 오브젝트를 이용할지 결정하지는 않는다.

앞서 살펴본 것처럼 외부로부터 의존성을 주입하는 것이 아니라 스스로 검색하는 **의존관계 검색**도 있다.
스프링 IoC 컨테이너인 애플리케이션 컨텍스트는 `getBean` 메서드를 통해 검색한다.

```java
ApplicationContext context = 
    new AnnotationConfigApplicationContext(DAOFactory.class);
this.connectionMaker = context.getBean("connectionMaker", ConnectionMaker.class);
```

**의존관계 검색**은 코드 안에 오브젝트 팩토리 클래스나 스프링 API 코드가 그대로 나타난다.
이러한 코드는 다른 오브젝트에 의존하게 되는 것이므로 대개는 의존관계 주입 방식을 사용한다.

하지만 의존관계 검색 방법을 사용할 때가 있다. getBean 메서드를 보면 스프링 IoC와 DI 컨테이너를 적용했다고 하더라도 main 메서드에서 DI를 이용하여
오브젝트를 주입받을 방법이 없기 때문에 적어도 한 번은 의존관계 검색 방법을 사용해 오브젝트를 가져와야 한다.

**한편 외부로부터 주입해줬다고 모든 것이 DI가 되는 것은 아니다.** 주입받는 메서드의 파라미터가 이미 특정 클래스의 타입으로 고정되어 있다면
스프링이 말하는 Dependency Injection은 일어날 수 없다. 그러니까 DI가 말하는 주입은 동적으로 구현 클래스를 결정해서 제공받을 수 있도록
인터페이스 타입의 파라미터를 통해 진행되어야 한다.

<br/>

# 설정 방법에 XML 사용하기
스프링의 애플리케이션 컨텍스트는 어노테이션을 설정한 자바 코드가 아닌 XML에 담긴 정보를 DI 정보로 이용할 수 있다.
DI 구성이 바뀔 때마다 코드를 수정하는 일에서 조금은 해방해보자.

```java
@Configuration // <beans> 에 대응한다.
public class DAOFactory {
    @Bean // <bean> 에 대응한다.
    public UserDAO userDAO() {
        return new UserDAO(connectionMaker());
    }
    
    @Bean // <bean> 에 대응한다.
    public ConnectionMaker connectionMaker() {
        return new NewConnectionMaker();
    }
    
    // 코드 생략...
}
```

주석으로 남겨둔 것처럼 자바 코드로 이용한 설정과 XML을 이용한 설정은 각각 대응되는 정보가 있다.
`@Configuration` 어노테이션은 XML 설정의 `<beans>`와 대응되고 `@Bean` 어노테이션은 `<bean>`에 대응된다.


```xml
<?xml version="1.0" encoding="UTF-8">
<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="http://www.springframework.org/schema/beans http://www.springframework.org/schema/beans/spring-beans.xsd">

    <bean id="connectionMaker" class="post.springframework.chapter2.SimpleConnectionMaker"/>
    <bean id="userDAO" class="post.springframework.chapter2.UserDAO">
        <property name="connectionMaker" ref="connectionMaker"/>
    </bean>
</beans>
```

```java
/*
 * 애플리케이션 컨텍스트를 생성하게 만든다.
 * 생성자에는 applicationContext.xml의 클래스 패스를 넣으면 됩니다.
 */
ApplicationContext context =
    new GenericXmlApplicationContext("applicationContext.xml");
```

여기서 주의해야 하는 부분은 UserDAO 클래스의 멤버 변수인 connectionMaker의 값을 설정하기 위해서 `<property>` 태그를 이용 설정을 해주어야 한다.
그리고 UserDAO 클래스에는 이 값을 설정하기 위해서 수정자(Setter) 메서드도 필요하다.

XML을 설정 정보로 이용했으니 기존에 DAOFactory에 선언했던 어노테이션은 제거해도 된다.
차후에 알아보겠지만 Database 설정 정보 또한 XML에 정의할 수 있다.