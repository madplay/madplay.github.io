---
layout:   post
title:    Creating Java Executable Files
author:   madplay
tags: 	  Java JSmooth
description: Creating Java executable files using JSmooth.
category: Java
comments: true
slug:     java-make-runnable-jar
lang:     en
permalink: /en/post/java-make-runnable-jar
---

Creating Java executable files using JSmooth. You can download it by clicking the link below.
- <a href="https://sourceforge.net/projects/jsmooth/files/jsmooth/" target="_blank" rel="nofollow">Download JSmooth</a>

Then, assuming all preparation is complete, let's create a Java exe file using JSmooth.

<br/>

<div class="post_caption">1) Right-click the project in Eclipse and select Export.</div>
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-1.png" width="740" height="420" alt="Step1"/>

<br/>

<div class="post_caption">2) Select Runnable JAR file in the Export screen and click Next</div>
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-2.png" width="580" height="540" alt="Step2"/>

<br/>

<div class="post_caption">3) Set the execution environment in Launch Configuration.</div>
If you've run it at least once in Eclipse, the class containing main should be visible.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-3.png" width="590" height="550" alt="Step3"/>

<br/>

<div class="post_caption">4) Run JSmooth.</div>
In the Skeleton window, set the appropriate type. If you've configured a UI, select Windowed Wrapper.
I'm planning to make a program using Swing into an executable file, so I selected Windowed Wrapper.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-4.png" width="500" height="400" alt="Step4"/>

<br/>

<div class="post_caption">4-1) When Windowed Wrapper is selected</div>
Check Launch java app in the exe process at the bottom.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-5.png" width="740" height="560" alt="Step4-1"/>

<br/>

<div class="post_caption">5) Move to Executable.</div>
Executable Binary means the name of the created executable file (add .exe)
and Executable Icon is the icon of the executable file. Select the image you want to use.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-6.png" width="730" height="560" alt="Step5"/>

<br/>

<div class="post_caption">6) Move to Application.</div>
First, check Use an embedded jar in the Embedded jar settings box and select the jar file created in the previous step.
Then, in Application Settings, click the settings button and specify the class containing main.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-7.png" width="730" height="560" alt="Step6"/>

<br/>

<div class="post_caption">7) Select JVM version.</div>
You can specify only the minimum version. Then click the gear icon at the top!

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-8.png" width="730" height="560" alt="Step7"/>

<br/>

<div class="post_caption">8) Clicking the gear button shows the following screen.</div>
Enter the name of the executable file. (Be sure to add .exe)

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-02-01-java-make-runnable-jar-9.png" width="730" height="560" alt="Step8"/>

If everything went well up to here, the exe file will be created.
Sometimes JSmooth doesn't run or errors occur, but most causes are
when JDK is not installed or Java Path is not set correctly.
