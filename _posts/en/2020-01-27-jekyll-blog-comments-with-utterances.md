---
layout:   post
title:    "Add Comments to a Jekyll Blog with utterances"
author:   madplay
tags: 	  jekyll comment utterances
description: "Add a comment system to a Jekyll blog by using utterances, which is backed by GitHub issues"
category: Development
lang: en
slug: jekyll-blog-comments-with-utterances
permalink: /en/jekyll-blog-comments-with-utterances/
date: "2020-01-27 13:41:10"
comments: true
---

# Disqus Feels Heavy

I had used `Disqus` as the blog comment system. Over time, it started to affect page load speed too much.
In some cases loading took more than 10 seconds, and even after scrolling to the comment area, scripts were still not fully loaded.
So I looked for another comment system.

While searching, I found `utterances`. It uses GitHub Issues for comments, and I liked that approach.
Since the blog itself runs on GitHub, managing comments in the same place means managing one integrated surface.

So I decided to apply it and test it.

<br/>

# Applying utterances

With `utterances`, posting a comment creates a comment on a GitHub repository issue.
So you need a repository to connect. First, install `utterances` through the link below.
Click the **Install** button and choose the repository to integrate.

- <a href="https://github.com/apps/utterances" target="_blank" rel="nofollow">https://github.com/apps/utterances</a>

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-1.png"
width="550" height="450" alt="install utterances"/>

<br/>

As shown below, you can decide the authorization scope yourself.
You can grant `utterances` access to all repositories or only selected repositories.
Most users seem to use a separate repository such as `username/blog-comment`, but I selected the same repository as my blog.
I wanted to manage everything in one place.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-2.png"
width="300" height="450" alt="selet authorization types"/>

<br/>

Now configure `utterances`. In **Repository**, enter the repository name.
It must be a public repository. Enter it in the format `username/repository`.
As mentioned earlier, I entered my blog repository.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-3.png"
width="500" height="400" alt="choose the repository"/>

<br/>

Next, choose how to map blog posts and issues. I selected mapping by "title" first.
If you are curious, as I was, about how the other options behave, I included test results at the end of this post.
Here is a quick description of each mapping option.

- Maps issues based on page pathname (URL without domain).
- Maps issues based on page URL.
- Maps issues based on page title.
- Creates issues based on OG tag title.
- Maps by issue number. You enter it manually.
- Maps by a specific term. You enter it manually.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-4.png"
width="500" height="400" alt="choose the mapping"/>

You can also configure additional settings. For example, you can automatically add labels when an issue is created from comments.
Using a label such as `comment` helps avoid confusion with other issues. You can also change the color theme.

Finally, check the script code for applying it to the blog. Click `Copy`, then include it in your blog.
You can `include` it in the post layout.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-5.png"
width="500" height="400" alt="enable utterances"/>

<br/>

# Result After Applying

Below are the results from trying different mapping settings. At first, I did not use labels.
Later, I found labels better because they prevent confusion with other issues.
I also started with title-based mapping, but I did not like how the blog title (MadPlay's MadLife) was appended repeatedly.
Eventually I switched to mapping based on the OG tag title.

<img class="post_image" src="{{ site.baseurl }}/img/post/2020-01-27-jekyll-blog-comments-with-utterances-6.png"
width="600" height="400" alt="utterances result"/>

While testing, I also wondered, _"What happens if I close an issue?"_
I tested it directly. Even if an issue is closed, comments can still be written.
However, posting a comment from the blog does not reopen the closed issue.

Also, if you change the issue title according to each mapping rule, you can reset comment linkage for a specific post.
From that perspective, using the most unique key for issue mapping seems safer. URL-based mapping might be the better choice.
