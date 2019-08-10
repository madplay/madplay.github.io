---
layout:   post
title:    "MyBatis에서 샾(#{})과 달러(${})의 차이는 무엇일까?"
author:   Kimtaeng
tags: 	  mybatis
description: "마이바티스(MyBatis)에서 XML 파일에 쿼리문을 작성할 때, 샾(#{}) 기호와 달러(${}) 기호의 차이점은 무엇일까?" 
category: MyBatis
date: "2019-08-10 22:38:11"
comments: true
---

# 파라미터 문법이 다르다?
마이바티스(MyBatis)를 사용하는 프로젝트에서 mapper 쿼리문이 담긴 XML 파일을 보면 달러($) 기호를 또는 샾(#) 기호를 쉽게 찾을 수 있다.
이처럼 XML에 쿼리문을 작성할 때 파라미터 값을 설정하게 될텐데, 이때 `${}`과 `#{}`를 사용하게 된다.

그런데 이 둘은 용도가 다르기 때문에 명확히 구분해서 사용해야 한다. 어떤 차이점이 있는지 알아보자.

<br/>

# #{} 를 사용하면
우선 아래와 같이 샾(`#{}`)을 사용하여 쿼리문을 작성해보자.

```xml
<select id="select" resultType="String" parameterType="Map">
    SELECT
        name AS name
    FROM
        user
    WHERE
        id = #{id}
</select>
```

MyBatis에서 위와 같은 `#{}`이 사용된 쿼리문이 실행되면 아래와 같이 쿼리문에 `?`가 생기며 파싱된다.

```sql
SELECT
    name AS name, email AS email
FROM
    user
WHERE
    id = ?
```

쿼리문을 작성할 때 `#{}`을 사용하는 경우 `PreparedStatement`를 생성하게 되는데 위의 `?`에 파라미터가 바인딩되어 수행된다.
이렇게 **파싱된 쿼리문은 재활용(캐싱)되기 때문에 효율적**이다.

그리고 변수에 작은 따옴표(')가 자동으로 붙여 쿼리가 수행되기 때문에 `'#{id}'`와 같은 식으로 쿼리문을 작성하지 않아도 된다.
이러한 특성으로 테이블 설계가 `user_1`, `user_2`과 같이 분리되어 구성되어 있을 때, 아래와 같은 식으로는 작성할 수 없다.

```xml
<select id="select" resultType="String" parameterType="Map">
    SELECT
        name AS name
    FROM
        user_#{tableId}
    WHERE
        id = #{id}
</select>
```

위 쿼리문이 수행되면 `tableId` 변수 양쪽에 따옴표가 붙기 때문에 `SQLSyntaxErrorException` 오류가 발생한다.

<br/>

# ${} 를 사용하면
값이 넣어진 채로 쿼리문이 수행된다. 그렇기 때문에 파라미터의 값이 바뀔 때마다 항상 쿼리문 파싱을 진행해야 한다. 즉, 성능상의 단점이 존재한다.

그리고 쿼리문에 `#{}`을 사용한 것과 다르게 작은 따옴표(')가 붙지 않기 때문에 아래처럼 테이블 이름이나 컬럼 이름을 동적으로 결정할 때 사용할 수 있다.

```xml
<select id="select" resultType="String" parameterType="Map">
    SELECT
        name AS name
    FROM
        user_${id}
    WHERE
        id = #{id}
</select>
```

그리고 달러(`${}`)를 사용한 경우 `SQL Injection`에 취약한 점이 흠이다.

<br/>

# SQL Injection
상황에 따라서 달라질 수 있겠으나 보안을 고려한다면 `#{}`를 사용해야 한다. 
어떤 경우에 보안상 문제가 있을지 확인해보자. 우선 아래와 같은 쿼리문이 있다고 가정해보자.

```xml
<select id="selectUserFromTable" parameterType="Map" resultType="...">
    SELECT
        *
    FROM
        user
    WHERE
        id = '${id}' AND password = '${password}'
</select>
```

만일 `id` 파라미터의 값으로 `admin' -- `이 입력되는 경우 어떻게 될까? 실제 파싱되는 쿼리문은 아래와 같을 것이다.

```sql
SELECT
    *
FROM
    user
WHERE
    id = 'admin' -- 'AND password = ''
```

즉, `where` 절에서 비밀번호에 대한 조건은 사라지게 되어 id만 입력해도 관리자 계정 정보를 조회할 수 있게 된다.
이처럼 `${}`를 사용하게 되는 경우 `#{}`을 사용하는 것보다 `SQL Injection`에 취약하다.