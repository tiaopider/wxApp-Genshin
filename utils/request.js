import wxToPromise from './wx'; //这是将第一步写好的wxToPromise导入
import APIConfig from '../config/api'; //这个是导入我存放的接口地址配置类
import exceptionMessage from '../config/exception-message'; //这是一个错误信息提示的类
import { showTextToast } from './util'; //这里是一个提示类
import APIAddress from '../config/api-address'; //这个是导入我存放的接口地址配置类

class Http {
  static async get({ url, data, method = 'GET', refetch = true }) {
    wx.showLoading({
      title: '数据加载中',
    });
    let res;
    try {
      res = await wxToPromise('request', {
        url: `${APIConfig.baseUrlBatch}${url}`, //这个地方就是整个接口地址，我就不贴出自己的了
        data,
        method,
        header: {
          token: APIConfig.token, //这个地方是头部添加了token
        },
      });
    } catch (e) {
      // 代码逻辑异常、无网络、请求超时会走这里
      showTextToast(e.errMsg);
      throw new Error(e.errMsg);
    }
    wx.hideLoading();

    if (res.statusCode < 400) {
      return res.data; //返回接口数据，具体看接口的数据格式是怎么样的
    }

    this._showError(res.data.error_code, res.data.message);

    throw new Error(
      typeof res.data.message === 'object'
        ? Object.values(res.data.message).join(';')
        : res.data.message
    );
  }

  static async put({ url, data, method = 'PUT', refetch = true }) {
    let res;
    try {
      res = await wxToPromise('request', {
        url: `${APIConfig.baseUrlBatch}${url}`,
        data,
        method,
        header: {
          'content-type': 'application/json',
          token: APIConfig.token,
        },
      });
    } catch (e) {
      // 代码逻辑异常、无网络、请求超时会走这里
      showTextToast(e.errMsg);
      throw new Error(e.errMsg);
    }

    console.log('自己封装的');
    console.log(res);

    // if (res.statusCode < 400) {
    //   return res.data
    // }

    // this._showError(res.data.error_code, res.data.message)

    // throw new Error(typeof res.data.message === 'object' ? Object.values(res.data.message).join(';') : res.data.message)
  }

  static async post({ url, data, method = 'POST', refetch = true }) {
    wx.showLoading({
      title: '数据加载中',
    });
    let res;
    try {
      res = await wxToPromise('request', {
        url: `${APIConfig.baseUrlBatch}${url}`,
        data,
        method,
        header: {
          'content-type': 'application/json',
          token: APIConfig.token,
        },
      });
    } catch (e) {
      wx.hideLoading();
      // 代码逻辑异常、无网络、请求超时会走这里
      showTextToast(e.errMsg);
      throw new Error(e.errMsg);
    }

    wx.hideLoading();

    // console.log("自己封装的")

    if (res.data.code == 401) {
      this._showResError('token失效，请重新登录');
      wx.showModal({
        title: '登录已过期',
        content: '请退出软件',
        success(res) {
          if (res.confirm) {
            wx.reLaunch({
              url: '/pages/login/login',
            });
            return;
          } else if (res.cancel) {
            return;
          }
        },
      });
    } else if (res.data.code == 500) {
      showTextToast('服务程序错误');
      return res.data;
    } else if (res.statusCode < 400) {
      return res.data;
    } else {
      showTextToast('网络开小差了，请稍后再试');
      return res.data;
    }

    this._showError(res.data.error_code, res.data.message);

    throw new Error(
      typeof res.data.message === 'object'
        ? Object.values(res.data.message).join(';')
        : res.data.message
    );
  }
  static _showError(errorCode, message = '') {
    let title;
    const errorMessage = exceptionMessage[errorCode];
    title = errorMessage || message || '未知异常';

    title = typeof title === 'object' ? Object.values(title).join(';') : title;

    wx.showToast({
      title,
      icon: 'none',
      duration: 2000,
    });
  }

  static _showResError(resultMsg, descMsg) {
    let title;
    if ('失败' == descMsg) {
      descMsg == '';
    }
    title = resultMsg || descMsg || '未知异常';

    wx.showToast({
      title,
      icon: 'none',
      duration: 2000,
    });
  }
}
export default Http;
