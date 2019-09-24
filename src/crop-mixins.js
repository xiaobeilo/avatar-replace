import alloyfinger from 'alloyfinger'

export default {
  data () {
    return {
      // onConfirm: data.onConfirm,
      // onCancel: data.onCancel,
      sourceFile: null,
      // confirmText: data.confirmText,
      // cancelText: data.cancelText,
      // rotateText: data.rotateText,
      winWidth: window.innerWidth, // 屏幕尺寸
      winHeight: window.innerHeight,
      isTouch: false,
      canvas: null,
      // canvas: document.createElement('canvas'),
      ctx: null,
      drawWidth: 0,
      drawHeight: 0,
      scale: 1,
      originX: 0,
      originY: 0,
      imgPos: {}, // 保存图片绘制坐标信息
      clipWidth: 0, // 裁剪宽度
      clipHeight: 0, // 裁剪高度
      rectPos: {}, // 保存裁剪区域信息
      // container: null,
      base64: '',
      af: null,
      imgHeight: 0,
      imgWidth: 0,
      imgObj: null
    }
  },
  mounted () {
    this.selectedTemplateName = '红'
    this.selectTemplateImgObj = this.$refs[this.selectedTemplateName][0]
    // 以上默认选中第一个模板 因混合函数先执行 所以放在该钩子函数里操作
    this.canvas = this.$refs.canvas
    this.canvas.addEventListener('touchstart', () => {
      document.body.addEventListener('touchstart', this.preventHandle, {passive: false})
    })
    this.canvas.addEventListener('touchend', () => {
      document.body.removeEventListener('touchstart', this.preventHandle, {passive: false})
    })
    this.af = new alloyfinger(this.canvas, {
      pinch: this.pinch,
      multipointEnd: this.multipointEnd,
      pressMove: this.pressMove
    })
  },
  methods: {
    preventHandle (e) {
      e.preventDefault()
    },
    convertBase64UrlToBlob (urlData) { // base64blob文件
      let bytes = window.atob(urlData.split(',')[1]) // 去掉url的头，并转换为byte
      // 处理异常,将ascii码小于0的转换为大于0
      let ab = new ArrayBuffer(bytes.length)
      let ia = new Uint8Array(ab)
      for (let i = 0; i < bytes.length; i++) {
        ia[i] = bytes.charCodeAt(i)
      }
      return new Blob([ab], {type: 'image/png'})
    },
    loadFile () {
      let me = this
      // 文件类型判断
      if (!/image\/[png|jpeg|jpg]/.test(this.sourceFile.type)) {
        alert('请上传文件类型为png/jpeg/jpg其中一种的图片!')
        return false
      }
      let reader = new FileReader()
      reader.readAsDataURL(this.sourceFile)
      reader.onload = (event) => {
        let img = new Image()
        img.src = event.target.result
        img.onload = function () {
          // 这里不考虑旋转的情况
          if (me.smartMode) {
            me.tinyImgObj(this).then(res => {
              me.setRightImgInfo(res)
              me.getSnapshoot(res.src)
            })
          } else {
            me.setRightImgInfo(this)
            me.tinyImgObj(this).then(res => {
              me.getSnapshoot(res.src)
            })
          }
        }
      }
    },
    tinyImgObj (imgObj) {
      return new Promise((resolve, reject) => {
        let limitSide = 800
        let r = limitSide / imgObj.width
        let canvas = document.createElement('canvas')
        let ctx = canvas.getContext('2d')
        canvas.width = limitSide // 因为canvas重置宽高会刷新画板,所以预先手动转换宽高
        canvas.height = imgObj.height * r
        ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height)
        let img = new Image()
        img.src = canvas.toDataURL()
        img.onload = function () {
          resolve(this)
        }
      })
    },
    setRightImgInfo (imgObj) { // 获取到正确的图片后进行信息获取
      this.imgWidth = imgObj.width
      this.imgHeight = imgObj.height
      this.imgObj = imgObj
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      canvas.width = this.imgWidth
      canvas.height = this.imgHeight
      ctx.drawImage(imgObj, 0, 0, this.imgWidth, this.imgHeight)
      this.base64 = canvas.toDataURL('image/jpeg', 0.7)
      this.initCut()
    },
    initCut () {
      // 这里需要将body的touchmove事件屏蔽掉 否认安卓会滚 // 紧随
      // this.container.style.display = 'block'
      // document.body.addEventListener('touchmove', this.preventHandle)
      if (this.imgWidth < this.imgHeight) {
        this.drawWidth = this.winWidth
        this.scale = this.drawWidth / this.imgWidth
        this.drawHeight = this.scale * this.imgHeight
      } else if (this.imgWidth > this.imgHeight) {
        this.drawHeight = this.winWidth
        this.scale = this.drawHeight / this.imgHeight
        this.drawWidth = this.scale * this.imgWidth
      } else {
        this.drawWidth = this.winWidth
        this.scale = this.drawWidth / this.imgWidth
        this.drawHeight = this.scale * this.imgHeight
      }
      this.ctx = this.canvas.getContext('2d')
      this.canvas.width = this.winWidth
      this.canvas.height = this.winWidth
      this.clearCanvas()
      this.drawClipRect()// 执行后的到clipPos对象
      this.originX = (this.rectPos.x2 - this.rectPos.x1) / 2
      this.originY = (this.rectPos.y2 - this.rectPos.y1) / 2
      this.drawImage()
      this.drawTag()
      // this.drawMask()
    },
    drawImage () {
      // 根据origin和偏移量来实时调整
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      // this.ctx.drawImage(this.imgObj, 0, 0, 200, 200)
      this.ctx.drawImage(this.imgObj, this.originX - this.drawWidth / 2, this.originY - this.drawHeight / 2, this.drawWidth, this.drawHeight)
      this.imgPos = {
        x1: this.originX - this.drawWidth / 2,
        y1: this.originY - this.drawHeight / 2
      }
      this.imgPos.x2 = this.imgPos.x1 + this.drawWidth
      this.imgPos.y2 = this.imgPos.y1 + this.drawHeight
    },
    drawClipRect () { // 绘制裁剪区域
      this.ctx.fillStyle = '#fff'
      this.ctx.strokeStyle = '#fff'
      // this.clipHeight = this.clipWidth = this.winWidth
      this.clipWidth = this.winWidth
      this.clipHeight = this.winWidth
      let leftTopPosX = 0
      let leftTopPosY = 0
      this.ctx.strokeRect(leftTopPosX, leftTopPosY, this.clipWidth, this.clipHeight)
      this.rectPos = {
        x1: leftTopPosX,
        y1: leftTopPosY
      }
      this.rectPos.x2 = leftTopPosX + this.clipWidth
      this.rectPos.y2 = leftTopPosY + this.clipHeight
    },
    drawMask () {
      this.ctx.fillStyle = 'rgba(0,0,0,.6)'
      this.ctx.fillRect(0, 0, this.canvas.width, this.rectPos.y1)
      this.ctx.fillRect(0, 0, this.rectPos.x1, this.canvas.height)
      this.ctx.fillRect(this.rectPos.x2, 0, this.canvas.width - this.rectPos.x2, this.canvas.height)
      this.ctx.fillRect(0, this.rectPos.y2, this.canvas.width, this.canvas.height - this.rectPos.y2)
    },
    drawTag () {
      this.selectTemplateImgObj && this.ctx.drawImage(this.selectTemplateImgObj,
        0, 0, this.canvas.width, this.canvas.height)
    },
    clearCanvas () {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    },
    pinch (evt) {
      this.isTouch = true
      let scale = this.scale * (evt.zoom || 1)
      if (scale > this.maxScale) {
        return false
      }
      this.drawWidth = this.imgWidth * scale
      this.drawHeight = this.imgHeight * scale
      this.clearCanvas()
      this.drawImage()
      this.drawClipRect()
      this.drawTag()
      // this.drawMask()
    },
    multipointEnd (evt) {
      this.isTouch = false
      this.scale = this.drawWidth / this.imgWidth
      if (!this.isBeyond()) {
        this.reset()
        return false
      }
    },
    pressMove (evt) {
      this.isTouch = true
      this.originX = this.originX + evt.deltaX
      this.originY = this.originY + evt.deltaY
      this.clearCanvas()
      this.drawImage()
      this.drawClipRect()
      this.drawTag()
      // this.drawMask()
    },
    rotate () {
      let me = this
      let canvas = document.createElement('canvas')
      let ctx = canvas.getContext('2d')
      canvas.width = this.imgObj.height // 因为canvas重置宽高会刷新画板,所以预先手动转换宽高
      canvas.height = this.imgObj.width
      ctx.translate(this.imgObj.height, 0) // 将canvas的画布点转移到右上角
      ctx.rotate(90 * Math.PI / 180)
      ctx.drawImage(this.imgObj, 0, 0, this.imgObj.width, this.imgObj.height)
      let img = new Image()
      this.base64 = img.src = canvas.toDataURL()
      img.onload = function () {
        me.imgObj = this
        me.imgWidth = this.width
        me.imgHeight = this.height
        me.initCut()
        me.tinyImgObj(this).then(res => {
          me.getSnapshoot(res.src)
        })
      }
    },
    getPhotoOrientation (img) {
      let me = this
      this.EXIF.getData(img, function () {
        me.orient = me.EXIF.getTag(this, 'Orientation')
      })
      return me.orient !== 1 || me.orient !== undefined
    },
    isBeyond () {
      // 注: x1y1代表左上角 x2y2代表右下角坐标
      if (this.rectPos.x1 - this.imgPos.x1 >= 0 && this.rectPos.y1 - this.imgPos.y1 >= 0 && this.rectPos.x2 - this.imgPos.x2 <= 0 && this.rectPos.y2 - this.imgPos.y2 <= 0) {
        return true
      } else {
        return false
      }
    },
    reset (resetPos) {
      if (this.isTouch) {
        return false
      }
      // 注: x1y1代表左上角 x2y2代表右下角坐标
      let count = 0; let rate = 1.5
      if (!resetPos) {
        resetPos = {
          x1: this.imgPos.x1,
          y1: this.imgPos.y1,
          x2: this.imgPos.x2,
          y2: this.imgPos.y2
        }
      }
      let disX1 = this.rectPos.x1 - this.imgPos.x1
      let disY1 = this.rectPos.y1 - this.imgPos.y1
      let disX2 = this.rectPos.x2 - this.imgPos.x2
      let disY2 = this.rectPos.y2 - this.imgPos.y2
      if ((disX1 < 0 && disX2 > 0) || (disY1 < 0 && disY2 > 0)) {
        this.initCut()
        return false
      }
      if (disX1 < 0) {
        count++
        resetPos.x1 = this.rectPos.x1 - (Math.abs(disX1) < 1 ? 0 : disX1 / rate)
        resetPos.x2 = resetPos.x1 + this.imgWidth * this.scale
      }
      if (disY1 < 0) {
        count++
        resetPos.y1 = this.rectPos.y1 - (Math.abs(disY1) < 1 ? 0 : disY1 / rate)
        resetPos.y2 = resetPos.y1 + this.imgHeight * this.scale
      }
      if (disX2 > 0) {
        count++
        resetPos.x2 = this.rectPos.x2 - (Math.abs(disX2) < 1 ? 0 : disX2 / rate)
        resetPos.x1 = this.rectPos.x2 - this.imgWidth * this.scale
      }
      if (disY2 > 0) {
        count++
        resetPos.y2 = this.rectPos.y2 - (Math.abs(disY2) < 1 ? 0 : disY2 / rate)
        resetPos.y1 = this.rectPos.y2 - this.imgHeight * this.scale
      }
      if (count > 2) {
        this.initCut()
        return false
      }
      this.originX = resetPos.x1 + (resetPos.x2 - resetPos.x1) / 2
      this.originY = resetPos.y1 + (resetPos.y2 - resetPos.y1) / 2
      this.clearCanvas()
      this.drawImage()
      this.drawTag()
      // this.drawMask()
      if (count > 0) {
        setTimeout(() => {
          this.reset(resetPos)
        }, 20)
      }
    },
    getClipPos (scale) { // 获取最终裁剪坐标
      let _scale = scale || this.scale
      return {
        w: ~~((this.rectPos.x2 - this.rectPos.x1) / _scale),
        h: ~~((this.rectPos.y2 - this.rectPos.y1) / _scale),
        offsetX: ~~((this.rectPos.x1 - this.imgPos.x1) / _scale),
        offsetY: ~~((this.rectPos.y1 - this.imgPos.y1) / _scale),
        x1: ~~(this.rectPos.x1 / _scale),
        y1: ~~(this.rectPos.y1 / _scale)
      }
    },
    // 这个确认按钮已被当前业务特殊处理过
    confirm () {
      // let clipPos = this.get800ClipPos()
      let clipPos = this.getClipPos()
      let originCanvas = document.createElement('canvas')
      let originCanvasCtx = originCanvas.getContext('2d')
      let slideWidth = Math.max.apply(null, [clipPos.w, clipPos.h])
      originCanvas.width = slideWidth
      originCanvas.height = slideWidth
      originCanvasCtx.drawImage(
        this.imgObj,
        -clipPos.offsetX,
        -clipPos.offsetY,
        this.imgObj.width,
        this.imgObj.height
      )
      if (this.selectTemplateImgObj) {
        originCanvasCtx.drawImage(
          this.selectTemplateImgObj,
          0, 0,
          slideWidth,
          slideWidth
        )
      }
      let base64 = originCanvas.toDataURL()
      return {
        base64: base64,
        file: this.convertBase64UrlToBlob(base64),
        coordinate: clipPos
      }
    },
    cancel () {
      // document.body.removeEventListener('touchmove', this.preventHandle)
      this.imgObj = null
      // this.container.style.display = 'none'
      this.onCancel && this.onCancel()
    }
  }
}