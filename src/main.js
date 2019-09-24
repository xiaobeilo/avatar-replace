import Vue from 'vue'
import App from './app.vue'

import './reset.css'
import './style.less'
import 'flex.css'

document.documentElement.style.fontSize = (document.documentElement.clientWidth / 750) * 200 + 'px'
document.body.style.fontSize = '.14rem'

new Vue({
  el: '#app',
  render: h => h(App)
})