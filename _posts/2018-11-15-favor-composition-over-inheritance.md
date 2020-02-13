---
layout:   post
title:    "[이펙티브 자바 3판] 아이템 18. 상속보다는 컴포지션을 사용하라"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 18. Favor composition over inheritance" 
category: Java
comments: true
---

# 상속(extends)
상속은 코드를 재사용할 수 있는 강력한 수단이지만, 항상 최선이라고 할 수는 없습니다. 메서드 호출과 다르게 캡슐화를 깨드리기 때문인데요. 
상위 클래스의 구현이 바뀌면 이를 상속한 하위 클래스에도 영향이 있을 수 있기 때문입니다.

아래와 같이 HashSet을 확장한 MyHashSet 클래스가 있다고 가정해봅시다.

```java
public class MyHashSet<E> extends HashSet<E> {
    private int addCount = 0; // 추가된 원소의 개수

    @Override
    public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> c) {
        addCount = addCount + c.size(0;
        return super.addAll(c);
    }

    public int getAddCount() {
        return addCount;
    }
}

// 객체 생성 후 3개의 엘리먼트를 addAll 메서드로 추가
MyHashSet<String> mySet = new MyHashSet<>();
mySet.addAll(List.of("탱1","탱2","탱3"));

// 출력되는 값은?
System.out.println(mySet.getAddCount());
```

위의 코드를 실행하면 어떻게 될까요? addCount의 값이 3이 나올 것으로 기대했지만 실제로는 6이 반환됩니다.
원인은 바로 HashSet의 addAll 메서드가 add 메서드를 사용하여 구현되었기 때문입니다.

```java
// HashSet(AbstractSet)의 addAll 메서드
public boolean addAll(Collection<? extends E> c) {
    boolean modified = false;
    for (E e : c)
        if (add(e))
            modified = true;
    return modified;
}
```

그러니까 addAll 메서드에는 각 요소를 add 메서드를 호출해서 추가하므로 addCount를 증가시키는 코드가 없어야 합니다.

<br/>

# 어떻게 해야 안전할까?
메서드를 **재정의하는 것보다 새로 만드는 게** 조금 더 나을 수도 있습니다. 훨씬 더 안전한 방법이긴 하지만
위험 요소가 전혀 없는 것은 아닙니다. 만일 하위 클래스에 추가한 메서드와 시그니처가 같고 리턴 타입만 다르다면
그 클래스는 컴파일조차 되지 않을 겁니다. 물론 리턴 타입도 같다면 재정의가 되겠지요?

<div class="post_caption">여기서 메서드 시그니처는 메서드의 이름과 파라미터를 말합니다.</div> 

기존 클래스를 확장하는 대신에 새로운 클래스를 만들고 private 필드로 기존 클래스의 인스턴스를 참조하게 하면 됩니다.
**기존 클래스가 새로운 클래스의 구성요소로 쓰인다**는 뜻에서 이를 **컴포지션(Composition)**이라고 합니다.

새로운 클래스의 인스턴스 메서드들은 기존클래스에 대응하는 메서드를 호출해 그 결과를 반환합니다.
이를 전달(Forwarding)이라고 하며, 새 클래스의 메서드들은 전달 메서드라고 합니다.

이렇게 되면 새로운 클래스는 기존 클래스의 영향이 적어지고 기존 클래스 안에 새로운 메서드가 추가되어도 안전하게 됩니다.
위의 예제를 컴포지션과 전달 방식으로 변경해봅시다. 

```java
public class MySet<E> extends ForwardingSet<E>  {
    private int addCount = 0;

    public MySet(Set<E> set) {
        super(set);
    }

    @Override
    public boolean add(E e) {
        addCount++;
        return super.add(e);
    }

    @Override
    public boolean addAll(Collection<? extends E> collection) {
        addCount = addCount + collection.size();
        return super.addAll(collection);
    }

    public int getAddCount() {
        return addCount;
    }
}

public class ForwardingSet<E> implements Set<E> {
    private final Set<E> set;
    public ForwardingSet(Set<E> set) { this.set = set; }
    public void clear() { set.clear(); }
    public boolean isEmpty() { return set.isEmpbty(); }
    public boolean add(E e) { return set.add(e); }
    public boolean addAll(Collection<? extends E> c) { return set.addAll(c); }
    // ... 생략
}
```

다른 Set 인스턴스를 감싸고 있다는 뜻에서 MySet과 같은 클래스를 **래퍼 클래스**라고 하며
다른 Set에 계측 기능을 덧씌운다는 뜻에서 **데코레이터 패턴(Decorator Pattern)**이라고 합니다.
컴포지션과 전달의 조합은 넓은 의미로 위임(delegation)이라고 합니다만 엄밀히 따지면 래퍼 객체가
내부 객체에 자기 자신의 참조를 넘기는 경우에만 해당됩니다.

<br/>

# 그럼 언제 상속을 해야할까요?
클래스가 B가 클래스 A와 **is-a 관계**일때만 사용해야 합니다.
반드시 하위 클래스가 상위 클래스의 진짜 하위 타입인 상황에서만 쓰여야 합니다. 예를 들어 클래스 A를 상속하는
클래스 B를 만드려고 한다면, **"B가 정말 A인가?"** 를 생각해봐야 합니다. 
예를 들자면? 와인 클래스를 상속하는 레드 와인 클래스. 그리고 레드 와인은 와인입니다.

그 조건이 아니라면 A를 클래스 B의 private 인스턴스로 두면 됩니다.
그러니까, A는 B의 필수 구성요소가 아니라 구현하는 방법 중 하나일 뿐입니다.