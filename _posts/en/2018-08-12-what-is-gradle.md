---
layout:   post
title:    What is Gradle?
author:   Kimtaeng
tags: 	  java gradle
description: Let's learn about Gradle, a build tool based on Groovy that focuses on build automation and development support
category: Knowledge
date: "2018-08-12 21:23:12"
comments: true
slug:     what-is-gradle
lang:     en
permalink: /en/post/what-is-gradle
---

# What is Gradle?
Gradle is a build tool based on Groovy.
It's an open-source build tool that supplements disadvantages and combines advantages of previous generation build tools like `Ant` and `Maven`.

- <a href="https://github.com/gradle/gradle" target="_blank" rel="nofollow">
Reference Link: Gradle (github)</a>

## Ant
- Writes build scripts based on XML.
- Can freely specify build units.
- Simple and easy to use.
- Flexible but script management or build processes become complex when projects become large.
- Doesn't have a Lifecycle, so must define dependency relationships, etc. for each result.

## Maven
- Written based on XML.
- Concepts of Lifecycle and Project Object Model (POM) were introduced.
- Improved Ant's verbose build scripts.
- Convenient because declaring needed libraries in `pom.xml` automatically brings them into the project.
- Relatively high learning barrier.
- Can become complex when libraries depend on each other.

<br><br>

# Gradle Characteristics
Gradle was made by combining advantages of `Ant` and `Maven` we examined earlier. It provides various methods for dependency management and
uses DSL (Domain Specific Language) based on 'Groovy', a script language that runs on JVM, rather than XML language for build scripts.

**Groovy** has the advantage of being easy for Java developers to learn because its syntax is similar to Java, and using `Gradle Wrapper`,
you can build projects even on systems where Gradle is not installed.

You can even convert Maven's `pom.xml` to Gradle format, and since Maven's central repository is also supported,
you can bring and use all libraries as is.

<br><br>

# Using Gradle
Actually, you don't necessarily need to install Gradle. As seen in the characteristics earlier, you can use it through `Gradle Wrapper` even if `Gradle` is not installed.
But installing it to learn basic usage methods.

## Installing Gradle
Based on MacOS, it's convenient to simply use `brew`. Note that installed `JDK` or `JRE` version must be 8 or above.

```bash
$ brew install gradle
```

## build.gradle
After installation is complete, creating the build file `build.gradle`. The `build.gradle` file is called a build script,
and strictly speaking, it's called a Build Configuration Script.

It sets up configurations needed for builds like dependencies or plugin settings.

## Writing tasks
Now using `tasks`, which are execution work units of Gradle. Gradle basically executes by configuring tasks,
and configuring and writing tasks is the process of writing build scripts.

You can write `task` with the following structure.

```bash
task taskName {
    ... work
}
```

Writing a simple task that outputs strings. Write in the `build.gradle` file as follows.

```bash
task sayHello {
    println 'Hello Taeng'
}
```

## Executing tasks
Execute by entering `gradle task name` in terminal. The `gradle` command finds the `build.gradle` file at the current location.
When executing, giving the `-q(quiet)` option outputs only logs for errors.

```bash
$ gradle sayHello

gradle sayHello

> Configure project :
Hello Taeng

BUILD SUCCESSFUL in 609ms


# When -q option is given
$ gradle -q sayHello
Hello Taeng
```

<br><br>

# More Detailed Task Usage Methods
## doFirst, doLast
Used when you want to specify order within tasks. `doFirst` is the action performed first, and `doLast` is the action performed last.
Tasks execute configured actions in order.

```bash
task greeting {
    doFirst {
        println 'hello'
    }

    doLast {
        println 'bye'
    }
}
```

### Execution Result
```bash
$ gradle greeting

> Task :greeting
hello
bye
BUILD SUCCESSFUL in 598ms
1 actionable task: 1 executed
```

<br>

## Task Abbreviation
> The leftshift operator was removed in `Gradle 5.0`.

Tasks can be written in abbreviated form as below. `<<` is the same as `doLast`.

```bash
task hello << {
    println 'Hello world!'
}
```

<br>

## Tasks and Parameters
When executing tasks, you can pass parameters using `-Pparameter name=value`.

```bash
task sayHi {
    def loopCount = count.toInteger()
    for(def i in 1..loopCount) {
        println('LoopCount: ' + i)
    }
}
```

### Execution Result
```bash
$ gradle -q sayHi -Pcount=3
LoopCount: 1
LoopCount: 2
LoopCount: 3
```

<br>

## Setting Dependencies Between Tasks
When tasks execute, you can specify execution order by specifying dependencies. Use `dependsOn` to specify tasks to execute first.

```bash
task AAA(dependsOn:['BBB', 'CCC']) {
    doFirst {
        println('doFirst: AAA')
    }
    doLast {
        println('doLast: AAA')
    }
}

task BBB {
    doFirst {
        println('doFirst: BBB')
    }
    doLast {
        println('doLast: BBB')
    }
}

task CCC {
    doFirst {
        println('doFirst: CCC')
    }
    doLast {
        println('doLast: CCC')
    }
}
```

### Execution Result
```bash
$ gradle AAA

> Task :BBB
doFirst: BBB
doLast: BBB

> Task :CCC
doFirst: CCC
doLast: CCC

> Task :AAA
doFirst: AAA
doLast: AAA

BUILD SUCCESSFUL in 603ms
3 actionable tasks: 3 executed
```

<br>

## Calling Other Tasks
> execute was removed in `Gradle 5.0`.

```bash
task sayHi {
    doFirst {
        println('say Hi')
        tasks.sayBye.execute()
    }
}

task sayBye {
    doLast {
        println('say Bye')
    }
}
```

### Execution Result
```bash
$ gradle sayHi -q
say Hi
say Bye
```

<br>

## User-Defined Methods
You can define and use methods directly.

```bash
task methodTask {
    printMessage('say Hi')
}
 
String printMessage(String msg) {
    println msg
}
```

### Execution Result
```bash
$ gradle methodTask

> Configure project :
say Hi

BUILD SUCCESSFUL in 593ms
```

<br>

## User-Defined Variables
Not only methods but also variables can be defined and used.
```bash
task someTask {
    ext.message = 'say Hi'
}
 
task sayHi {
    println someTask.message
}
```

### Execution Result
```bash
$ gradle -q sayHi
say Hi
```
