---
layout:   post
title:    "[Effective Java 3rd Edition] Item 10. Obey the general contract when overriding equals"
author:   Kimtaeng
tags: 	  java effectivejava
description: "[Effective Java 3th Edition] Item 10. Obey the general contract when overriding equals"
category: Java
comments: true
slug:     obey-the-general-contract-when-overriding-equals
lang:     en
permalink: /en/post/obey-the-general-contract-when-overriding-equals
---

# First, the Conclusion About Overriding equals Is,
Don't override equals. Using the default equals method below.

```java
public boolean equals(Object obj) {
    return (this == obj);
}
```

Especially in cases like below, not overriding may be best.
- When it's a class that represents **objects that act, not values**
  - For example, when there's a Thread class, Object's equals method is sufficient.
  - It's more important to indicate that it's an acting object rather than values instances have.
- When **there's no need to check logical equality**
  - For example, checking if two Random objects create the same random sequence is meaningless.
- When it's a **private or package-private class** so the class's equals method should never be called
  - In such cases, you must override the equals method to prevent it from being called.

```java
@Override
public boolean equals(Object o) {
    throw new ~Exception(); // Prevent method call
}
```

<br/>

<div class="post_caption">But what is logical equivalence?</div>

Examining briefly. **You can omit this since it's not a part you must know**.

When the biconditional `p <-> q` of two propositions p, q is a tautology, propositions p, q are called **logical equivalence**.
Here, **tautology** refers to something that's always true for all combinations of true and false of each proposition.
For example, _"Give me death rather than not freedom"_ is the same as _"Give me freedom or death"_.

For example, when proposition p is _"not freedom"_, proposition q is _"give me death"_,

- When propositions p and q are true,
  - `p -> q` is if not freedom, give me death : true
  - `p^(p->q)` is not freedom AND (if not freedom, give me death) : true
  - `(p^(p->q))->q` is if (not freedom AND (if not freedom, give me death)), give me death : true
- When proposition p is true and proposition q is false,
  - `p->q` is if not freedom, give me death : false
  - `p^(p->q)` is not freedom AND (if not freedom, give me death) : false
  - `(p^(p->q))->q` is if (not freedom AND (if not freedom, give me death)), give me death : true

You can check more detailed and comprehensive content as below through Naver Knowledge Encyclopedia.

<img class="post_image" width="700" alt="tautology"
src="{{ site.baseurl }}/img/post/2018-10-10-obey-the-general-contract-when-ovveriding-equals-1.png"/>

Returning to the main topic, to compare values in Java language, doing as below.

```java
public boolean equals(Object obj) {
    if (obj instanceof Integer) {
        return value == ((Integer)obj).intValue();
    }
    return false;
}
```

But in cases like enum types, you don't need to override. Anyway, logically the same instances aren't created more than 2.
So logical equivalence and object identity essentially have the same meaning.

<br/>

# The equals Method...
Implements equivalence relations and satisfies the conditions below.

### **Reflexivity**
- For all reference values x that aren't `null`, `x.equals(x)` is true.
- It's harder to violate this.

### **Symmetry**
- For all reference values x, y that aren't `null`, if `x.equals(y)` is true, `y.equals(x)` is also true.
- If you still want to violate it, doing as below.

```java
public final class CaseInsensitiveString {
    private final String s;

    public CaseInsensitiveString(String s) {
        this.s = Objects.requireNonNull(s);
    }
    @Override
    public boolean equals(Object o) {
        if( o instanceof CaseInsensitiveString) {
            return s.equalsIgnoreCase((CaseInsensitiveString) o).s);
        }
        if ( o instanceof String) {
            return s.equalsIgnoreCase((String) o);
        }
    }
} 

// Execution?
CaseInsensitiveString cis = new CaseInsensitiveString("Media");
String s = "media";

cis.equals(s); // true
s.equals(cis); // false
```

### **Transitivity**
- For all reference values x, y, z that aren't `null`, if `x.equals(y)` is true and `y.equals(z)` is true, `x.equals(z)` is also true.

### **Consistency**
- For all reference values x, y that aren't `null`, repeatedly calling `x.equals(y)` always returns true or always returns false.

### **Not null**
- For all reference values x that aren't `null`, `x.equals(null)` is false.

```java
@Override
public boolean equals(Object o) {
    if(o ==null) {
        return false;
    }
    // ... omitted
}
```

<br/>

# If You Still Must Implement
If you must override the equals method while accepting all risks, following the rules below.

- Must check if input is a reference to yourself using the `==` operator.
  - If it's your own reference, must return true.
- Must check if the input variable is the correct type using the `instanceof` operator. If not, return false.
- Cast input to the correct type. Since we checked type above, it will definitely succeed.
- Compare if all corresponding **core** fields of the input object and yourself match.
  - If all fields match, return true, otherwise return false.
  - For primitive types except float and double, compare with `==` operator and
  - For float and double, compare with `Float.compare`, `Double.compare` for floating point, etc.
  - For reference type fields, compare with each equals method.
  
<br/>
  
# Applying to Code?
Applying to code while following the contracts we examined above is as below.

```java
public final class phoneNumber {
    private final short areaCode, prefix, lineNum;

    @Override
    public boolean equals(Object o) {
        if( o == this) {
            return true;
        }

        if( o == null) {
            return false;
        }

        if(!(o instanceof PhoneNumber)) {
            return false;
        }

        PhoneNumber pn = (PhoneNumber)o;
        return pn.lineNum == lineNum && pn.prefix == prefix
                        && pn.areaCode == areaCode;
    }
}
```

The important part is that you can't write equals methods that receive types other than Object as parameters. Of course, you can't override either.
In the case of File class, comparing symbolic links to check if they point to the same file is also dangerous.

```java
// Reference, File class
public int compare(File f1, File f2) {
        return f1.getPath().compareTo(f2.getPath());
}
```

As an example of **incorrectly overridden cases**, seeing the equals method of the Timestamp class in the `java.sql` package.
This class is a class made by inheriting the Date class of the `java.util` package, and examining the equals methods of the two classes is as below.

```java
// java.sql.Timestamp
public boolean equals(Timestamp ts) {
    if (super.equals(ts)) {
        if  (nanos == ts.nanos) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

public boolean equals(java.lang.Object ts) {
    if (ts instanceof Timestamp) {
        return this.equals((Timestamp)ts);
    } else {
        return false;
    }
}

// java.util.Date
public boolean equals(Object obj) {
    return obj instanceof Date && getTime() == ((Date) obj).getTime();
}
```

What happens if executing code like below for the code above?

```java
public void testMethod() {    
    Timestamp timestamp = new Timestamp(0L);
    Date date = new Date(timestamp.getTime());
    
    System.out.println(timestamp.equals(date)); // false
    System.out.println(date.equals(timestamp)); // true
}
```

**In Timestamp's equals method**, it becomes `false` due to the instanceof operator. Of course, even if you cast without type checking,
it will return false due to nanos value checking. **In Date's equals method**, it only checks if times are the same, so it becomes `true`.

That is, as we examined first, in conclusion, it's better not to override unless it's a really necessary situation.
