wx.loadFontFace({
  family: 'Alternate',
  source: 'url("./assets/DIN_Alternate_Bold.ttf")',
  desc: {
    style: 'normal',
    weight: 'bold',
    variant: 'normal'
  },
  complete: (result)=>{
    console.log('wx.loadFontFace',result)
  }
});
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  globalData: {
    userInfo: null,
    authkey: "",
    jsc: {
      sum: 0,
      start: "无数据",
      end: "无数据",
      r5_info: [],
      r5_info_wq: [],
      r5_info_js: [],
      r5_js_sum: 0,
      r5_wq_sum: 0,
      r5_sum: 0,
      r4_js: 0,
      r4_wq: 0,
      lj: 0,
      avg: 0,
      counter: 0
    },
    wqc: {
      sum: 0,
      start: "",
      end: "",
      r5_info_wq: [],
      r5_info_js: [],
      r5_info: [],
      r5_js_sum: 0,
      r5_wq_sum: 0,
      r5_sum: 0,
      r4_js: 0,
      r4_wq: 0,
      lj: 0,
      avg: 0,
      counter: 0
    },
    czc: {
      sum: 0,
      start: "",
      end: "",
      r5_info: [],
      r5_info_wq: [],
      r5_info_js: [],
      r5_js_sum: 0,
      r5_wq_sum: 0,
      r5_sum: 0,
      r4_js: 0,
      r4_wq: 0,
      lj: 0,
      avg: 0,
      counter: 0
    },
  },
  onShow(){
    this.checkUpdate()
  },
  /** 检查更新 */
  checkUpdate() {
    // 基础库 1.9.90 开始支持
    if (wx.getUpdateManager) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate(function (_res) {
        // 请求完新版本信息的回调
        // console.log(res.hasUpdate)
      })

      updateManager.onUpdateReady(function () {
        showModal({
          title: '更新提示',
          showCancel: false,
          content: '新版本已经准备好，重启应用更新？',
          success(res) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            if (res.confirm) {
              updateManager.applyUpdate()
            } else {
              console.log('[版本更新]', '取消更新提示')
            }
          }
        })
      })

      updateManager.onUpdateFailed(function () {
        // 新版本下载失败
        console.log('[新版本下载失败]')
      })
    }
  },
})
