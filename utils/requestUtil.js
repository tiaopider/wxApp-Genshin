import { queryString, toast, getClientKey, promisy, showModal } from '@utils/index';
// 导入缓存相关的接口
import {
  RemoveCache,
  SaveCache,
  SaveCacheByKey,
  GetCacheByKey,
  GetCache,
} from '@utils/storageUtil';
import { login } from '@utils/userInfo';
const { SUCCESS, SUCCESS2, EXPIRED } = {
  SUCCESS: '0000001',
  SUCCESS2: '000001',
  EXPIRED: '0000002',
};
/** 域名和配置相关信息 */
import CONFIG from '../config/index';
/** 最大的同时发送请求数量，暂时设置为6 */
const MAX_REQUEST = 6;
/** 请求队列 */
const REQUEST_LIST = [];
/** 当前任务队列 */
const TASK_LIST = new Map();
/** 请求id */
let reqId = 0;
/** 计时器 */
let td = null;
// let isNavigating = false;
const clientKey = getClientKey();
/** 网络状态 */
let network = {
  isConnected: true,
  networkType: 'wifi',
};
wx.getNetworkType({
  success(res) {
    network.networkType = res.networkType;
    if (network.networkType !== 'none') {
      network.isConnected = true;
    } else {
      network.isConnected = false;
    }
  },
});
// 注册网络变化
wx.onNetworkStatusChange(function (res) {
  network = res;
});

//跳转到登录页面
// function naviteToLogin() {
//   var pages = getCurrentPages();
//   var lastPage = pages[pages.length - 1];
//   // if (/pages\/login\/login/.test(lastPage.route)) {
//   //   return
//   // }
//   // wx.navigateTo({
//   //   url: '/pages/login/login?redirectUrl=1',
//   //   complete() {
//   //     isNavigating = false;
//   //   }
//   // })
// }

// 获取访问Token
// function getToken() {

