---
layout:   post
title:    Installing Jekyll on Windows 10 and Creating GitHub Blog
author:   Kimtaeng
tags: 	  jekyll windows github
description: Let's install Jekyll in Windows 10 environment and create a github blog
category: Knowledge
comments: true
slug:     install-jekyll-on-windows
lang:     en
permalink: /en/post/install-jekyll-on-windows
---

# Ah... Windows

I usually do blog posting with a MacBook, but today I **left my MacBook at the company**.
I happened to have content to organize... It was regrettable, and I think there will be more situations like this later, so
searching for methods to set up Jekyll in Windows environments.

Ruby download... environment variable settings, etc... There are so many things to install,
and just looking at them seems stressful, so finding a new method.

<br/>

# Let's Set It Up First!

First, going to Control Panel and the following settings are needed.
```Control Panel > ``` ```Programs and Features > ``` ```Turn Windows features on or off``` on the left > ```Checking ```Windows Subsystem for Linux``` in the popup window

This WSF (Windows Subsystem for Linux) feature is only provided in Windows 10, and the build version must also be a specific version (14316) or above.

After this work is complete, pressing the Windows key on the keyboard and searching for ```bash``` or pressing ```Windows + R``` keys and entering
```bash``` in the popup run window to execute.

If it doesn't proceed, proceeding after setting developer mode by going to ```Settings > ``` ```Update & Security > ``` ```For developers``` menu as below.
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-3.jpg" width="560" height="400" alt="windows developer mode"/>

<br/>

You might see text like below.
<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-1.jpg" width="560" height="400" alt="Windows Subsystem for Linux..."/>

<br/>

<a href="https://aka.ms/wslstore" rel="nofollow" target="_blank">Microsoft Store (Click to go)</a> or
running the Microsoft Store app directly and getting a Linux distribution. Installing Ubuntu.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-2.jpg" width="560" height="400" alt="linux in microsoft store"/>

<br/>

I don't know when I changed the settings... Cases where things got stuck didn't occur, but looking here and there, finding a guide.
If you've executed the bash shell normally, now just entering a few commands and setup is done.

<br/>

# Now Let's Install!

First, entering the following commands sequentially for maintaining the latest version and installing Ruby.
- ```sudo apt-get update -y && sudo apt-get upgrade -y```
- ```sudo apt-get install -y build-essential ruby-full```

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-4.jpg" width="560" height="400" alt="up to date"/>

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-5.jpg" width="560" height="400" alt="install ruby"/>

<br/>

Next, entering commands sequentially to update Ruby Gems and install Jekyll.

- ```sudo gem update --system```
- ```sudo gem install jekyll bundler```

After that, starting by creating a new directory with the ```jekyll {folder name}``` command.
If you already have a project on the Windows desktop, entering the path as follows.
```
# /mnt/c/Users/MadPlay/Desktop/blog/madplay.github.io
$ cd /mnt/c/Users/${user name}/Desktop/
```

I had a repository on GitHub (github) and was managing it, so cloning it, moving to the directory, and executing as follows.

<img class="post_image" src="{{ site.baseurl }}/img/post/2018-09-04-install-jekyll-on-windows-6.jpg" width="560" height="400" alt="jekyll serve"/>

The ```--no-watch``` option is said to not apply ```watch``` option in Windows version.
A warning-level message appears saying it doesn't work.

<a href="https://github.com/Microsoft/BashOnWindows/issues/216" rel="nofollow" target="_blank">
Related Link) Microsoft Github Issue (Click to go)</a>

There was a bit of trial and error in the middle... Especially, encountering errors in the Jekyll installation part.
Looking here and there, there was a missing ```sudo apt-get install build-essential``` command in the middle process.
The content organized above is the shortest method omitting trial and error time.

Now running Jekyll even at home using only Windows and managing github blog.
