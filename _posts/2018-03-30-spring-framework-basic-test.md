---
layout:   post
title:    "스프링 프레임워크 정리: 테스트"
author:   Kimtaeng
tags: 	  spring framework 
description: 테스트는 스프링을 학습하기 위한 가장 효과적인 방법 중 하나다.
category: Spring
comments: true
---

# 목차
- <a href="/post/spring-framework-basic-design-pattern" target="_blank">스프링 프레임워크 정리: 디자인 패턴 (링크)</a>
- <a href="/post/spring-framework-basic-inversion-of-control" target="_blank">스프링 프레임워크 정리: 제어의 역전 (링크)</a>
- 스프링 프레임워크 정리: 테스트

<br/>

# 테스트란 무엇일까?
테스트는 단어 그 자체처럼 의도하고 예상한 것처럼 그대로 동작하는지를 확인해보는 것을 말한다.

앞선 포스트에서 완성한 `UserDAO`에도 테스트를 접목할 수 있지만 웹 환경을 통해서 진행한다면 불편한 점이 많다.
서비스 계층도 만들어야 하고 입출력 기능은 대충이라도 만들어야 하고 서버도 구동해야 하기 때문이다.

이와같은 불편함은 작은 단위에만 집중하는 단위 테스트를 통해 해소할 수 있다.
여기서 말하는 단위라함은 충분히 하나의 관심에 집중해서 효율적으로 테스트할 만한 범위를 말한다.

한편 기존에 테스트 코드 역할을 했던(클라이언트의 역할을 했던) 클래스의 경우는 수동으로 확인해야 하는 문제점을 가지고 있다.
우선 테스트라는 역할에 맞도록 클래스 명을 `UserDAOTest`로 변경해보자.

```java
package post.springframework.chapter3;

import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericXmlApplicationContext;

/**
 * @author Kimtaeng
 */
public class UserDAOTest {

    /**
     * 문제가 있다.
     */
    public static void main(String[] args) throws Exception {
        ApplicationContext context =
                new GenericXmlApplicationContext("applicationContext.xml");
        UserDAO userDAO = context.getBean("userDAO", UserDAO.class);
        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");

        userDAO.add(user);
        System.out.println(user.getId() + " : Complete!");
    }
}
```

위의 코드를 보면 아쉬운 부분이 있다. 간단한 main 메서드이지만 DAO가 많아진다면 그에 대한 main 메서드 또한 많아질 것이다.
또한 현재의 코드로는 DB에 추가한 후에 다시 가져왔을 때 정상적으로 추가되었는지 확인해주지 않는다.

물론 코드의 마지막 부분에 가져온 User 객체의 id를 입력할 때 사용한 id와 비교하는 조건문으로 간단하게 확인은 가능하긴 하다.

<br/>

# JUnit
> JUnit은 자바로 단위 테스트를 만들 때 유용하게 쓸 수 있다.

현재까지 진행한 코드를 가지고 또 다른 DAO에 대한 테스트를 진행하려면 새로운 main 메서드가 필요하다.
한 두개 정도는 괜찮지만 그 개수가 많아지면 부담이 될 것이다. 이러한 부담은 JUnit을 통해 해결할 수 있다.

JUnit은 자바로 테스트를 진행할 때 유용하게 사용할 수 있도록 만들어졌다. 예시를 통해서 확인해보자.
기존에 main 메서드에 만들었던 코드들을 아래와 같이 수정할 수 있다.

```java
package post.springframework.chapter3;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.JUnitCore;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericXmlApplicationContext;

import static org.hamcrest.CoreMatchers.is;

/**
 * @author Kimtaeng
 */
public class UserDAOTest {
    @Test
    public void addAndGet() throws Exception {
        ApplicationContext context =
                new GenericXmlApplicationContext("applicationContext.xml");
        UserDAO userDAO = context.getBean("userDAO", UserDAO.class);
        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");
        userDAO.add(user);

        User user2 = userDAO.get(user.getId());

        Assert.assertThat(user2.getName(), is(user.getName()));
    }

    public static void main(String[] args) {
        JUnitCore.main("post.springbook.chapter3.UserDAOTest");
    }
}
```

