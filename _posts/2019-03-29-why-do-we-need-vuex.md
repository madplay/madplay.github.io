---
layout:   post
title:    "왜 Vuex가 필요할까?"
author:   Kimtaeng
tags: 	  vuejs vuex
description: "Vuex는 무엇일까? 그리고 Vuex가 필요한 이유는 무엇일까?"
category: Vuejs
comments: true
---

# Vuex란 무엇일까?
**Vuex**는 Vue.js 애플리케이션에 대한 상태 관리 패턴 + 라이브러리를 말합니다. 애플리케이션 내의 모든 컴포넌트에 대해서
중앙 저장소 역할을 하며 예측한 가능한 방식으로 상태들을 변경할 수 있는 기능을 제공합니다.

<br/>

# 왜 Vuex가 필요할까?
Vue.js 애플리케이션은 컴포넌트라는 단위로 잘게 나누어 하나의 화면을 구성하는 경우가 있습니다. 물론, 나눌 필요가 없다면
단일 Vue로 구성해도 상관없습니다. (해보니까 그렇더라고요...) 그리고 나누어진 컴포넌트들이 관리하고 있는 상태를 props라는
기능으로 전달합니다. 컴포넌트들이 많아지면 props로 전달하여 관리하기 어려워지는 문제가 있습니다. 혹시나 오타라도 발생하면...

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-03-29-why-do-we-need-vuex-1.png"
width="500" alt="common vue app structure"/>

<br/>

# 코드로 봐보자!
이어지는 내용을 설명하기 위해 극단적이고 간단한 예제 코드를 가져와봤습니다.
간단하게 1개 컴포넌트로 분리했는데, 프로젝트의 크기에 따라 더 많아질 수 있습니다. 예제는 다른 컴포넌트에서 버튼 클릭 이벤트로
상위 컴포넌트의 데이터 값을 바꾸는 코드입니다.

```javascript
// TaengWorld.vue
<template>
  <div>
    <inner-world :msg="message" @tWorld="taengWorld"/>
  </div>
</template>
<script>
import InnerWorld from './components/InnerWorld.vue'

export default {
  name: 'TaengWorld',
  components: {
    InnerWorld
  },
  data() {
    return {
      message: 'HelloWorld!'
    };
  },
  methods: {
    taengWorld(data) {
      this.message = data;
    }
  }
}
</script>
```

```javascript
// InnerWorld.vue
<template>
  <div>
    <h1>Welcome to {% raw %} {{ msg }} {% endraw %}</h1>
    <button v-on:click="clickMethod">Click!</button>
  </div>
</template>
<script>
export default {
  name: 'InnerWorld',
  props: {
    msg: String
  },
  methods: {
    clickMethod() {
      // tWorld라는 이름으로 이벤트 emit! 
      this.$emit('tWorld', 'TaengWorld!');
    }
  }
}
</script>
```

상태를 변경하기 위해서는 위 예시처럼 이벤트를 emit 하는 방법을 사용하는데요. 다른 컴포넌트의 함수를 실행하여
변경시키는 구조입니다. 즉, 하위 컴포넌트에서 상태를 변경한 후에 상위 컴포넌트로 이벤트를 emit 하면 됩니다.

이러한 과정만 보아도 알 수 있듯이 컴포넌트가 많아지고 프로젝트의 구조가 커지면 이벤트를 전달하는 과정이
더욱 복잡해질 수 밖에 없습니다.

<br/>

# 다른 방법은 없을까?

다른 방법으로 **EventBus**를 사용할 수 있습니다. 컴포넌트 사이에서 데이터를 주고 받을 수 있는 방법 중 하나인데요.
먼 거리의 컴포넌트끼리도 데이터를 주고 받을 수 있습니다! 코드로 보면 아래와 같습니다.
(EventBus를 등록하는 코드는 정말 간단해서 생략했습니다.) 

```javascript
// TaengWorld.vue
<template>
  <div>
    <inner-world :msg="message"/>
  </div>
</template>
<script>
import InnerWorld from './components/InnerWorld.vue'

export default {
  name: 'TaengWorld',
  components: {
    InnerWorld
  },
  data() {
    return {
      message: 'HelloWorld!'
    };
  },
  mounted() {
    // 이벤트를 수신한다.
    // 테스트를 위해 mounted 옵션 프로퍼티를 사용했습니다.
    this.EventBus.$on('tWorld', (data) => {
      this.message = data;
    });
  }
}
</script>
```

