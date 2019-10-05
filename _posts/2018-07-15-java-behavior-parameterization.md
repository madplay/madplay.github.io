---
layout:   post
title:    자바와 행위 매개변수화(Behavior Parameterization)
author:   Kimtaeng
tags: 	  java parameterization lambda 
description: 어떻게 실행할 것인지 결정하지 않은 코드, 메서드에 코드를 전달해보자.
category: Java
comments: true
---

# 스펙을 또 바꿔달라고..?
개발을 진행하다보면 의도치 않은 변경사항을 만날 때가 있습니다.
취미로 토이 프로젝트(Toy Project)를 할 때도 만날 수 있고 회사나 학교에서 동료들과 같이 개발을 진행할때도
여러 요인에 의해서 예상하지 못한 변경사항을 만날 수 있고요.

개발 코드의 잦은 변경은 원치않는 `부작용(Side Effect)`을 만날 수 있는 계기가 되기도 합니다.
변경과 관련이 없는 코드가 다같이 섞여있다면 예상치 못한 오류가 발생할 가능성은 더 높겠지요.
개발자에게는 겁나는 부분이기도 할 것이고요. (하지만 변경을 두려워하면 안됩니다...)

**변하는 부분과 변하지 않는 부분을 분리하는 것** 이라는 중요한 소프트웨어 설계 원칙처럼
이번에 소개하는 자바에서의 행위 매개변수화(또는 동작 파라미터화, Behavior Parameterization)라는 개념은 자주 변경되는 요구사항에
조금 더 효과적으로 대응할 수 있는 방법이라고 볼 수 있습니다.

아래 이어지는 요구사항과 코드를 보며 어떠한 개념인지 알아봅시다.
  - 책(Book)은 색상(color)과 페이지 수(page) 정보를 갖습니다.
  - 책의 색상이 빨간색(red)인 것만 골라내야 합니다.

```java
import org.apache.commons.lang3.StringUtils;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * @author Kimtaeng
 * Created on 2018. 7. 15.
 */
public class Test {
    static List<Book> filterBooksByColor(List<Book> bookList) {
        List<Book> redBookList = new ArrayList<>();
        for (Book book : bookList) {
            // 걸러내자!
            if(StringUtils.equals(book.getColor(), "red")) {
                redBookList.add(book);
            }
        }
        return redBookList;
    }

    public static void main(String[] args) {
        List<Book> bookList = Arrays.asList(
            new Book("MadPlay", "green", 500), new Book("Hello", "red", 300));
            
        // color가 red인 책만!
        filterBooksByColor(bookList);
    }
}

class Book {
    private String title;
    private String color;
    private int page;

    Book(String title, String color, int page) {
        this.title = title;
        this.color = color;
        this.page = page;
    }
    
    public String getTitle() {
        return title;
    }

    public String getColor() {
        return color;
    }

    public Integer getPage() {
        return page;
    }
}
```

코드 자체만 보면 참 심플합니다. 15번 라인에서 책의 color 값을 비교하여 빨간색인 것만 골라내고 있습니다.
만일 스펙이 바뀌어 빨간색이 아닌 초록색으로 되었다면 위의 라인만 변경하면 됩니다.

하지만 이는 지속적으로 변경에 대해서 대응을 해줘야하는 단점이 있습니다. 특정 색상으로만 골라낼 수 있도록
코드 상에서 하드 코딩을 했는데 또 변경을 요청한다면 코드의 직접적인 수정이 필요하지요.

색상을 파라미터로 넘기는 것은 어떨까요? 아래와 같이 말입니다.

```java
/**
 * 그나마... 낫구나
 */
static List<Book> filterBooksByColor(List<Book> bookList, String color) {
    List<Book> redBookList = new ArrayList<>();
    for (Book book : bookList) {
        // 파라미터로 받아서 걸러내자!
        if(StringUtils.equals(book.getColor(), color)) {
            redBookList.add(book);
        }
    }
    return redBookList;
}
```

메서드 자체만 보았을 때 하드코딩하지 않아도 되어서 좋아졌습니다.
그런데 색상으로 구분이 아닌 페이지 수로 구분이 필요해지면 어떻게 될까요?
색상이 아닌 페이지 수를 받는 메서드를 하나 더 만들면 간단하게 해결되긴 합니다.

하지만 이러한 방법은 비슷한 코드가 중복되는 문제가 있지요. 만들어보면 조건을 검사하는 if문을 제외하고는
나머지 코드가 대부분 동일한 것을 알 수 있을 겁니다.

<br/>

# 필터 조건을 파라미터로 넣자
혹시나 소프트웨어 공학이나 개발 방법론에 대한 공부를 하다보면 **결합도(Coupling)**란 말을 들어볼 수 있으실텐데요.
조건 파라미터에 대한 예시를 들기도 전에 이번에 소개할 내용은 무엇인가 좋지 않다는 방법임을 아실겁니다.

<div class="post_caption">결합도란 모듈과 모듈간의 상호 의존하는 정도를 말한다. 낮을수록 이상적인 모듈화라고 할 수 있다.</div>

색상으로 필터링할 수도 있고 페이지 수로도 필터링할 수 있도록 하나의 메서드를 만들어봅시다.
물론, 앞서 말한 것처럼 어떤 것으로 필터링할지는 플래그 형태의 조건 파라미터로 넣어서 판단하고요.


