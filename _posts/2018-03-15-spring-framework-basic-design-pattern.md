---
layout:   post
title:    "스프링 프레임워크 정리: 디자인 패턴"
author:   Kimtaeng
tags: 	  spring framework 
description: 스프링 프레임워크와 디자인패턴에 대해서 공부하자!
category: Spring
comments: true
---

# 목차
- 스프링 프레임워크 정리: 디자인 패턴
- <a href="/post/spring-framework-basic-inversion-of-control" target="_blank">스프링 프레임워크 정리: 제어의 역전 (링크)</a>
- <a href="/post/spring-framework-basic-test" target="_blank">스프링 프레임워크 정리: 테스트 (링크)</a>

<br/>

# 스프링 프레임워크란?
스프링(Spring)은 자바 엔터프라이즈 애플리케이션 개발에 사용되는 프레임워크이다. 그럼 프레임워크(Framework)란 무엇일까? 프레임워크의 정의를 살펴보면
소프트웨어 애플리케이션이나 솔루션의 **개발을 수월하게 하기 위해** 구체적 기능들에 해당하는 부분의 설계와 구현을 **재사용 가능하도록** 협업화된 형태로
제공하는 소프트웨어를 말한다.

한편 자바를 다운받을 때 접하는 경우도 있을텐데, 자바에는 SE, EE, ME 등 여러가지 에디션을 제공한다.
- **Java SE(Standard Edition)**
  - 가장 널리 쓰이는 Java API의 집합이다. 기본적인 Java 플랫폼
- **Java EE(Enterprise Edition)**
  - Java SE 플랫폼을 기반으로 그 위에 탑재되며 서버측 개발을 위한 플랫폼
- **Java ME(Micro Edition)**
  - 모바일 폰과 같이 보다 제한된 자원을 가진 디바이스를 지원하기 위한 플랫폼

이렇게 스프링 프레임워크는 자바를 기반으로 한 기술이다. 자바 플랫폼을 위한 오픈소스이며 간단히 스프링(Spring)이라고 불린다.
동적(Dynamic)인 웹 사이트를 구축하기 위해 여러가지 서비스를 개발하고 있고 우리나라 공공기관의 웹 서비스 개발에 사용을 권장하고 있는
전자정부 표준 프레임워크의 기반 기술로 사용되고 있다.


<br/>

# 스프링의 핵심 철학
> "스프링의 핵심 철학은 객체지향의 기본으로 돌아가자는 것"

그만큼 오브젝트(객체)에 관심이 많고 그 관심은 오브젝트 설계와 구현에 관한 여러가지 기술과 지식을 요구한다.

- **리팩토링(Refactoring)**
  - 조금 더 깔끔한 구조가 되도록 지속적으로 개선해나가는 작업
- **디자인 패턴(Design Pattern)**
  - 다양한 목적을 위해 재활용 가능한 설계 방법
- **단위 테스트(Unit Test)**
  - 오브젝트가 기대한대로 동작하고 있는지 검증하는 작업
  
이렇듯 스프링은 쉽게 적용할 수 있도록 프레임워크 형태로 제공해준다. 여러 책과 참고자료에서도 언급되는 내용이지만 스프링 프레임워크를 알아보기 전에는
오브젝트, 객체지향(Object Oriented)에 대한 내용을 먼저 이해하는 것이 좋다.

간단한 DAO(Data Access Object)를 코드로 작성하고 이를 개선하는 과정을 거쳐 이해해보자. 우선 사용자 정보를 담을 User 클래스를 선언한다.

```java
package post.springframework.chapter1;

/**
 * 사용자 정보를 저장할 클래스
 *
 * @author Kimtaeng
 */
public class User {
    private String id;
    private String name;
    private String password;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
```

이어서 사용자 정보를 기반으로 Database와 직접적인 연결을 하는 UserDAO 클래스를 정의한다.