// }
const regexpression = /^[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*$/;

function isJWToken(str = '') {
  return typeof str === 'string' && regexpression.test(str);
}
/** 全部请求的成功回调处理 */
function successCallback(res, params, callback) {
  if (
    /user\/checkUserIsRegister/.test(params.url) &&
    isJWToken(res.data.desc)
  ) {
    SaveCacheByKey('access_token', -1, res.data.desc);
  }
  callback && callback(res.data, res, params);
}
// 告警定义
let lastAlertTime = Date.now();
let failCount = 0;
/** 全部请求的失败回调 */
function failCallback(res, params, callback) {
  let now = Date.now();
  failCount++;
  if (res.statusCode != '401' && CONFIG.env === 'prod') {
    apiAlert({
      config: {
        url: params.url,
        params: params.query,
        data: params.data,
        headers: params.headers,
      },
      response: {
        responseText: JSON.stringify(res.data),
        status: res.statusCode,
      },
    });
  }
  // 1s内失败了5次，告警
  if (failCount > 5 && now - lastAlertTime < 1000) {
    failCount = 0;
    lastAlertTime = now;
  }
  // 如果过期的话，需要重新登录
  // if (res.data.code === EXPIRED) {
  //   // 过期的话把队列的请求也都清除掉
  //   clearRequests()
  //   wx.clearStorage();
  //   let qs = []
  //   try {
  //     let lauchOptions = wx.getLaunchOptionsSync && wx.getLaunchOptionsSync();
  //     let query = lauchOptions.query;
  //     for (var i in query) {
  //       qs.push(i + '=' + encodeURIComponent(query[i]));
  //     }
  //   } catch (error) {

  //   }
  // login()
  // }
  callback && callback(res.data, res, params);
}
/** 全部请求的完成回调 */
function completeCallback(params, res, callback) {
  console.log('<<<<< ' + params.url + ' >>>>>');
  callback && callback(res);
  // 请求完成后删除当前队列的列表，列表最大只允许10个
  TASK_LIST.delete(params.reqId);
  doListRequest();
}

/** 获取任务列表，导出给外面用 */
export function getTaskList() {
  // 这里只返回一个拷贝，但是值还是引用类型
  return new Map(TASK_LIST);
}
/** 取消某个请求，前提是这个请求还没有完成 */
export function abortTask(id) {
  let task = TASK_LIST.get(id);
  if (task.params) {
    task.params.canceled = true;
  }
  task && task.task && task.task.abort && task.task.abort();
  TASK_LIST.set(id, task);
  task = null;
}
/** 把所有队列中的请求都清除 */
export function clearRequests() {
  let len = TASK_LIST.size;
  for (let i = 0; i < 10 - len && REQUEST_LIST.length; i++) {
    REQUEST_LIST[i].canceled = true;
  }
  REQUEST_LIST.splice(0);
}
/** 队列开始情况 */
function doListRequest() {
  let len = TASK_LIST.size;
  // https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html
  //
  for (let i = 0; i < 10 - len && REQUEST_LIST.length; i++) {
    // 先进先出，保证请求顺序
    let qParam = REQUEST_LIST.shift();
    // 执行任务
    qParam && doTask(qParam);
  }
}

// 打印错误日志
function log(msg) {
  console.error('错误信息: ');
  console.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
}
// 统一接口请求错误处理，用来处理权限校验这些东西。逻辑暂定
function handleError(params, res) {
  // body...
  console.log(params, res);
  if (res.statusCode == '401') {
    login(null, true);
  }
}

function parseData(data) {
  if (typeof data !== 'string') {
    /* 替换后端返回数据中的字符串"null"为null */
    return JSON.parse(JSON.stringify(data).replace(/"null"/g, `null`));
  }
  try {
    data = JSON.parse(data);
  } catch (e) {}
  return data;
  // body...
}
/**
 * 对微信wx.request的请求封装
 * 添加了如下字段：
 * @loading：显示wx.showLoading
 * @cache：增加缓存，可以对接口进行缓存，单位秒
 * @nocache：删除本地缓存的数据
 * @query：将url请求参数数据进行编码处理
 * @toast：请求异常是会提示toast
 * @needToken：接口需要鉴权的时候会自动加入鉴权信息。鉴权失败会跳转到登录界面
 * @enc：加密接口
 * @successCode: 用来标记成功状态码，大数据上传的时候跟业务服务器不一致，所以给参数重新定义
 * @uploadFile： 上传文件，对上传文件进行了封装

 * 这里的使用方式是跟wx.request一样的，你可以完全按wx.request来传递参数，但同时也扩展了promise的方式
 * 主要扩展的功能：
 * 1、请求的加载提示(loading=true)
 * 2、请求异常时的toast提示(toast=true)
 * 3、为请求添加缓存(cache=60s 缓存1分钟)
 * 4、规范化业务服务器请求格式({code: 0, desc: '', data: ''})
 * 5、添加了一个query参数，用来组装到url后面({query: {name: ''}})
 * 6、
 */
export function request(url, params) {
  if (typeof url === 'string') {
    params.url = url;
  } else if (url && typeof url === 'object') {
    params = url;
  }
  // 每个请求的reqId，用来取消请求用。
  params.reqId = reqId++;

  if (!params.url) {
    let data = {
      code: 'URL_ERROR',
      desc: '请提供URL！',
    };
    completeCallback(
      params,
      {
        data: data,
      },
      params.complete
    );
    params.fail && params.fail(data);
    return Promise.reject(data);
  }
  // 添加服务器前缀
  if (!/^http/i.test(params.url)) {
    params.url = CONFIG.apiBasePath + params.url;
  }
  let isHttp = /http\:/.test(params.url);
  params.url =
    (isHttp ? 'http://' : 'https://') +
    params.url.replace(/https?\:\/\//, '').replace(/[/]+/, '/');
  // GET请求放在data里面的数据会自动进行encodeURIComponent，
  // 并添加到url后面，只需处理其他请求的query
  params.query = params.query || params.params || {};
  if (Object.keys(params.query).length) {
    params.url +=
      (/\?/.test(params.url) ? '&' : '?') + queryString(params.query);
  }
  // 给方法大写
  params.method = (params.method || 'GET').toUpperCase();
  // 缓存
  if (params.cache) {
    let data;
    try {
      data = GetCache({
        url: params.url,
        method: params.method,
      });
    } catch (e) {
      data = null;
      RemoveCache(params);
    }
    if (data) {
      params.success && params.success(data);
      completeCallback(params, data, params.complete);
      return Promise.resolve(data);
    }
  } else if (params.nocache) {
    RemoveCache(params);
  }
  // 如果有缓存的话就不提示了，没有缓存再提示
  if (!network.isConnected) {
    let data = {
      code: 'NET_ERROR',
      desc: '没有网络',
    };
    toast('没有网络', 'net-error');
    params.fail &&
      params.fail({
        data,
      });
    completeCallback(
      params,
      {
        data,
      },
      params.complete
    );
    return Promise.reject(data);
  }
  // 注意默认的请求头Content-Type为application/json
  params.header = params.header || params.headers || {};
  if (params.uploadFile) {
    delete params.header['content-type'];
  }
  let token = GetCacheByKey('token');
  if (token && !params.header['Authorization']) {
    params.header['Authorization'] = `Bearer ${token}`;
  }
  params.loading = params.loading == null ? true : params.loading;
  params.toast = params.toast == null ? true : params.toast;
  params.alert = params.alert == null ? false : params.alert;
  //获取用户的手机型号和系统版本
  // params.header.phoneModel = account.systemInfo && account.systemInfo.model;
  // params.header.phoneSysver = account.systemInfo && account.systemInfo.system;
  // 请求自动加loading提示
  if (params.loading) {
    wx.showLoading({
      title: params.loadingText || '加载中...',
      mask: true,
    });
  }
  // 传入的回调函数，参考wx.request说明
  let successFn = params.success;
  let failFn = params.fail;
  let completeFn = params.complete;
  let _req = new Promise(async (resolve, reject) => {
    params.header = params.header || {};
    // let userInfo = await getUserInfo();
    if (!params.header['tenant-id']) {
      let currentTenant = GetCacheByKey('current-tenant');
      if (currentTenant) {
        params.header['tenant-id'] = currentTenant.sysTenantId;
      } else {
        login(null, true);
      }
    }

    params.success = function (res) {
      let {
        // statusCode,
        data,
      } = res;
      data = parseData(data);
      res.data = data;
      // 大数据或其他非业务API调用时，返回的数据格式可能跟业务服务器不一样
      if (params.successCode) {
        if (data[params.code || 'code'] == params.successCode) {
          // resolve(res.data);
          successFn && successFn(data, res);
          successCallback(res, params, resolve);
        } else {
          failFn && failFn(data, res);
          failCallback(res, params, reject);
        }
        return;
      }
      //    TOKENCOMPULSORYMISS("1005", "登录态被强制失效"),
      // TOKENINVALID("1006", "登录态不合法"),
      // TOKENTIMEOUT("1007", "登录状态已经失效，请重新登陆"),
      // 当返回的状态码是这些的话，说明需要重新登录，跳转到重新登录界面
      if (data && data.code != SUCCESS && data.code != SUCCESS2) {
        // 其他不是SUCCESS的code都标识请求失败，不会进入success callback里面
        failFn && failFn(data, res);
        failCallback(res, params, reject);
        return;
      } else if (!data) {
        failFn &&
          failFn(
            {
              code: res.statusCode,
              desc: res.errMsg,
            },
            res
          );
        failCallback(res, params, reject);
        return;
      }
      // 存到缓存
      if (params.cache) {
        SaveCache(
          {
            url: params.url,
            method: params.method,
            cache: params.cache,
          },
          res.data
        );
      }
      // resolve(res.data);
      // 返回数据是加密的时候进行解密
      successFn && successFn(data, res);
      successCallback(res, params, resolve);
    };
    params.fail = function (res) {
      let data = res.data;
      data = parseData(data);
      // 可能服务器错误或者其他错误，但是不是服务器返回的标准格式，这里组装成跟服务器标准格式的数据返回
      if (!data) {
        data = {
          code: res.statusCode,
          desc: res.errMsg,
        };
      } else {
        data = {
          code: data.code || res.statusCode,
          desc: data.desc || data.message || res.errMsg,
        };
      }
      res.data = data;
      failFn && failFn(data, res);
      failCallback(res, params, reject);
      log(JSON.stringify(res));
    };
    params.complete = function (res) {
      let { data, errMsg, statusCode } = res;
      let toasting = false;
      // 如果要提示的话就走toast提示
      if (params.toast) {
        let msg = `${errMsg}(${statusCode})`;
        let requestError = false;
        if (data) {
          // 自定义状态码
          if (
            params.successCode &&
            data[params.code || 'code'] != params.successCode
          ) {
            requestError = true;
            // 非自定义的状态码
          } else if (data.code != SUCCESS && data.code != SUCCESS2) {
            requestError = true;
          }
        } else if (statusCode != 200) {
          requestError = true;
        }
        // toast提示语，以服务器的返回为准
        if (data && data.code) {
          msg = `${data.desc}(${data.code})`;
        } else if (data && data.message) {
          msg = `${data.message}(${statusCode})`;
        }
        if (requestError) {
          toasting = true;
          if (params.alert) {
            wx.hideLoading();
            showModal({
              title: '',
              content: `(${clientKey})` + msg,
              showCancel: false,
            });
          } else {
            toast(`(${clientKey})` + msg);
          }
        }
      }
      // 加载提示，延迟进行隐藏，不然闪得太快了
      if (!toasting && params.loading) {
        clearTimeout(td);
        td = setTimeout(function () {
          !getApp()['BI_WAIT'] && wx.hideLoading();
        }, 500);
      }
      // 完成回调
      completeCallback(params, res, completeFn);
      handleError(params, res);
    };
    // 如果当前队列的长度还有多的话就立即执行请求
    if (TASK_LIST.size < MAX_REQUEST) {
      doTask(params);
    } else {
      // 否则缓存到队列中
      REQUEST_LIST.push(params);
    }
  });
  _req.reqId = params.reqId;
  return _req;
}
export function wxRequest(options) {
  return promisy('request', options);
}
/**
 * POST请求简写
 * @param url 请求url
 * @param query 请求URL参数
 * @param data 请求实体参数
 * @param params 其他参数同request
 */
request.post = function post(url, data, query, params) {
  return request(
    Object.assign(
      {
        url: url,
        data,
        query,
        method: 'POST',
      },
      params
    )
  );
};
/**
 * GET请求的简写
 * @param url 请求url
 * @param query 请求参数
 * @param params 其他参数同request
 */
request.get = function get(url, query, params) {
  return request(
    Object.assign(
      {
        url: url,
        method: 'GET',
        query: query,
      },
      params
    )
  );
};
/** 真正发起请求在这里 */
function doTask(params) {
  let requestTask = params.uploadFile
    ? wx.uploadFile(params)
    : wx.request(params);
  // 把reqId传出去
  if (params.canceled && requestTask && requestTask.abort) {
    requestTask.abort();
    return requestTask;
  }
  params.beforeSend && params.beforeSend(requestTask, params.reqId);
  // 这里用的是Map，存入requestTask，后面可以根据这个来取消
  TASK_LIST.set(params.reqId, {
    params: params,
    task: requestTask,
  });
  return requestTask;
}
export const apiAlert = (extend = {}) => {
  let userInfo = GetCacheByKey('userInfo') || {
    memberId: clientKey,
  };
  let sysInfo = wx.getSystemInfoSync();
  var pages = getCurrentPages();
  return new Promise((resolve, reject) => {
    let requestRandomKey = (Date.now() + Math.random() * 10000000).toString(32);
    wxRequest({
      url: 'https://zhtfront-test.okii.com/wxwork/alertrobot',
      method: 'POST',
      data: {
        moduleName: '终端管理系统-app端',
        machineId: clientKey + '.' + requestRandomKey,
        location: pages[pages.length - 1] && pages[pages.length - 1].route,
        functionName: '接口请求异常',
        // 应用名称
        an: 'ZHT',
        extend: {
          common: {
            clientKey,
            date: Date.now(),
            env: CONFIG.env,
            ...sysInfo,
          },
          extend: {
            ...extend,
            userInfo,
          },
        },
      },
      fail: () => {
        reject();
      },
      success: () => {
        resolve();
      },
    });
  });
};
export default {
  request,
  getTaskList,
  abortTask,
  clearRequests,
};
