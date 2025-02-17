---
layout:   post
title:    Strategy Pattern
author:   Kimtaeng
tags: 	  DesignPattern
description: A pattern that encapsulates object behavior into classes to dynamically and freely change them
category: DesignPattern
date: "2018-03-10 01:04:32"
comments: true
slug:     strategy-pattern
lang:     en
permalink: /en/post/strategy-pattern
---

# What is the Strategy Pattern?
Simply put, it's a pattern that defines behaviors or actions as classes and makes them dynamically changeable.
To explain more, it defines object behaviors as classes and groups similar ones together (encapsulates them), so when you want to change object behavior, you just swap them.
This allows more flexible extension when logic changes or features are added.

<br>

# Example
Military missiles include surface-to-air, air-to-air, anti-tank missiles, etc. Bombers, which are military assets, use air-to-surface missiles and anti-tank missiles,
and Fighters use air-to-air missiles and anti-tank missiles. In reality, multiple weapons can be used simultaneously, but to learn about the strategy pattern,
assume that missile types must be changed every time you attack.

Here, strategy becomes missiles. We'll encapsulate missile strategies and define them as classes, swapping them whenever changes are needed.
Implementing this in code:

<br>

# Examining the Structure
First, checking the structure of the strategy pattern we'll implement with a class diagram:

Define an interface that becomes the strategy (strategy) of the strategy pattern and implement it to create various types of missile strategies.
And define Bombers and Fighters that use these strategies as classes. Of course, they inherit `Unit` as a super class, and the super class has a
`missileAttack` method defined that uses strategies.

<img class="post_image" width="700" alt="The class diagram of strategy pattern"
src="{{ site.baseurl }}/img/post/2018-03-10-strategy-pattern-1.jpg"/>


<br>

# Implementing in Code
Implementing the strategy pattern using Java language:

First, define the Strategy.
First define an interface that can encapsulate behaviors, and have each strategy class implement (implements) it.

```java
public interface MissileStrategy {
	void doAttack();
}

class AntiTankMissile implements MissileStrategy {

	@Override
	public void doAttack() {
		// Anti-tank missile
	}
}

class AirToSurfaceMissile implements MissileStrategy {

	@Override
	public void doAttack() {
		// Air-to-surface missile
	}
}

class AirToAirMissile implements MissileStrategy {

	@Override
	public void doAttack() {
		// Air-to-air missile
	}
}
```

Next, define units that use missiles. Define a `Unit` class and define Bombers and Fighters that inherit it.

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
  // Bomber
}

class Fighter extends Unit {
  // Fighter
}
```

Finally, write code that uses the strategy pattern.

```java
public class StrategyPatternTest {
	public static void main(String[] args) {
		Unit fighter = new Fighter();
		Unit bomber = new Bomber();

		// Fighter's missile strategy
		fighter.setMissileStrategy(new AntiTankMissile());

		// Bomber's missile strategy
		bomber.setMissileStrategy(new AirToSurfaceMissile());

		fighter.missileAttack();
		bomber.missileAttack();

		// Change fighter's missile strategy.
		fighter.setMissileStrategy(new AirToAirMissile());
		fighter.missileAttack();
	}
}
```

Looking at code that directly uses the strategy pattern, it's easy to grasp the advantages of this pattern. When new missile strategies are added, that is, when changes occur,
client code doesn't need to be modified, and you just need to define a new `Strategy` class and have it implement the existing `MissileStrategy` interface.
