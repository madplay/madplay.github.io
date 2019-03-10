---
layout:   post
title:    전략 패턴(Strategy Pattern)
author:   Kimtaeng
tags: 	  DesignPattern
description: 객체의 동작을 클래스로 캡슐화하여 동적으로 자유롭게 바꿀 수 있게 해주는 패턴
category: DesignPattern
date: "2018-03-10 01:04:32"
comments: true
---

# 전략 패턴이란?
간단히 얘기하면 행위 또는 동작을 클래스로 정의하고 동적으로 바꿀 수 있게 하는 파턴을 말한다.
조금 더 풀면, 객체의 행위를 클래스로 정의하고 유사한 것끼리 묶어(캡슐화하여) 객체의 행위를 변경하고 싶을 때 바꿔주기만 하면 된다.
이로써 로직 변경이나 기능이 추가될 때 조금 더 유연하게 확장할 수 있다.

<br>

# 예를 들어보자
군용 미사일에는 지대공, 공대공, 대전차용 미사일 등이 있다. 군용 자산인 폭격기(Bomber)는 공대지 미사일과 대전차 미사일을 사용하고
전투기(Fighter)의 경우는 공대공 미사일과 대전차 미사일을 사용한다. 실제로는 여러 무기를 동시에 사용할 수 있겠지만 전략 패턴을 알아보기 위해
공격할 때마다 미사일 유형을 변경해야 한다고 가정해보자.

여기서 전략(strategy)은 미사일이 된다. 미사일 전략을 캡슐화하여 클래스로 정의하고 변경이 필요할 때마다 바꿔줄 것이다.
이를 코드로 구현해보자.

<br>

# 구조 살펴보기
먼저 구현할 전략 패턴의 구조를 클래스 다이어그램으로 확인해보자.

전략 패턴의 전략(strategy)이 되는 인터페이스를 정의하고 이를 구현하여 여러 종류의 미사일 전략을 만든다.
그리고 이 전략을 사용하는 폭격기와 전투기도 클래스로 정의한다. 물론 이들은 수퍼 클래스로 `Unit`를 상속하며 수퍼 클래스에는 전략을 사용하는
`missileAttack` 메서드가 정의되어 있다.

<img class="post_image" width="700" alt="The class diagram of strategy pattern"
src="{{ site.baseurl }}/img/post/2018-03-10-strategy-pattern-1.jpg"/>


<br>

# 코드로 구현해보기
전략 패턴을 자바(Java) 언어를 이용하여 구현해보자. 

먼저, 전략(Strategy)를 정의한다.
행위를 묶어 캡슐화할 수 있는 인터페이스를 먼저 정의하고 각 전략 클래스가 이를 구현(implements) 하도록 한다.

```java
public interface MissileStrategy {
	void doAttack();
}

class AntiTankMissile implements MissileStrategy {

	@Override
	public void doAttack() {
		// 대전차 미사일
	}
}

class AirToSurfaceMissile implements MissileStrategy {

	@Override
	public void doAttack() {
		// 공대지 미사일
	}
}

class AirToAirMissile implements MissileStrategy {

	@Override
	public void doAttack() {
		// 공대공 미사일
	}
}
```

다음으로 미사일을 사용하는 유닛을 정의한다. `Unit` 클래스를 정의하고 이를 상속하는 폭격기(Bomber)와 전투기(Fighter)를 정의한다.

```java
public class Unit {
	private MissileStrategy strategy;

	public void missileAttack() {
		strategy.doAttack();
	}

	public void setMissileStrategy(MissileStrategy missileStrategy) {
		this.strategy = missileStrategy;
	}
}

class Bomber extends Unit {
  // 폭격기
}

class Fighter extends Unit {
  // 전투기
}
```

마지막으로 전략 패턴을 사용하는 코드를 작성한다. 

```java
public class StrategyPatternTest {
	public static void main(String[] args) {
		Unit fighter = new Fighter();
		Unit bomber = new Bomber();

		// 전투기의 미사일 전략
		fighter.setMissileStrategy(new AntiTankMissile());

		// 폭격기의 미사일 전략
		bomber.setMissileStrategy(new AirToSurfaceMissile());

		fighter.missileAttack();
		bomber.missileAttack();

		// 전투기의 미사일 전략을 변경한다.
		fighter.setMissileStrategy(new AirToAirMissile());
		fighter.missileAttack();
	}
}
```

전략 패턴을 직접 사용하는 코드를 보면, 이 패턴의 장점을 파악하기 쉽다. 새로운 미사일 전략이 추가되었을 때, 그러니까 변경사항이 발생한다면
클라이언트 코드는 수정할 필요 없이 새로운 `Strategy` 클래스만 정의하여 기존의 `MissileStrategy` 인터페이스를 구현하도록 하면 된다.