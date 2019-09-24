<template>
  <div>
    <div class="work-area">
      <canvas v-show="!output"  id="canvas" ref="canvas"></canvas>
      <div  v-show="output" class="output-box">
        <img :src="output" alt="">
        <div class="mask" v-if="saveTipShow">
          <div class="content">
            <p>请长按图片</p>
            <p>以保存您的专属头像</p>
          </div>
        </div>
      </div>
    </div>
    <div class="template-box" flex="main:justify cross:center">
      <div v-for="item in template" @click.stop="selectTemplate(item)" :key="item.name"
      :style="{backgroundImage: `url(${item.headImg})`}">
        <img class="tag" :ref="item.name" crossOrigin="Anonymous" :src="item.tag" alt="">
      </div>
    </div>
    <div class="bottom-action" flex="main:left cross:center">
      <img src="https://cdn.leoao.com/head-img-528/icons.png" alt="">
      <input v-if="newInput" type="file" @change="inputChange" v-quicklySet="{t:0, l: .25, w: .44, h: .75}" alt="添加按钮" />
      <div  @click="smartMode = !smartMode" v-quicklySet="{t:0, l: .85, w: .44, h: .75}" alt="极速"></div>
      <div @click="rotateHandler" v-quicklySet="{t:0, l: 1.45, w: .44, h: .75}" alt="旋转"></div>
      <!-- <div @click="save" v-quicklySet="{t:0, r: 0, w: .75, h: .75}" alt="保存"></div> -->
      <div v-quicklySet="{t:0, r: 0, w: .75, h: .75}" :style="{background: 'rgba(245, 245, 245)'}"></div>
      <div class="smart" v-show="smartMode" v-quicklySet="{ l: .9,w: .35, h: .65, }">
        <img  src="https://cdn.leoao.com/head-img-528/jisu_icon_123.png" alt="">
      </div>
    </div>
    <img class="logo" src="https://cdn.leoao.com/head-img-528/lefit-1.png" alt="">
    <img ref="headImg" v-show="false" crossOrigin="Anonymous" :src="headImg" @load="headImgLoad" @error="headImgLoadError" alt="">
    <img v-show="false" :src="succImg" alt="">
  </div>
</template>
<script>
import cropMixins from './crop-mixins.js'
import {getUrlParams} from './utils'
export default {
  mixins: [cropMixins],
  data () {
    return {
      succImg: '',
      smartMode: false,
      timer: null,
      newInput: true,
      headImg: '',
      selectedTemplateName: '',
      selectTemplateImgObj: null,
      saveTipShow: false,
      hasUpload: false,
      output: '',
      query: getUrlParams(),
      template: [
        {
          tag: 'https://cdn.leoao.com/head-image-replace/828%E5%A4%B4%E5%83%8F-%E7%BA%A2_750x750.png',
          name: '红',
          headImg: ''
        },
        {
          tag: 'https://cdn.leoao.com/head-image-replace/828%E5%A4%B4%E5%83%8F-%E6%B7%B1%E8%93%9D_750x750.png',
          name: '蓝',
          headImg: ''
        },
        {
          tag: 'https://cdn.leoao.com/head-image-replace/828%E5%A4%B4%E5%83%8F-%E7%99%BD_750x750.png',
          name: '白',
          headImg: ''
        }
      ]
    }
  },
  directives: {
    quicklySet (el, {value}) {
      let obj = {
        width: value.w,
        height: value.h,
        top: value.t,
        bottom: value.b,
        left: value.l,
        right: value.r
      }
      for (let key in obj) {
        el.style[key] = obj[key] + 'rem'
      }
      el.style.position = 'absolute'
    }
  },
  methods: {
    inputChange (evt) {
      // 这里判断文件重复选择的问题
      this.sourceFile = evt.target.files[0]
      this.loadFile()
      this.hasUpload = true
      this.output = ''
      this.newInput = false
      setTimeout(() => {
        this.newInput = true
      }, 0)
    },
    openSmart () {
      this.smartMode = true
    },
    selectTemplate (item) {
      this.output = ''
      this.selectedTemplateName = item.name
      this.selectTemplateImgObj = this.$refs[item.name][0]
      this.clearCanvas()
      this.drawImage()
      this.drawClipRect()
      this.drawTag()
    },
    rotateHandler () {
      this.output = ''
      this.rotate()
    },
    // async save () {
    //   if (this.timer) {
    //     return false
    //   }
    //   let data = this.confirm()
    //   this.output = data.base64
    //   this.saveTipShow = true
    //   if (this.hasUpload) {
    //     let res = await this.$upAdmin.upload(data.file, 'act-head-img-dianshang-828-2018-')
    //     this.succImg = `https://cdn.leoao.com/${res.key}?imageView2/2/w/400/h/400/format/jpg`
    //     this.shareConfig()
    //   }
    //   this.timer = setTimeout(() => {
    //     this.saveTipShow = false
    //     window.clearTimeout(this.timer)
    //     this.timer = null
    //   }, 3000)
    // },
    headImgLoad () {
      this.template.forEach(v => {
        v.headImg = this.headImg
      })
      this.setRightImgInfo(this.$refs.headImg)
    },
    shareConfig () {
      fitTool.shareMsg({
        directFullShare: false,
        title: '乐刻8.28运动装备节，等你助力！',
        link: window.location.href,
        desc: '上传照片，生成你的828专属头像',
        imgUrl: this.succImg || 'https://cdn.leoao.com/head-img-528/5_%E7%94%BB%E6%9D%BF%201.png?imageView2/2/w/400/h/400/format/jpg'
      })
    },
    headImgLoadError () {
      this.headImg = 'https://cdn.leoao.com/head-img-528/5_%E7%94%BB%E6%9D%BF%201.png'
    },
    getSnapshoot (base64) {
      this.template.forEach(v => {
        v.headImg = base64
      })
    }
  },
  async created () {
    this.headImg = this.query.src || 'https://cdn.leoao.com/head-img-528/5_%E7%94%BB%E6%9D%BF%201.png'
  }
}
</script>