```javascript
// InnerWorld.vue
<template>
  <div>
    <h1>Welcome to {% raw %} {{ msg }} {% endraw %}</h1>
    <button v-on:click="clickMethod">Click!</button>
  </div>
</template>
<script>
export default {
  name: 'InnerWorld',
  props: {
    msg: String
  },
  methods: {
    clickMethod() {
      // 이벤트 버스를 통해 주고 받는다.
      // 꼭 1개 depth끼리만 가능한 것이 아니다!
      this.EventBus.$emit('tWorld', 'TaengWorld!');
    }
  }
}
</script>
```

이벤트를 emit 하는 코드는 사라졌지만 여전히 data는 props를 이용하여 하위 컴포넌트로 전달해야 합니다.
그러니까 컴포넌트 계층에서 어딘가에 data가 추가된다면 그 계층 사이에 있는 props 코드들은 모두 수정해야 합니다.

<br/>

# 그래서 Vuex!
Vuex의 구조를 살펴보면 이런 형태로 되어 있습니다. 개인 소장용으로 만든 이미지인데... 공식 홈페이지에 있는 이미지가 더 예쁩니다.

<img class="post_image" src="{{ site.baseurl }}/img/post/2019-03-29-why-do-we-need-vuex-2.png"
width="650" height="450" alt="vuex structure"/>

위 그림을 보면 알 수 있듯이 단방향의 데이터 흐름을 알 수 있습니다. (Actions -> Mutations -> State -> Components -> Actions...)

<br/>

# Vuex도 코드로 봐보자!
코드로 보면 아래와 같습니다. Vuex 저장소(Store)를 설정하는 방법도 포함되어 있습니다. 기존에 props로 넘기거나
컴포넌트끼리 emit을 통해서 이벤트를 전달하는 코드는 없어졌습니다.

```javascript
// TaengWorld.vue
<template>
  <div>
    <inner-world/>
  </div>
</template>
<script>
import InnerWorld from './components/InnerWorld.vue'

export default {
  name: 'TaengWorld',
  components: {
    InnerWorld
  }
}
</script>
```

```javascript
// InnerWorld.vue
<template>
  <div>
    <h1>Welcome to {% raw %}{{ $store.state.message }} {% endraw %}</h1>
    <button v-on:click="clickMethod">Click!</button>
  </div>
</template>
<script>
export default {
  name: 'InnerWorld', // props 선언도 없다.
  methods: {
    clickMethod() {
      // 이벤트 emit도 없다.
      this.$store.state.message = 'TaengWorld';
    }
  }
}
</script>
```

```javascript
// Vuex, Store 저장소 설정 코드
// ... 생략
import Vuex from 'vuex';
Vue.use(Vuex);

export const store = new Vuex.Store({
  state: {
    message: 'HelloWorld!'
  },
  getters: {
    getMessage: state => state.message
  }
});

new Vue({
  // ... 생략
  store // 등록
});
```

그렇다면 루트 레벨에 있는 컴포넌트에서는 어떻게 데이터를 가져올까요? 즉, 예시에서 message의 상태를 어떻게 가져올 수 있을까요?
Vuex의 Helper 메서드 격인 **mapGetters**를 사용하면 간단합니다.

```javascript
// TaengWorld.vue
<template>
  <div>
    {% raw %}{{ message }}{% endraw %}
    <inner-world/>
  </div>
</template>
<script>
import InnerWorld from './components/InnerWorld.vue'
import {mapGetters} from 'vuex';

export default {
  name: 'TaengWorld',
  components: {
    InnerWorld
  },
  computed: {
    // template 영역 message에 값이 할당된다.
    ...mapGetters({message: 'getMessage'})
  }
}
</script>
```
 
그 밖에도 action, mutation 등이 있으나 이번 포스팅에서는 생략합니다. 그리고 페이지를 Refresh하는 경우 Store 정보가 사라지는 것이 기본 스펙인데요.
간단하게 **vuex-persistedstate** 플러그인을 사용하면 localStorage에 저장할 수 있습니다.

<br/>

# 그럼 항상 Vuex를 고민해야 하나?
오히려 단순한 구조라면 **Vuex**를 굳이 사용하지 않아도 충분할 것 같습니다. 그리고 개인적으로 Vue.js를 현재 입문하는 수준이기 때문에
학습 비용도 필요했고 잘못 사용했을 때는 오히려 관리가 안되서 고생한 적도 있었네요. 그러므로 상황에 맞게 적절하게 사용하는 것이
좋을 것 같습니다. 

그나저나 **Vue.js**를 최근부터 해보고 있는데 쉽진 않네요. 그래도 처음 접해보는거라 재미있습니다.