```java
package post.springframework.chapter1;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * @author Kimtaeng
 */
public class UserDAO {
    public void add(User user) throws Exception {
        // JDBC 연결하여 Connection을 가져온다.
        Class.forName("com.mysql.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");

        PreparedStatement psmt = conn.prepareStatement("insert into users(id, name, password) values(?. ?. ?)");
        psmt.setString(1, user.getId());
        psmt.setString(2, user.getName());
        psmt.setString(3, user.getPassword());

        // 사용자 정보를 저장한다.
        psmt.executeUpdate();
        psmt.close();
        conn.close();
    }

    public User get(String id) throws Exception {
        // JDBC를 연결하여 Connection을 가져온다.
        Class.forName("com.mysql.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");

        PreparedStatement psmt = conn.prepareStatement("select * from users where id =?");
        psmt.setString(1, id);

        // DB에서 사용자 정보를 가져온다.
        ResultSet rs = psmt.executeQuery();
        rs.next();

        User user = new User();
        user.setId(rs.getString("id"));
        user.setName(rs.getString("name"));
        user.setPassword(rs.getString("password"));

        rs.close();
        psmt.close();
        conn.close();

        return user;
    }
}
```

그리고 이제 위 코드를 실제로 테스트할 Main 클래스와 메서드를 작성한다.

```java
package post.springframework.chapter1;

/**
 * @author Kimtaeng
 */
public class Main {
    public static void main(String[] args) throws Exception {
        UserDAO userDAO = new UserDAO();

        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");

        userDAO.add(user);
        System.out.println(user.getId() + " : Complete!");
    }
}
```

위 코드를 실행하면 정상적으로 동작하지만 객체지향의 관점에서 본다면 생각보다 문제가 많은 코드이다.
DB Connection을 가져오는 **코드가 메서드마다 중복**되기 때문이다.
아직은 `add` 메서드와 `get` 메서드만 있어서 문제가 커보이지는 않지만 나중에는 더 많은 메서드에서 코드 중복이 발견될 수 있다.

<br/>

# 리팩토링
> "리팩토링, 조금 더 깔끔한 구조가 되도록 지속적으로 개선해나가는 작업"

메서드마다 중복되는 커넥션을 가져오는 코드 부분을 개선해보자. 공통의 공통의 기능을 담당하는 메서드로 중복된 코드를 뽑아내는 **메서드 추출기법**을 사용한다.

```java
public void add(User user) throws Exception {
    Connection conn = getConnection();
    // 이하 코드 생략
}

public User get(String id) throws Exception {
    Connection conn = getConnection();
    // 이하 코드 생략
}

/**
 * 중복된 코드를 하나의 메서드로 정의한다.
 */
private Connection getConnection() throws Exception {
    // JDBC를 연결하여 Connection을 가져온다.
    Class.forName("com.mysql.jdbc.Driver");
    Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");
    return conn;
}
```

메서드 추출이라는 리팩토링으로 중복되는 코드를 이전보다 개선하였지만 여전히 문제점은 남아있다.
만일 DB 커넥션을 가져오는 방법이 변경되거나 기존 메서드와 다르게 구현해야 한다면 어떻게 될까?

추가적인 개선을 진행하기 전에 먼저 살펴보고 가야 할 부분이 있다.

<br/>

# 디자인 패턴
> "디자인 패턴, 다양한 목적을 위해 재활용 가능한 설계 방법"

바로 디자인 패턴을 접목해 볼 수 있다.

- **템플릿 메서드 패턴**
  - 슈퍼 클래스에서 정의한 기본 로직을 서브 클래스에서 필요에 맞게 구현해서 쓰는 방법

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-1.png"
width="700" alt="template method pattern"/>

<br/>

- **팩토리 메서드 패턴**
  - 오브젝트 생성 방법을 기본 코드에서 독립시키는 방법

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-2.png"
width="700" alt="factory method pattern"/>

<br/>

기존의 UserDAO 클래스를 추상 클래스로, Connection을 가져오는 부분을 추상 메서드로 정의하고 이를 상속을 통해 서브 클래스에서 구현하도록 바꿔보자.

```java
// 생략...
public abstract class UserDAO {
    /**
     * 추상 메서드로 만든다. (템플릿 메서드 패턴)
     * 기능의 일부를 추상 메서드로 만들고
     * 서브 클래스에서 필요에 맞게 구현하도록 한다.
     */
    public abstract Connection getConnection() throws Exception;
}
```