```java
/**
 * 일단 안 좋다. 이렇게 하지말자.
 */
static List<Book> filterBooks(List<Book> bookList, String color, int page, boolean colorFlag) {
    List<Book> resultList = new ArrayList<>();
    for (Book book : bookList) {
        // 색상으로 골라내거나 페이지 수로 골라내거나
        if(colorFlag && StringUtils.equals(book.getColor(), color)
                || !colorFlag && book.getPage() > page) {
            resultList.add(book);
        }
    }
    return resultList;
}

...
// 호출은 이렇게!
List<Book> redBooks = filterBooks(bookList, "red", 0, true);
List<Book> manyPagesBooks = filterBooks(bookList, "green", 400, false);
```

이러한 코드는 좋지 않습니다. 어떤 필터링을 진행할지 구분하는 colorFlag라는 플래그 변수가
2가지 선택만 가능한 boolean이 아니더라도 더 끈끈한 `제어 결합도(Control Coupling)`가 생겨버린 상황에서
추가되는 변경에 대해서 유연하게 대응하기도 어렵겠지요.

<br/>

# 다른 방법은 없을까?
여러 동작을 받아 선택 조건을 결정할 수 있도록 해봅시다. 우선 인터페이스 정의부터!

```java
interface BookPredicate {
    boolean excute(Book book);
}
```

위에서 계속 길어질것만 같은 파라미터를 가진 메서드는 아래와 같이 변경됩니다.

```java
/**
 * 어떤 행동을 할지는 파라미터로 전달받는다.
 */
static List<Book> filterBooks(List<Book> bookList, BookPredicate predicate) {
    List<Book> resultList = new ArrayList<>();
    for (Book book : bookList) {
        if (predicate.excute(book)) {
            resultList.add(book);
        }
    }
    return resultList;
}
```

실행은 아래와 같이 하면 됩니다. 인터페이스를 구현하는 클래스 관련 코드가 많아지는 것이 보기 싫으니
우선 **익명 클래스(Anonymous Class)**로 구현하지요.

```java
/**
 * 나쁘지 않다. 변경에 대해 Predicate 부분만 구현해주면 된다. 
 */
List<Book> redBooks = filterBooks(bookList, new BookPredicate() {
    @Override
    public boolean excute(Book book) {
        return StringUtils.equals(book.getColor(), "red");
    }
});

List<Book> manyPagesBooks = filterBooks(bookList, new BookPredicate() {
    @Override
    public boolean excute(Book book) {
        return book.getPage() > 400;
    }
});
```

하지만 아직도! 조금 아쉬운 점이 보이긴 합니다. 익명 클래스로 구현한다고 하더라도
코드만 본다면 내용이 같은 부분이 중복되니까요.

<br/>

# 람다 표현식
Java 8 버전부터는 `람다 표현식(Lambda Expression)`을 사용할 수 있습니다. 코드가 간결하게 바뀝니다. 직접 바꿔봅시다. 

```java
/*
 * 이랬던 코드가~
 */
List<Book> redBooks = filterBooks(bookList, new BookPredicate() {
    @Override
    public boolean excute(Book book) {
        return StringUtils.equals(book.getColor(), "red");
    }
});

/*
 * 이렇게 바뀝니다.
 */
List<Book> redBooks = filterBooks(bookList,
        book -> StringUtils.equals(book.getColor(), "red"));
```

코드의 길이뿐만 아니라 코드를 보기도 더 편한 것 같긴 합니다. 물론 개인마다 다를 수도 있지만요.

람다 표현식은 메서드(method)로 전달할 수 있는 익명 함수를 단순화했다고 볼 수 있습니다.
여기서 람다의 특징을 알 수 있는데, 우선 이름이 없으므로 익명성을 가집니다.
또한 메서드와 같이 특정 클래스에 종속되는 부분이 아니므로 함수라고 부릅니다.

람다는 아래와 같이 세 부분으로 구성됩니다.

- **파라미터 리스트**
  - 화살표(Arrow) 좌측에 위치하며 파라미터를 말합니다.
  - void 형태는 `() -> expression`처럼 작성하면 됩니다.
- **화살표**
  - 화살표는 람다의 파라미터 리스트와 바디를 구분합니다.
- **바디**
  - 바디(body)는 람다의 반환값에 해당되는 표현식을 말합니다.

람다에 대한 조금 더 자세한 표현 방법과 내용은 다른 포스팅을 통해서 다뤄봅시다.

<br/>

# 또 다른 방법은 없을까?
자바8에서 등장한 `Stream API`를 사용하면 리스트와 같은 컬렉션의 요소들을 걸러내는 작업의 코드가 매우 간결해집니다.
단순히 리스트(List)에서 특정 조건을 가진 요소들만 추출해낸다면 아래와 같이 몇 라인으로 끝납니다.

```java
/*
 * Stream 사용. 400 페이지 이상의 책만 골라낸다.
 */
bookList.stream()
    .filter(book -> book.getPage() > 400)
    .collect(Collectors.toList());
```

메서드 구현도 없이 몇 라인의 코드로 끝낼 수 있습니다. **걸러내고(filter) 모은다(collect) 리스트로(toList)** 어떻게 보면 읽기도 편한 것 같기도 합니다. 