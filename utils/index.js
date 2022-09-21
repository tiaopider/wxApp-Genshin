import { GetCacheByKey, SaveCacheByKey } from './storageUtil';
// 获取客户端唯一id
export function getClientKey() {
  const clientKey =
    GetCacheByKey('clientKey') ||
    (Date.now() + Math.random() * 10000000).toString(32);
  SaveCacheByKey('clientKey', -1, clientKey);
  return clientKey;
}
/**
 * 解析场景值
 * @param scene 场景值，以&来区分，如：key1=val1&key2=val2
 */
export function parseScene(scene) {
  if (typeof scene !== 'string' || /^\s*$/i.test(scene)) {
    return scene || {};
  }
  scene = scene.replace(/^\s*/, '').replace(/\s*$/, '');
  let params = scene.split('&') || [];
  return params.reduce((query, item) => {
    let keyValue = item.split('=');
    if (keyValue[0] != null && keyValue[1] != null) {
      query[decodeURIComponent(keyValue[0])] = decodeURIComponent(keyValue[1]);
    }
    return query;
  }, {});
}
/**
 * 解析普通二维码规则
 * https://developers.weixin.qq.com/miniprogram/introduction/qrcode.html#%E5%8A%9F%E8%83%BD%E4%BB%8B%E7%BB%8D
 * @param q 定义的url会在打开小程序后以query.q作为参数传递进来
 */
export function parseQRUrl(url) {
  if (typeof url !== 'string' || /^\s*$/i.test(url)) {
    return url;
  }
  url = url.replace(/\?*/, '').replace(/^\s*/, '').replace(/\s*$/, '');
  let params = url.split('&') || [];
  return params.reduce((query, item) => {
    let keyValue = item.split('=');
    if (keyValue[0] != null && keyValue[1] != null) {
      query[keyValue[0]] = keyValue[1];
    }
    return query;
  }, {});
}

// 显示繁忙提示
export const showLoading = (text) =>
  wx.showToast({
    title: text,
    icon: 'loading',
    duration: 3000,
  });

// 显示成功提示
export const showSuccess = (text) =>
  wx.showToast({
    title: text,
    icon: 'success',
  });

// 显示缺少字段
export const showTip = (text) =>
  wx.showToast({
    title: text,
    icon: 'none',
    duration: 3000,
  });
// 显示缺少字段
export const showFail = (text) =>
  wx.showToast({
    title: text,
    icon: 'fail',
    duration: 3000,
  });

// 显示失败提示
export const showModel = (title, content) => {
  wx.hideToast();
  wx.showModal({
    title,
    content: JSON.stringify(content),
    showCancel: false,
  });
};

// 函数节流，在一定时间内只执行一次函数
export const throttle = (fn, gapTime) => {
  if (gapTime == null || gapTime == undefined) {
    gapTime = 1000;
  }

  let lastTime = 0;

  return function (...args) {
    let nowTime = new Date().getTime();
    if (nowTime - lastTime > gapTime || !lastTime) {
      fn(...args);
      lastTime = nowTime;
    }
  };
};

