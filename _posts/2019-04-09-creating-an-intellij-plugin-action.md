---
layout:   post
title:    "인텔리제이(Intellij) 플러그인 만들기: 2. Action 정의"
author:   Kimtaeng
tags: 	  intellij plugin 
description: 인텔리제이(Intellij) 플러그인(Plugin)를 실행하기 위한 액션(Action) 정의하기
category: Knowledge
comments: true
---

# 목차
- <a href="/post/creating-intellij-plugin-project" target="_blank">인텔리제이(Intellij) 플러그인 만들기: 1. 환경 구성</a>
- 인텔리제이(Intellij) 플러그인 만들기: 2. Action 정의
- <a href="/post/deploying-and-publishing-an-intellij-plugin" target="_blank">인텔리제이(Intellij) 플러그인 만들기: 3. 빌드 & 배포하기</a>

<br/>

# 인텔리제이 플러그인 만들기, 두 번째 포스팅
앞선 포스팅에서 Intellij IDEA에서 플러그인 프로젝트를 생성하고 그 구조에 대해서 살펴보았습니다.
이번에는 플러그인을 실행하기 위한 액션(Action)을 정의하는 방법에 대해서 알아봅니다.

<br/>

# 액션(Action) 생성하기
다음으로 Intellij IDEA의 상단 툴바 등에서 보여질 수 있도록 플랫폼 UI를 커스텀하는 과정입니다.
그러니까 플러그인을 실행하기 위해서 특정 메뉴를 클릭해야 하는데요. 그것을 만드는 겁니다!
이를 **액션(Action)**을 정의한다고 하며, 인텔리제이에서는 `AnAction` 클래스를 제공하여 이를 상속하여 구현하면
개발자가 직접 액션을 정의할 수 있습니다. 

액션은 아래와 같이 소스 디렉터리를 오른 클릭한 후에 바로 생성할 수 있습니다. 

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-09-creating-an-intellij-plugin-action-1.png" width="650" height="500" alt="create new action"/>

<br/>

새로운 액션을 생성하는 메뉴로 진입하면 보여지는 화면입니다. 이 곳에서 액션의 정보를 입력하여 정의할 수 있습니다.


<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-09-creating-an-intellij-plugin-action-2.png" width="650" height="500" alt="define the action"/>

액션을 생성할 때 입력하는 항목은 아래와 같습니다.

- **Action ID**: 액션의 고유한 값입니다. `플러그인이름.액션아이디` 형태를 추천합니다.
- **Class Name**: 액션 클래스의 이름입니다.
- **Name**: 메뉴에 보여질 이름입니다. 툴바 버튼에 이 이름이 표기됩니다.
- **Description**: 액션에 대한 설명이며 선택 옵션입니다.
- **Groups**: 어떤 그룹에 추가될지 설정합니다. 이번 예제에서는 상단 메뉴의 Tools에 추가합니다.
- **Actions**: 선택한 그룹의 액션들이 표기되는데, 그 액션의 위치를 기준으로 설정할 수 있습니다.
  - 선택하지 않고 First 또는 Last를 클릭한 경우 해당 그룹의 맨 앞 또는 뒤에 위치합니다.
  - Before와 After는 해당 그룹 내의 선택한 액션의 바로 앞 또는 뒤에 위치합니다.

위 과정을 진행하면 자동으로 액션 클래스를 자동 생성되고 액션의 정의가 `META-INF/plugin.xml`에 자동 기재되는 것을 볼 수 있습니다.
물론 직접 클래스를 생성하고 plugin.xml 파일을 수정해도 됩니다.

```xml
<actions>
  <action id="MadPlay.MadAction" class="MadAction" text="Hello Madplay">
    <add-to-group group-id="ToolsMenu" anchor="first"/>
  </action>
</actions>
```

<br/>

# 액션의 행동(코드) 정의하기 
이제 액션의 세부 행동을 정의할 차례입니다. 앞서 소개한 것처럼 인텔리제이에서는 `AnAction` 클래스를 제공하며
이 클래스를 상속한 액션 클래스를 정의하면 개발자가 직접 이후 행동을 커스텀할 수 있습니다.

이번 예제에서는 간단하게 다이얼로그를 띄워볼 예정입니다.

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
        // 인텔리제이 Open API 이용
        Messages.showInputDialog("짜장면이 좋아요 짬뽕이 좋아요?", "당신의 선택은", Messages.getQuestionIcon());
    }
}
```

<br/>

# 플러그인 실행해서 확인해보기

위에서 정의한 액션이 정상적으로 동작하는지 플러그인을 실행해봅시다.  이 포스팅을 작성하면서 다시 생성해보았을 때,
실행 환경이 자동 구성되는 것을 확인하긴 했는데, 혹시 보이지 않는다면 아래와 같이 설정하면 됩니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-09-creating-an-intellij-plugin-action-3.png" width="650" height="500" alt="run configuration"/>

위 구성대로 플러그인을 실행하면 새로운 Intellij IDEA가 실행되는 것을 확인할 수 있습니다.
새롭게 실행된 인텔리제이 프로젝트에서 상단의 Tools 메뉴를 클릭하면, 앞서 정의한 액션을 확인할 수 있습니다.

플러그인의 액션을 생성하는 과정에서 Group을 ToolsMenu로, 그리고 Anchor를 First로 지정했기 때문에
인텔리제이의 화면 최상단에서 직접 만든 플러그인의 진입점을 확인할 수 있습니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-09-creating-an-intellij-plugin-action-4.png" width="650" height="500" alt="execute plugin"/>

<br/>

**"Hello Madplay"** 라는 문구는 역시나 앞서 액션을 생성할 때 지정한 액션의 이름이 됩니다.
클릭해서 우리가 정의한 다이얼로그가 아래와 같이 보여지는지 확인하면 됩니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-04-09-creating-an-intellij-plugin-action-5.png" width="650" height="500" alt="show dialog"/>

<br/>

# 이어서
지금까지 플러그인의 액션을 생성하고 정의하는 방법에 대해서 알아보았습니다.
그리고 정상 동작하는지 확인하기 위해서 개발한 플러그인을 직접 실행해보기도 했고요.

이어지는 포스팅에서는 플러그인을 실제로 JetBrains의 플러그인 저장소에 배포하는 방법에 대해서 알아봅니다.

- <a href="/post/deploying-and-publishing-an-intellij-plugin" target="_blank">
다음 포스팅: 인텔리제이(Intellij) 플러그인 만들기: 2. Action 정의</a>