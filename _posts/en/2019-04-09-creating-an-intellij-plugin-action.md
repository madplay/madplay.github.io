---
layout:   post
title:    "Building an IntelliJ Plugin: 2. Define an Action"
author:   madplay
tags: 	  intellij plugin 
description: Define an Action to run an IntelliJ plugin
category: Development
comments: true
slug:     creating-an-intellij-plugin-action
lang:     en
permalink: /en/post/creating-an-intellij-plugin-action
---

# Table of Contents
- <a href="/post/creating-intellij-plugin-project" target="_blank">Building an IntelliJ Plugin: 1. Environment Setup</a>
- Building an IntelliJ Plugin: 2. Define an Action
- <a href="/post/deploying-and-publishing-an-intellij-plugin" target="_blank">Building an IntelliJ Plugin: 3. Build & Publish</a>

<br/>

# Building an IntelliJ Plugin, Part 2
In the previous post, I created a plugin project in IntelliJ IDEA and walked through the structure. This time, I define an Action that runs the plugin.

<br/>

# Create an Action
Next, customize the IntelliJ UI so the action shows up in the toolbar and menus. The plugin needs an entry point so you can click a menu item to run it. This is what **Action** means. IntelliJ provides `AnAction`, and you can define your own action by extending it.

You can create an action by right-clicking the source directory as shown below.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-09-creating-an-intellij-plugin-action-1.png" width="650" height="500" alt="create new action"/>

<br/>

This is the screen where you enter the action details.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-09-creating-an-intellij-plugin-action-2.png" width="650" height="500" alt="define the action"/>

Here is what each field means:

- **Action ID**: A unique identifier. Use `PluginName.ActionId`.
- **Class Name**: The action class name.
- **Name**: The label shown in the menu. This also appears on the toolbar button.
- **Description**: An optional description.
- **Groups**: Choose which menu group to add it to. This example uses Tools in the top menu.
- **Actions**: Choose the position relative to existing actions in the group.
- If you do not select an action and choose First or Last, it is placed at the front or end of the group.
- Before and After place it right before or right after the selected action.

After you complete these fields, IntelliJ auto-generates the action class and registers it in `META-INF/plugin.xml`. You can also create the class and edit `plugin.xml` manually.

```xml
<actions>
  <action id="MadPlay.MadAction" class="MadAction" text="Hello Madplay">
    <add-to-group group-id="ToolsMenu" anchor="first"/>
  </action>
</actions>
```

<br/>

# Define the Action Behavior
Now define the action behavior. As mentioned, IntelliJ provides `AnAction`. Extend it and implement your custom behavior.

In this example, I just show a dialog.

```java
import com.intellij.openapi.actionSystem.AnAction;
import com.intellij.openapi.actionSystem.AnActionEvent;
import com.intellij.openapi.ui.Messages;

/**
 * @author Kimtaeng
 * Created on 2019. 4. 9.
 */
public class MadAction extends AnAction {

    @Override
    public void actionPerformed(AnActionEvent e) {
        // Use the IntelliJ Open API.
        Messages.showInputDialog("Do you prefer jajangmyeon or jjamppong?", "Your choice", Messages.getQuestionIcon());
    }
}
```

<br/>

# Run the Plugin
Let’s run the plugin and confirm the action works. While writing this post, IntelliJ auto-generated the run configuration. If it does not appear, set it up like this.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-09-creating-an-intellij-plugin-action-3.png" width="650" height="500" alt="run configuration"/>

When you run the plugin with this configuration, a new IntelliJ IDEA instance launches. In that new instance, open the Tools menu and you will see the action you defined earlier.

Because the group is ToolsMenu and the anchor is First, the entry point appears at the top of the Tools menu.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-09-creating-an-intellij-plugin-action-4.png" width="650" height="500" alt="execute plugin"/>

<br/>

**"Hello Madplay"** is the action name you set during creation. Click it and confirm the dialog appears as shown below.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-09-creating-an-intellij-plugin-action-5.png" width="650" height="500" alt="show dialog"/>

<br/>

# Next
So far, you created and defined a plugin action, then ran the plugin to verify it works.

In the next post, I cover how to publish the plugin to JetBrains Marketplace.

- <a href="/post/deploying-and-publishing-an-intellij-plugin" target="_blank">
Next post: Building an IntelliJ Plugin: 3. Build & Publish</a>