```java
package post.springframework.chapter1;

import java.sql.Connection;
import java.sql.DriverManager;

/**
 * @author Kimtaeng
 */
public class MyUserDAO extends UserDAO {

    /**
     * 서브 클래스에서 오브젝트를 결정한다. (팩토리 메서드 패턴)
     * 어떤 Connection 클래스의 오브젝트를 어떻게 생성할 것인지 결정한다.
     * 그러니까, 서브 클래스에서 오브젝트 생성 방법을 결정한다.
     */
    public Connection getConnection() throws Exception {
        // JDBC를 연결하여 Connection을 가져온다.
        Class.forName("com.mysql.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");
        return conn;
    }
}
```

지금보니 이전보다 조금 더 낫다. DB연결 방법은 각 서브 클래스에서 슈퍼 클래스를 상속받아 구현하면 된다. 하지만 아직도 문제점은 남아있다.

- **자바는 다중 상속을 허용하지 않는다.**
  - 단순히 커넥션 객체를 가져오는 방법을 분리하기 위해 상속구조로 만들면 차후에 다른 목적으로 UserDao에 상속을 적용하기 어렵다.

- **상속을 통한 슈퍼 클래스와 서브 클래스의 관계는 밀접하다.**
  - 슈퍼 클래스 내부의 변경이 있을 때 모든 서브 클래스를 수정하거나 다시 개발해야 할 수도 있다.
  
- **DB 커넥션을 생성하는 코드를 UserDAO가 아닌 다른 DAO 클래스에 적용할 수 없다.**
  - UserDAO 외의 DAO 클래스들이 계속 만들어진다면 그때는 상속을 통해서 만들어진 getConnection 메서드의 구현 코드가
    매 DAO 클래스마다 중복됩니다. (추상 메소드니까...)


슈퍼 클래스의 변경이 있다면 서브 클래스의 변경을 피할 수 없다. 그러니까 차후 다른 목적으로 상속을 적용하기 어려운 점이 생긴다.
이럴 때는 어떻게 해야 할까?

<br/>

# 독립된 클래스로 분리
> 메서드로 빼내기도 해보고 상속도 시켜봤는데...

모든 객체(Object)는 변한다. 특히 모두 동일한 방식이 아닌 각자 독특한 변화의 특징을 갖고 변한다.
앞서 **독립된 메서드**로 만들어서 분리도 시도했고 **상속 관계의 클래스로** 분리까지 해봤다. 이번에는 **완전히 독립된 클래스로** 만들어서 문제를 해결해보자.

```java
package post.springframework.chapter1;

import java.sql.Connection;
import java.sql.DriverManager;

/**
 * @author Kimtaeng
 */
public class SimpleConnectionMaker {
    /* 
     * 추상 클래스로 만들 필요가 없다.
     * 더 이상 상속을 이용한 확장 방식을 사용할 필요가 없다.
     */
    public Connection makeNewConnection() throws Exception {
        // JDBC를 연결하여 Connection을 가져온다.
        Class.forName("com.mysql.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");
        return conn;
    }
}
```

```java
package post.springframework.chapter1;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * @author Kimtaeng
 */
public class UserDAO {
    private SimpleConnectionMaker simpleConnectionMaker;

    public UserDAO() {
        /*
         * 한 번만 만든다.
         * 상태를 관리하는 것도 아니니까 한 번만 만들어
         * 인스턴스 변수에 저장해두고 메서드에서 사용하게 한다.
         */ 
        simpleConnectionMaker = new SimpleConnectionMaker();
    }

    public void add(User user) throws Exception {
        // 기존 코드들
    }

    public User get(String id) throws Exception {
        // 기존 코드들
    }
}
```

이제 완전히 독립된 클래스로 만들어보았다. 이제 슬슬 문제점이 자연스럽게 보인다. 생성자(Constructor)에서 특정 클래스를 호출해서 객체를 생성하는
방법은 `특정 클래스와 코드에 종속`이 된다는 것이다. 이부분도 멀리 본다면 자유롭게 확장하기 어려운 부분으로 작용할 수 있다.

<br/>

# 인터페이스
> 자바는 어떤 것들의 공통적인 성격을 뽑아내어 따로 분리해내는 작업인 추상화를 위해 인터페이스라는 기능을 제공한다.

조금씩 더 나아보이는 모습을 찾아가고 있다. 이번에는 자바에서 제공하는 인터페이스를 이용해 추상화를 적용해볼 차례다.
**추상화(Abstraction)**란 어떤 것들의 공통적인 성격을 뽑아내어 이를 따로 분리해내는 작업을 말한다. 추상적인 느슨한 연결고리를 만드는 것이다.