// 对象合并
export const extend = function extend(target) {
  var sources = Array.prototype.slice.call(arguments, 1);
  for (var i = 0; i < sources.length; i += 1) {
    var source = sources[i];
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

// 对象复制
export function copy(oldObject) {
  let newObject = {};
  newObject = JSON.parse(JSON.stringify(oldObject));
  return newObject;
}

/**
 * 封装的wx.showModal
 * @param param0 wx.showMdal的参数
 * @param callback 回调函数，可选
 */
export function showModal(
  {
    title = '',
    content = '',
    showCancel = true,
    cancelColor = '#000000',
    confirmColor = '#FEA500',
    confirmText = '确定',
    success = (res) => res,
    cancelText = '取消',
  },
  callback
) {
  wx.showModal({
    title,
    content,
    confirmText,
    cancelText,
    confirmColor,
    cancelColor,
    showCancel,
    success: (res) => {
      success && success(res);
      callback && callback(res);
    },
  });
}
/**
 *
 * @param title 字符或者wx.toast的参数对象
 * @param icon toast图标
 * @param duration toast持续时间
 * @param mask 是否mask
 */
export function toast(title, icon = 'none', duration = 3000, mask = false) {
  if (typeof title === 'object') {
    icon = title.icon || 'none';
    duration = title.duration || 3000;
    mask = title.mask || false;
    title = title.title || '';
  }
  switch (icon) {
    case 'success':
      icon = '/assets/success.png';
      break;
    case 'error':
      icon = '/assets/error.png';
      break;
    case 'net-error':
      icon = '/assets/net-error.png';
      break;
    case 'speaking':
      icon = '/assets/speaking.png';
      break;
    case 'cancel':
      icon = '/assets/cancel.png';
      break;
  }
  let params = {
    title: title,
    icon: 'none',
    mask,
    duration: duration,
  };
  if (icon !== 'none') {
    params.image = icon;
  }
  console.log('title', title);
  wx.showToast(params);
}
/**
 * 格式化url后面的参数
 * @param query 请求参数，对象或者字符串
 */
export function queryString(query) {
  var str = '';
  if (query) {
    if (typeof query !== 'string') {
      var qs = [];
      for (let q in query) {
        qs.push(encodeURIComponent(q) + '=' + encodeURIComponent(query[q]));
      }
      str = qs.join('&');
    } else {
      str = query;
    }
  }
  return str;
}
/**
 * 检查是否是电话号码
 * @param phone 电话号码字符串
 */
export const checkTel = (phone, showToast = true) => {
  let myreg = /^(1[2-9][0-9])[0-9]{8}$/;
  if (phone.length == 0) {
    showToast &&
      wx.showToast({
        title: '请输入手机号码',
        icon: 'none',
      });
    return false;
  } else if (!myreg.test(phone)) {
    showToast &&
      wx.showToast({
        title: '手机号格式不正确',
        icon: 'none',
      });
    return false;
  } else if (phone.length < 11) {
    showToast &&
      wx.showToast({
        title: '手机号长度有误！',
        icon: 'none',
      });
    return false;
  }
  return true;
};
const loggerManager = wx.getLogManager ? wx.getLogManager(1) : null;
const logger = {
  log: (...msg) => {
    // console.log(msg)
    loggerManager && loggerManager.log(...msg);
    console.log(...msg);
  },
  info: (...msg) => {
    loggerManager && loggerManager.log(...msg);
    console.info(...msg);
  },
  error: (...msg) => {
    loggerManager && loggerManager.warn(...msg);
    console.error(...msg);
  },
  warn: (...msg) => {
    loggerManager && loggerManager.warn(...msg);
    console.warn(...msg);
  },
};
/**
 * 选择指定选择器的noderef
 * res：{
 *    height,
 *    width,
 *    top,
 *    left,
 *    bottom,
 *    right
 * }
 * @param selector css选择器
 * @param callback 回调函数
 */
export const getClientRect = (selector, callback) => {
  const query = wx.createSelectorQuery();
  query.select(selector).boundingClientRect();
  query.exec(function (res) {
    callback && callback(res);
  });
};
export const promisy = (name, params = {}) => {
  return new Promise((resolve, reject) => {
    if (!wx[name]) {
      return reject({ errMsg: '函数名不存在！' });
    }
    let successFn = params.success;
    let failFn = params.fail;
    params.success = (res) => {
      successFn && successFn(res);
      resolve(res);
    };
    params.fail = (res) => {
      failFn && failFn(res);
      reject(res);
    };
    wx[name](params);
  });
};

export const wxToPromise = (method, options = {}) => {
  //Promise 对象用于一个异步操作的最终完成（包括成功和失败）及结果值的表示。简而言之，就是处理异步请求的。
  return new Promise((resolve, reject) => {
    options.success = resolve;
    options.fail = (err) => {
      reject(err);
    };
    wx[method](options);
  });
};

/**
 * 获取地理位置授权
 * @param failedToOpenSetting 当拒绝授权的时候，弹出打开设置的对话框
 * @param doAuthorize 当发现没有授权的时候获取授权
 * @param title 打开设置对话框的提示语
 */
export async function getLocation(
  failedToOpenSetting = true,
  doAuthorize = true,
  title = '请授权地理位置，获取您的专属导购！'
) {
  try {
    // 获取设置
    let res = await promisy('getSetting');
    // 如没有授权地理位置
    if (!res.authSetting['scope.userLocation']) {
      // 授权弹框
      if (doAuthorize) {
        try {
          // 发起授权
          await promisy('authorize', { scope: 'scope.userLocation' });
          // 授权成功
          return promisy('getLocation', { type: 'gcj02' });
        } catch (error) {
          // 授权失败后打开设置
          if (failedToOpenSetting) {
            // 弹框提示
            let { confirm } = await promisy('showModal', {
              title: '授权提示',
              content: title,
            });
            if (confirm) {
              let { authSetting } = await promisy('openSetting');
              if (authSetting && authSetting['scope.userLocation']) {
                return promisy('getLocation', { type: 'gcj02' });
              } else {
                // 未授权
                return Promise.reject({
                  errMsg: '获取位置授权失败',
                });
              }
            } else {
              // 未授权
              return Promise.reject({
                errMsg: '获取位置授权失败',
              });
            }
          } else {
            // 未授权
            return Promise.reject({
              errMsg: error.errMsg || error.message || '获取位置授权失败',
            });
          }
        }
      } else {
        return Promise.reject({ errMsg: '位置授权失败！' });
      }
    } else {
      return promisy('getLocation', { type: 'gcj02' });
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

export async function chooseLocation(
  failedToOpenSetting = true,
  doAuthorize = true,
  title = '请授权地理位置，获取您的专属导购！',
  options = {}
) {
  try {
    // 获取设置
    let res = await promisy('getSetting');
    // 如没有授权地理位置
    if (!res.authSetting['scope.userLocation']) {
      // 授权弹框
      if (doAuthorize) {
        try {
          // 发起授权
          await promisy('authorize', { scope: 'scope.userLocation' });
          // 授权成功
          return promisy('chooseLocation', options);
        } catch (error) {
          // 授权失败后打开设置
          if (failedToOpenSetting) {
            // 弹框提示
            let { confirm } = await promisy('showModal', {
              title: '授权提示',
              content: title,
            });
            if (confirm) {
              let { authSetting } = await promisy('openSetting');
              if (authSetting && authSetting['scope.userLocation']) {
                return promisy('chooseLocation', options);
              } else {
                // 未授权
                return Promise.reject({
                  errMsg: '获取位置授权失败',
                });
              }
            } else {
              // 未授权
              return Promise.reject({
                errMsg: '获取位置授权失败',
              });
            }
          } else {
            // 未授权
            return Promise.reject({
              errMsg: error.errMsg || error.message || '获取位置授权失败',
            });
          }
        }
      } else {
        return Promise.reject({ errMsg: '位置授权失败！' });
      }
    } else {
      return promisy('chooseLocation', options);
    }
  } catch (error) {
    return Promise.reject(error);
  }
}

function getRad(d) {
  let PI = Math.PI;
  return (d * PI) / 180.0;
}
/**
 * 利用经纬度算出两个点的距离，返回值单位KM
 * @param {*} latitude 维度1
 * @param {*} longitude 经度1
 * @param {*} latitude2 维度2
 * @param {*} longitude2 经度2
 */
function getFlatternDistance(lat1, lng1, lat2, lng2) {
  var EARTH_RADIUS = 6378137.0; //单位M
  var f = getRad((lat1 + lat2) / 2);
  var g = getRad((lat1 - lat2) / 2);
  var l = getRad((lng1 - lng2) / 2);

  var sg = Math.sin(g);
  var sl = Math.sin(l);
  var sf = Math.sin(f);

  var s, c, w, r, d, h1, h2;
  var a = EARTH_RADIUS;
  var fl = 1 / 298.257;

  sg = sg * sg;
  sl = sl * sl;
  sf = sf * sf;

  s = sg * (1 - sl) + (1 - sf) * sl;
  c = (1 - sg) * (1 - sl) + sf * sl;

  w = Math.atan(Math.sqrt(s / c));
  r = Math.sqrt(s * c) / w;
  d = 2 * w * a;
  h1 = (3 * r - 1) / 2 / c;
  h2 = (3 * r + 1) / 2 / s;

  return (
    Math.round(
      ((d * (1 + fl * (h1 * sf * (1 - sg) - h2 * (1 - sf) * sg))) / 1000) * 10
    ) / 10
  );
}
// ES6的默认导出
// export default { getFlatternDistance, getLocation, parseQRUrl, parseScene, queryString, toast, showModal, showSuccess, showTip, showModel,getClientKey, checkTel, throttle, extend, copy, logger, getClientRect }
// commonjs形式的导出
// module.exports = { getClientKey, getFlatternDistance, getLocation, parseQRUrl, parseScene, queryString, toast, showModal, showSuccess, showTip, showModel, checkTel, throttle, extend, copy, logger, getClientRect }
