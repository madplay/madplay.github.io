---
layout:   post
title:    Java References and Garbage Collection
author:   Kimtaeng
tags: 	  Java Garbage GC Reference
description: Following Garbage Collection, learning about object references of Java references.
category: Java
comments: true
slug:     java-garbage-collection-and-java-reference
lang:     en
permalink: /en/post/java-garbage-collection-and-java-reference
---

# Object References of Java References
We usually create objects using the `new` operator as shown in the code below. And this typical object reference method is called **Strong Reference**.

```java
/**
 * Test for Java References
 *
 * @author Kimtaeng
 * Created on 2018. 4. 2.
 */
public class JavaReferenceTest {
    public static void main(String[] args) {
        /* Strong Reference. */
        MadPlay object = new MadPlay();
        object.sayHello();
    }
}

class MadPlay {
    public void sayHello() {
        System.out.println("Hello MadPlay!");
    }
}
```

Initial Java was implemented so that user code didn't interfere with Garbage Collection execution.
But **from JDK 1.2, through the java.lang.ref package**, we became able to communicate with Garbage Collector to some extent.

This package provides reference methods called **Soft Reference**,
**Weak Reference**, and **Phantom Reference** as classes, in addition to **Strong Reference**, the typical object reference method we saw earlier.

Through this, developers became able to interfere with Garbage Collection a bit more.
And objects created by the Reference classes mentioned above are called Reference Objects.

- <a href="http://www.pawlan.com/monica/articles/refobjs/" target="_blank" rel="nofollow">Link: Reference Object</a>

<br/>

# Garbage Judgment Criteria
Garbage Collection applies a concept called **Reachability** to judge whether specific objects are garbage or not.
If objects don't have valid references, they're classified as Unreachable and collected. If there are references, they're classified as Reachable.

It would be nice if object references were simple, but one object can reference various different objects, and those objects can also reference other objects.
In such cases, to identify if there are valid references, there must be **always valid initial references**, which is called `Root Set`.

It's really difficult trying to understand with just difficult words and theory. To understand more clearly, examining it with a diagram:
In the diagram below, we assume all object references are Strong References.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-02-java-garbage-collection-and-java-reference-1.png"
width="600" alt="Garbage Collector will be busy"/>


Even though the diagram is complexly intertwined, first, if we classify Reachable with valid references and Unreachable that become Garbage Collector's targets, what happens?

<br/>

If we color them to distinguish, it's as follows. Green is Reachable and red is Unreachable.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-02-java-garbage-collection-and-java-reference-2.png"
width="600" alt="Reachable and Unreachable"/>

<br/>

Here's another thing: even if Unreachable objects reference Reachable objects to avoid being collected by Garbage Collector,
if they themselves don't receive references, they're still classified as Unreachable.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-02-java-garbage-collection-and-java-reference-3.png"
width="600" alt="Unreachable"/>

<br/>

# java.lang.ref Package
Then what do Weak Reference, Soft Reference, and Phantom Reference that the `java.lang.ref` package mentioned earlier provides refer to?
First, examining Weak Reference:

```java
import java.lang.ref.WeakReference;

/**
 * Weak Reference Test.
 *
 * @author Kimtaeng
 * Created on 2018. 4. 2.
 */
public class JavaReferenceTest {
    public static void main(String[] args) {
        WeakReference<MadPlay> wr = new WeakReference<MadPlay>(new MadPlay());
        MadPlay madplay = wr.get();
    }
}

class MadPlay {
    public void show() {
        /* ... */
    }
}
```

<br/>

If we view the above code as a diagram, it would be as follows.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-02-java-garbage-collection-and-java-reference-4.png"
width="500" alt="Weak Reference"/>

<br/>

But what happens if we assign null to the madplay reference on line 12 in this state?

```java
import java.lang.ref.WeakReference;

/**
 * Weak Reference Test.
 *
 * @author Kimtaeng
 * Created on 2018. 4. 2.
 */
public class JavaReferenceTest {
    public static void main(String[] args) {
        WeakReference<MadPlay> wr = new WeakReference<MadPlay>(new MadPlay());
        MadPlay madplay = wr.get();
        
        /* Assign null. What happens? */
        madplay = null;
    }
}

class MadPlay {
    public void show() {
        /* ... */
    }
}
```

The MadPlay object created in the above code is only referenced by WeakReference. At this moment, this object is called a **Weakly Reachable Object**.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-04-02-java-garbage-collection-and-java-reference-5.png"
width="500" alt="assign null to Weak Reference"/>

To summarize, Garbage Collection proceeded by judging whether things were Reachable or conversely Unreachable,
and parts where developers couldn't intervene became able to interfere to some extent through the java.lang.ref package.

So in addition to Weakly Reachable we saw earlier, we became able to distinguish more finely as Strongly, Softly, Phantomly Reachable.
Since there's no limit on the number or form of references for one object, one object can be referenced by combinations of multiple References.
The important point is investigating paths for object references starting from `Root Set` and determining reachability for objects on those paths.

<br/>

# Reachability
Then what does each reachability mean?

- **Strongly Reachable**
  - Refers to things directly connected to Root Set.
  - There are no Reference Objects between Root Set and that object.

- **Softly Reachable**
  - Refers to objects among those that aren't Strongly Reference where at least one reference exists that passes only through Soft Reference without Weak or Phantom Reference.

- **Weakly Reachable**
  - Refers to objects among those that aren't Strongly or Softly Reachable where at least one reference exists that passes only through Weak Reference without Phantom Reference.

- **Phantom Reachable**
  - Refers to objects that don't correspond to Strongly, Softly, or Weakly Reachable objects.
  - That is, they've been finalized but memory hasn't been collected yet.
