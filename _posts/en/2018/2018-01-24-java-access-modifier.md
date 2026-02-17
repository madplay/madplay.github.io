---
layout:   post
title:    Java Access Modifiers
author:   madplay
tags: 	  java accessmodifier
description: What access modifiers are there in Java? What's the difference between public, protected, private, and default access modifiers?
category: Java/Kotlin
comments: true
slug:     java-access-modifier
lang:     en
permalink: /en/post/java-access-modifier
---

# Access Modifiers
In Java, there are a total of 4 access modifiers: `public`, `protected`, `private`, and `default` which omits the access modifier.
Also, these access modifiers can be used on classes and members. However, `private` and `protected`
access modifiers are not applied to classes.

<br/>

# Access Modifiers and Classes
## public and Classes
When a class is declared with `public` access modifier, it can be used from any other class as shown below:

```java
public class MadPlay {
    /*
     * Since MadPlay class is declared as public,
     * it can be accessed from other classes.
     */
}

class MadLife {
    MadPlay madplay;

    public void someMethod() {
        madplay = new MadPlay();
    }
}
```

## default and Classes
What about classes declared with `default` access modifier? This refers to cases where classes are declared by omitting the access modifier.
In this case, only classes within the same package can access.

```java
package p1;

class MadPlay {

}

class MadLife {
    // Can access because it's in the same package.
    MadPlay madplay;

    public void someMethod() {
        madplay = new MadPlay();
    }
}
```

```java
package p2;

class MadMan {
    // Cannot use because it's in a different package.
    MadPlay madplay;
}
```

Looking at the above example, no error occurs in the MadLife class which is in the same package as the MadPlay class declared with `default` access modifier.
However, in the MadMan class in a different package, you may encounter error messages like `Cannot be accessed from outside package`.

<br/>

# Access Modifiers and Members
## public and Members
Examining cases where members are declared as `public`. They can be accessed from all classes, both inside and outside the package.
Of course, if they're not static members, you must access them after instantiation.

```java
package p1;

public class MadPlay {
    public String name;
    public void sayHi() {
        System.out.println("hello~");
    }
}

class MadLife {
    public void someMethod() {
        MadPlay madplay = new MadPlay();
        madplay.sayHi();
    }
}
```

```java
package p2;

import p1.MadPlay; // However, must import.

class MadMan {
    void someMethod() {
        MadPlay madplay = new MadPlay();
        madplay.sayHi();
    }
}
```

The MadPlay class declared as `public` has public member variables and methods. Since they're public, they can be freely accessed from classes declared in the same package.
Of course, they can also be accessed from classes declared in different packages. However, classes in different packages must
import the class made public, and this is only possible when the class to import is public.

## private and Members
Examining cases where members are declared as `private`. This access modifier basically means private. That is, it means
access is only possible by members inside the same class, and cannot be accessed from any other class.

```java
package p1;

public class MadPlay {
    private void sayHi() {
        System.out.println("Hi~");
    }
}

class MadLife {
    public void someMethod() {
        MadPlay madplay = new MadPlay();
        madplay.sayHi(); // error
    }
}
```

In this case, access is not possible even if in the same package. Access is only possible from the class itself.
Members or variables declared as private mean they're not exposed externally.

## protected and Members
Examining the behavior of members declared as `protected` in the same package. It means partial exposure, and access is possible
from all classes within the same package. Or, even if it's a class in a different package, if that class inherits it, access is possible.

```java
package p1;

public class MadPlay {
    protected void sayHi() {
        System.out.println("Hi~");
    }
}

class MadLife {
    public void someMethod() {
        MadPlay madplay = new MadPlay();
        madplay.sayHi();
    }
}
```

```java
package p2;

import p1.MadPlay;

class MadMan extends MadPlay {
    public void someMethod() {
        // Accessing MadPlay class's members.
        sayHi();

        // To access through instance, must instantiate the inherited object.
        MadMan madMan = new MadMan();
        madMan.sayHi();
    }
}

class Madness {
    public void someMethod() {
        MadPlay madplay = new MadPlay();

        // Error. Did not inherit.
        madplay.sayHi(); 
    }
}
```

As such, members declared as `protected` can only be accessed by classes in the same package or classes that inherit it.
What if the package path is ambiguous?

```java
package a.b.c;

public class ABC {
    public void sayHi() { ... }
    protected void callMe() { ... }
}
```

```java
package a.b.c.d;

import a.b.c.ABC;

public class ABCD {
    public void someMethod() {
        ABC abc = new ABC();
        abc.sayHi(); // Okay :D
        abc.callMe(); // Compile Error :(
    }
}
```

As expected, `protected` members cannot be accessed if not in the same package. The above example doesn't work even if the package paths are related.

## default and Members
Examining `default` which omits the access modifier. When the access modifier declaration is omitted, it means the member has default access modifier.
In this case, all classes within the same package can freely access.

```java
package p1;

public class MadPlay {
    void sayHi() { ... }
}

class MadLife {
    public void someMethod() {
        MadPlay madplay = new MadPlay();

        // Can access because in the same package
        madplay.sayHi();
    }
}
```

```java
package p2;

import p1.MadPlay;

class MadMan extends MadPlay {
    public void someMethod() {
        // Cannot access even if inherited
        sayHi();

        MadMan madMan = new MadMan();
        madMan.sayHi(); // Still cannot access
    }
}

class Madness {
    public void someMethod() {
        MadPlay madplay = new MadPlay();
        madplay.sayHi(); // Cannot access
    }
}
```

However, `default` access modifier differs from `protected` in that access is not possible even if inherited.
Access is only allowed if definitely in the same package.

<br/>

# Then Which Access Modifier?
You must understand that Java is an object-oriented language. Also, one characteristic of object orientation is Encapsulation. Unless it's a special case,
for data members, you should refrain from `public` declarations that expose them externally and declare them as `private` as much as possible.

However, declaring as `private` restricts free use. But you can use accessor (getter) and mutator (setter) methods that allow safe
access to member variables without breaking encapsulation principles.

Type | Target | Content | Notes
|:--:|:--:|:----:|:--:
public | Class, Member | Accessible from all external sources
protected | Member | Accessible only from same package or when inherited | **Cannot be applied to classes**
default | Class, Member | Accessible only when in the same package | Refers to cases where access modifier is omitted
private | Member | Accessible only internally | **Cannot be applied to classes**
