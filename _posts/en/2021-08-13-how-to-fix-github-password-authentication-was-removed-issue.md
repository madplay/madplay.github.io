---
layout:   post
title:    "git push Error: Please use a personal access token instead"
author:   madplay
tags:    git github accesstoken
description: If you see "Support for password authentication was removed on August 13, 2021. Please use a personal access token instead" while pushing to GitHub, how do you fix it?
category: Engineering
date: "2021-08-13 01:33:21"
comments: true
slug:     how-to-fix-github-password-authentication-was-removed-issue
lang:     en
permalink: /en/post/how-to-fix-github-password-authentication-was-removed-issue
---

# push Fails
When pushing source code to GitHub, you can hit the error below.
The message and linked page indicate that GitHub authentication changed from password auth to personal access tokens.

```bash
$ git push origin master
remote: Support for password authentication was removed on August 13, 2021. Please use a personal access token instead.
remote: Please see https://github.blog/2020-12-15-token-authentication-requirements-for-git-operations/ for more information.
fatal: unable to access 'https://github.com/madplay/~~~.git/': The requested URL returned error: 403
```

<br>

# How to Fix It
> Steps below were performed on macOS Big Sur.

## Issue a Personal Access Token
First, issue a token.
Sign in to GitHub, open the profile menu at the top-right, then enter **"Settings"**.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-1.jpg"
width="700" alt="open profile menu"/>

<br>

In Settings, open **"Developer settings"** near the bottom-left.
(Some items shown in the screenshot were removed intentionally because they contain personal information.)

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-2.jpg"
width="700" alt="github settings"/>

<br>

Then create a new token in **"Personal access tokens"** as shown below.
Input fields mean:

- Note: Name your token based on its use.
- Expiration: Set token expiration. You can choose No Expiration, but the UI warns against it.
- Select scopes: Choose permissions. In this example, only "repo" is checked for repository operations.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-3.jpg"
width="700" alt="new personal access token"/>

<br>

After creation, you can see the token as below.
As the message says, "Make sure to copy your personal access token now. You won’t be able to see it again!"
Copy it immediately and store it safely.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-4.jpg"
width="700" alt="personal access token"/>

<br><br>

## Save the Token in Keychain
Token issuance is done. Next, replace the saved password in Keychain.
Open Spotlight, search for "Keychain Access", run it, and search for "github".
You can find an Internet password entry like below. Open it with double-click.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-5.jpg"
width="700" alt="keychain access "/>

<br>

Check "Show password" and enter the personal access token you just issued.
That completes the process.

<img class="post_image" src="{{ site.baseurl }}/img/post/2021-08-13-how-to-fix-github-password-authentication-was-removed-issue-6.jpg"
width="500" alt="enter access token"/>

<br><br>

After saving, run Terminal again and push source code to GitHub.
The push now succeeds.