```java
/**
 * @author Kimtaeng
 */
public interface ConnectionMaker {
    public Connection makeNewConnection() throws Exception;
}
```

```java
public class SimpleConnectionMaker implements ConnectionMaker {

    public Connection makeNewConnection() throws Exception {
        // JDBC를 연결하여 Connection을 가져온다.
        Class.forName("com.mysql.jdbc.Driver");
        Connection conn = DriverManager.getConnection("jdbc:mysql://localhost/madplay", "root", "");
        return conn;
    }
}
```

```java
public class UserDAO {
    private ConnectionMaker connectionMaker;

    public UserDAO() {
        connectionMaker = new SimpleConnectionMaker();
    }

    public void add(User user) throws Exception {
        Connection conn = connectionMaker.makeNewConnection();
        // 코드 생략
    }

    public User get(String id) throws Exception {
        Connection conn = connectionMaker.makeNewConnection();
        // 코드 생략
    }
}
```

인터페이스를 도입하여 조금 더 느슨한 연결고리를 만들어냈지만 여전히 생성자에서 특정 클래스의 이름이 등장한다.
그렇기때문에 아직까지도 필요할때마다 생성자 메서드를 수정해서 사용하는 문제가 남아있다.

<br/>

# 책임의 분리, 결합도와 응집도
> 책임을 떠넘기자. 어차피 내가 꼭 해야 할 것도 아닌데 필요한 곳에서 부담하면 된다.

그렇다. DAO는 객체 생성에 대한 결정을 할 이유가 없다. 그렇기 때문에 클라이언트에게 객체 생성의 책임을 넘기면 된다.

```java
public class UserDAO {
    private ConnectionMaker connectionMaker;

    public UserDAO(ConnectionMaker connectionMaker) {
        this.connectionMaker = connectionMaker;
    }

    public void add(User user) throws Exception {
        Connection conn = connectionMaker.makeNewConnection();
        // 코드 생략
    }

    public User get(String id) throws Exception {
        Connection conn = connectionMaker.makeNewConnection();
        // 코드 생략
    }
}
```

```java
public class Main {
    public static void main(String[] args) throws Exception {
        /*
         * 사용할 ConnectionMaker 구현 클래스를 결정하고 오브젝트를 만든다.
         * 변경되는 부분을 클라이언트에게!
         */
        ConnectionMaker connectionMaker = new SimpleConnectionMaker();

        /*
         * 사용할 ConnectionMaker 타입의 오브젝트를 제공한다.
         * 결국 두 오브젝트 사이의 의존관계 설정 효과
         */
        UserDAO userDAO = new UserDAO(connectionMaker);

        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");

        userDAO.add(user);
        System.out.println(user.getId() + " : Complete!");
    }
}
```

초기의 DAO와 비교하면 생각보다 많은 개선을 적용했다. 그러면서 접목된 많은 객체지향의 기술이 있었는데 다시 정리해보자.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-3.png"
width="700" alt="open closed principle"/>

클래스나 모듈의 확장에는 열려 있어야 하고 변경에는 닫혀 있어야 한다는 **개방 폐쇄 원칙(Open Closed Principle)**은 응집도(Coherence)와
결합도(Coupling)의 측면으로도 설명할 수 있다. 높은 응집도와 낮은 결합도는 개방 폐쇄 원칙을 잘 지킨 것이라고 볼 수 있다.

- **응집도(Coherence)**
  - 모듈 내의 코드가 하나의 기능을 제공하기 위해 집중하는 정도를 말한다. 응집도가 높을수록 좋다. 
  
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-4.png"
width="700" alt="coherence"/>

<br/>

- **결합도(Coupling)**
  - 두 개의 모듈 사이의 연관관계, 모듈간 상호 의존하는 정도를 말한다. 결합도가 낮을수록 좋다.
  
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-5.png"
width="700" alt="coupling"/>

<br/>

한편으로 현재까지의 개선된 구조를 디자인 패턴 관점으로 보다면 **전략 패턴(Strategy Pattern)**이 적용되었다고 할 수 있다.
ConnectionMaker를 구현한 클래스가 전략이 되어 필요에 따라 전략을 바꿔 사용할 수 있게 되었다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-03-15-spring-framework-basic-design-pattern-6.png"
width="700" alt="coupling"/>