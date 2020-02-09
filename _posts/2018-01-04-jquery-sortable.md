---
layout:   post
title:    jQuery Sortable (드래그앤드롭으로 정렬 구현하기)
author:   Kimtaeng
tags: 	  jquery jqueryui
description: jQuery UI로 드래그 & 드랍 정렬을 구현해보자!
category: Script
comments: true
---

# jQuery UI Sortable
제이쿼리를 이용하여 드래그 & 드랍 이벤트를 통한 정렬을 구현해봅시다.
jQuery User Interface Library에 있는 Sortable 이라는 것을 사용할 것인데요. 자세한 소개는 아래 링크를 참조하시기 바랍니다. 

- <a href="https://jqueryui.com/sortable" target="_blank" rel="nofollow">링크: jQuery-UI 가이드 페이지로 이동</a>

우선, 해당 라이브러리를 사용하려면 관련 스크립트 파일이 필요합니다. 링크를 연결하거나 직접 다운로드를 받으셔도 됩니다.
(직접 다운로드하시는 경우 node.js 설치 후 bower를 통해서 받으면 편리합니다)

링크 확인 또는 파일 다운로드 끝나면 Sortable을 구현할 페이지의 상단 `<head>` 영역에 다음과 같이 선언하여 준비한 스크립트 파일의 경로를 적어주도록 합니다.

```javascript
<!-- 파일 경로 직접 설정 -->
<script src="경로/jquery.min.js" type="text/javascript"/>
<script src="경로/jquery-ui.js" type="text/javascript"/>

<!--
    링크 경로 직접 설정
    jQuery CDN 참조 https://code.jquery.com/
-->
<script src="https://code.jquery.com/jquery-3.2.1.min.js" type="text/javascript"/>
<script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" type="text/javascript"/>
```

<br/>

# Sortable 구현해보기
그럼 jQuery UI Sortable을 이용해봅시다. 사용 방법은 다음과 같습니다.

```javascript
$('.selector').sortable();

$.(.selector').sortable({
	/* 정렬이 적용 될 것 또는 해제할 것을 지정 가능 */
	items: $('.selector')

});
```

포스팅을 위해서 테스트 해본 **jsffidle**에서 확인해 볼 수 있습니다.

- <a href="https://jsfiddle.net/Kimtaeng/xo8neqpL/1/" target="_blank" rel="nofollow">예제 페이지로 이동(jsfiddle)</a>

작성한 예제는 간단하지만 더 많은 기능을 제공합니다. 드래그 방향을 수평 또는 수직으로 제어할 수도 있습니다.

```javascript
$('.selector').sortable({
	axis: 'x' /* 또는 y를 적는다. */
})

/* 초기화와 동시에 적용할 수 있으나 다음과 이후 설정도 가능하다. */
$('.selector').sortable('option', 'axis', 'x');

/* 설정한 것을 가져올 수도 있다. */
var axis = $('.selector').sortable('option', 'axis');
```

물론, 드래그가 시작된 위치와 드랍된 위치에 대해서도 정보를 가져올 수 있습니다.

```javascript
$('.selector').sortable({
	item: $('.selector'),
	start: function(event, ui) {
	    console.log('start point : ' + ui.item.position().top);
    },
    end: function(event, ui) {
        console.log('end point : ' + ui.item.position().top);
    }
})
```

Sortable에서 제공되는 메서드의 인자에 드래그 또는 드랍되는 오브젝트가 담겨오기 때문에 array 형태로 구성된 경우에는 index를 통해 접근도 가능합니다.