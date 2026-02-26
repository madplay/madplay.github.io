---
layout:   post
title:    Multiple Tomcat Instances
author:   madplay
tags: 	  apache tomcat
description: How do you run multiple Tomcat instances?
category: Backend
comments: true
slug:     multiple-tomcat-instances
lang:     en
permalink: /en/post/multiple-tomcat-instances
---

# Tomcat Server Structure
Before running multiple Tomcat instances, let’s review the Tomcat server structure.
Tomcat can be split into the **engine** and the **instance**.
For version `8.0.38`, the directory layout looks like this.

```bash
$ tree -L 1
.
├── LICENSE
├── NOTICE
├── RELEASE-NOTES
├── RUNNING.txt
├── bin # directory with command scripts
├── conf # configuration files
├── lib # libraries
├── logs # logs
├── temp # temp files
├── webapps # web app deploy directory
└── work # compiled .class output
```

The **engine** modules are `bin` and `lib`, and the **instance** parts are
`conf`, `logs`, `temp`, `work`, and `webapps`.

The Tomcat engine actually runs the Java application, which means it starts a **Java Virtual Machine**.
So running multiple instances means running multiple Tomcat JVMs.

<br/>

# Tomcat Startup and Environment Variables
The `startup.sh` script in `bin` calls `catalina.sh`.

```bash
$ vi startup.sh

EXECUTABLE=catalina.sh
# ... omitted
exec "$PRGDIR"/"$EXECUTABLE" start "$@"
```

`catalina.sh` runs the Tomcat instance. If you run it, you can see the environment variables it uses.
(The example below runs on macOS.)

```bash
$ ./catalina.sh start

Using CATALINA_BASE:   /Users/madplay/Desktop/apache-tomcat-8.0.38
Using CATALINA_HOME:   /Users/madplay/Desktop/apache-tomcat-8.0.38
Using CATALINA_TMPDIR: /Users/madplay/Desktop/apache-tomcat-8.0.38/temp
Using JRE_HOME:        /Library/Java/JavaVirtualMachines/jdk1.8.0_73.jdk/Contents/Home
Using CLASSPATH:       /Users/madplay/Desktop/apache-tomcat-8.0.38/bin/bootstrap.jar:/Users/madplay/Desktop/apache-tomcat-8.0.38/bin/tomcat-juli.jar
Tomcat started.
```

To run multiple independent Tomcat instances, set `CATALINA_BASE` to the instance path
and `CATALINA_HOME` to the Tomcat engine path.

<br/>

# Running Multiple Tomcat Instances
Download and extract Tomcat. Then copy the directory until you have three copies.
As explained above, the engine only needs `bin` and `lib`, so each instance does not need them.
Each Tomcat instance only needs the instance directories.

A full layout looks like this:

```bash
$ tree -L 2
.
├── tomcat1
│   ├── conf
│   ├── logs
│   ├── temp
│   ├── webapps
│   └── work
├── tomcat2
│   ├── conf
│   ├── logs
│   ├── temp
│   ├── webapps
│   └── work
└── tomcat_main
    ├── bin
    └── lib
```

Each instance must run on different ports, so update `server.xml`.

```xml
<!-- server.xml in the conf directory -->
<Server port="8006" shutdown="SHUTDOWN">
    <!-- other parts omitted; assume only HTTP connections -->
    <Connector port="18081" protocol="HTTP/1.1"
            connectionTimeout="20000" redirectPort="8443" />
</Server>
```

Set different ports for `tomcat1` and `tomcat2`. The `<Server>` shutdown port also must be unique.

Now write a **startup script** for each instance. Name it `startup.sh` and place it in `tomcat1` and `tomcat2`.

```bash
#!/bin/sh

# Tomcat instance path - adjust per instance
export CATALINA_BASE=/Users/madplay/Desktop/multitomcat/tomcat1

# Tomcat engine path
export CATALINA_HOME=/Users/madplay/Desktop/multitomcat/tomcat_main 

# If each instance uses a different JDK
#export JAVA_HOME=${java path}

cd $CATALINA_HOME/bin
./startup.sh
```

To stop an instance, change the last line to `./shutdown.sh`.
You can name these scripts however you want.
Just keep the scripts in the engine `bin` directory unchanged and reuse them.