JUnit을 사용하려면 아래와 같은 조건이 필요하다.

- 반드시 public 접근 지정자로 선언돼야 한다.
- 그리고 그 앞에 `@Test` 어노테이션을 선언하여 테스트 메서드임을 지정한다.

Maven 프로젝트를 사용한다면 pom.xml에 의존성을 추가해도 되고 그냥 간단히 classpath에 jar를 추가해도 된다.

테스트는 `assertEquals` 또는 `assertThat`과 같은 메서드를 통해서 검증할 수 있다.
이 메서드를 사용하기 위해서는 아래와 같이 import문 선언이 필요하다.

- `import static org.hamcrest.CoreMatchers.is;`
- `import static org.junit.Assert.assertThat;`

<br/>

# Test Driven Development
> 먼저 테스트 코드를 작성하고 테스트를 성공하게 해주는 코드를 작성한다.

테스트 주도 개발(Test Driven Development)을 TDD라고 짧게 줄여서 말하기도 한다. 
말그대로 테스트를 통해서 개발을 진행한다는 것인데 TDD에도 기본 원칙이 있습니다.

<div class="post_caption">"실패한 테스트를 성공하게 만드는 목적의 코드를 만든다."</div>

장점이라면 코드를 만들고 테스트를 실행하는 그 사이의 간격이 매우 짧다는 점이다. 개인의 관심사와 의견 차이가 있겠지만 테스트 주도 개발을 통해
조금 더 안정적인 개발을 할 수 있지 않을까 싶다. 물론 시간적인 여유가 필요하다.

<br/>

# 테스트 코드의 개선
main 메서드를 이용한 테스트 코드를 JUnit 프레임워크를 이용하도록 개선했지만 아직도 코드의 중복이라는 개선 포인트가 보인다. 이를 한번 더 개선해보자.

```java
package post.springframework.chapter3;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericXmlApplicationContext;

import static org.hamcrest.CoreMatchers.is;

/**
 * @author Kimtaeng
 */
public class UserDAOTest {

    private UserDAO userDAO;

    /**
     * @Test 메서드가 실행되기 전에 먼저 실행돼야 하는 메서드
     */
    @Before
    public void setUp() {
        ApplicationContext context =
                new GenericXmlApplicationContext("applicationContext.xml");
        userDAO = context.getBean("userDAO", UserDAO.class);
    }

    @Test
    public void addAndGet() throws Exception {
        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");
        userDAO.add(user);

        User user2 = userDAO.get(user.getId());

        Assert.assertThat(user2.getName(), is(user.getName()));
    }
}
```

애플리케이션 컨텍스트를 만들고 UserDAO 빈을 DI하는 부분이 생성되는 Test 메서드마다 중복되는데, 이를 개선하기 위해 별도 메서드로 추출하고
**테스트 메서드가 실행되기 전에 먼저 실행될 수 있도록** `@Before` 어노테이션을 메서드에 붙여주자.
그리고 JUnit 테스트로 동작하게 되면 main 메서드는 필요가 없어진다.

그렇다면 JUnit은 어떠한 수행 단계를 거칠까? 보편적으로 JUnit은 아래와 같은 테스트를 위한 과정을 진행한다.

- 먼저, 클래스에서 접근 지정자가 public이며 `@Test` 어노테이션이 붙어있고 반환형이 없는 void형이며 그리고 파라미터가 없는 테스트 메서드를 모두 찾는다.
- 그 다음으로 테스트 클래스의 오브젝트를 생성한다.
- 세 번째로 `@Before` 어노테이션이 붙은 메서드가 있으면 먼저 실행한다.
- 네 번째로는 `@Test` 어노테이션이 붙은 테스트 메서드를 1개 호출하고 결과를 저장한다.
- 다섯 번째로 `@After`가 붙은 메서드가 있으면 실행하고 남은 테스트 메서드에 대해 위 과정에서의 두 번째 ~ 다섯 번째 과정을 반복한다.
- 끝으로 모든 과정이 끝나면 모든 테스트의 결과를 종합해서 반환하게 된다.

`@Before`와 `@After` 메서드를 테스트 메서드에서 호출하지 않기 때문에 주고받을 정보나 오브젝트는 멤버 변수를 이용해야 한다.

그리고 독립된 테스트 실행을 보장하기 위해 각 테스트 메서드를 실행할 때마다 오브젝트를 새로 만드는 점도 알아야 한다.
이 부분에서 등장하는 새로운 용어가 **픽스처(fixture)**다. 테스트를 수행하는데 필요한 정보나 오브젝트를 말한다.

클래스의 인스턴스 변수에 선언해두고 `@Before` 메서드에서 생성하면 편리하다.

<br/>

# 스프링 테스트
앞서 살펴본 내용에서 조금 더 나아가 스프링에서 제공하는 기능들을 통해 테스트를 진행할 수 있다.
스프링 테스트를 위해서는 아래와 같은 어노테이션이 필요하다.

- `@Runwith`
  - JUnit 프레임워크의 테스트 실행 방법을 확장할 때 사용하는 어노테이션이다.
  - SpringJUnit4ClassRunner를 지정하면 JUnit이 테스트를 진행하는 중에 테스트가 사용할 애플리케이션 컨텍스를 만들고 관리하는 작업을 진행한다.

- `@ContextConfiguration`
  - 자동으로 만들어줄 애플리케이션 컨텍스트의 설정 파일의 위치를 지정한 것이다.
  
- `@Autowired`
  - 스프링의 DI에 사용되는 어노테이션이며 변수 타입과 일치한 컨텍스트 내의 빈을 찾고 존재한다면 주입해준다.
  - 참고로 스프링의 애플리케이션 컨텍스트는 초기화할 때 자기 자신도 빈으로 등록한다.

그럼 이제 어노테이션을 사용하여 스프링 테스트를 적용해보자.

```java
package post.springframework.chapter3;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

import static org.hamcrest.CoreMatchers.is;

/**
 * @author Kimtaeng
 */
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "/applicationContext.xml")
public class UserDAOTest {

    // 스프링 테스트 컨텍스트에 의해 자동으로 값이 주입된다.
    @Autowired
    private ApplicationContext context;
    private UserDAO userDAO;

    @Before
    public void setUp() {
        userDAO = this.context.getBean("userDAO", UserDAO.class);
    }

    @Test
    public void addAndGet() throws Exception {
        User user = new User();
        user.setId("madplay");
        user.setName("kimtaeng");
        user.setPassword("password");
        userDAO.add(user);

        User user2 = userDAO.get(user.getId());

        Assert.assertThat(user2.getName(), is(user.getName()));
    }
}
```

테스트가 진행될때마다 UserDaoTest의 오브젝트는 매번 다르지만 ApplicationContext 변수는 모두 동일하다.
그렇기 때문에 조금씩 테스트 수행 시간이 단축되는 것을 알 수 있습니다. 이유는 애플리케이션 컨텍스트가 만들어질 때의 시간 때문이다.

더 나아가 두 개의 클래스가 같은 설정 파일을 사용하는 경우에도 한 개의 애플리케이션 컨텍스트만 만들고 이를 공유한다.

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "/applicationContext.xml")
public class UserDAOTest {
    ...
}

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = "/applicationContext.xml")
public class YourDAOTest {
    ...
}
```

<br/>

# 기타 테스트
그 외의 살펴볼 내용으로는 학습 테스트와 버그 테스트가 있다.

**학습 테스트**는 자신이 만들지 않은 프레임워크 또는 다른 팀에서 만들어서 제공한 라이브러리에 대해서 테스트를 진행하는 것이다. 
주된 목적은 **기능 검증이 아닌 사용 방법 학습**이다.

**버그 테스트**는 버그가 원인으로서 테스트가 실패하는 코드를 만들고 테스트가 성공할 수 있도록 코드를 수정하는 목적을 갖고 있다.
**테스트가 성공한다면 버그는 해결**된다고 볼 수 있습니다.