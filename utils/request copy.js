import { config } from '../config.js';
import { Cache } from './cache.js';

const cache = new Cache(7200);
//提示信息的对象
const tips = {
  1: '抱歉，出现了一个错误',
  999: '网络发生异常，请刷新一下',
};
// # 解构
//定义一个HTTP类
class HTTP {
  //封装request方法，第一个参数请求地址，第二个参数传递参数，第三个参数请求方式
  request({ url, data = {}, method = 'GET' }) {
    //返回promise对象  resolve 成功的回调方法 reject失败的回调方法 一旦发生就不会改变
    return new Promise((resolve, reject) => {
      //调用类型方法
      this._request(url, resolve, reject, data, method);
    });
  }
  //定义一个方法_request()   类型的属性通常用_标识 python语法，私有方法用_
  //第一个参数代表请求地址，第二个参数成功回调，第三个参数失败回调，第四个参数传递参数，第五个参数请求方式
  _request(url, resolve, reject, data = {}, method = 'GET') {
    //使用微信内容的发送网络请求方法
    wx.request({
      url: config.api_base_url + url,
      method: method,
      data: data,
      header: {
        'content-type': 'application/json',
        token: cache.get('token'),
      },
      success: (res) => {
        const code = res.statusCode.toString();
        //进行判断http状态码是200,2开头的，即请求成功
        if (code.startsWith('2')) {
          resolve(res.data);
        } else {
          reject();
          const error_code = res.data.error_code;
          this._show_error(error_code);
        }
      },
      fail: (err) => {
        reject();
        this._show_error(1);
      },
    });
  }

  _show_error(error_code) {
    if (!error_code) {
      error_code = 1;
    }
    const tip = tips[error_code];
    wx.showToast({
      title: tip ? tip : tips[1],
      icon: 'none',
      duration: 2000,
    });
  }
}

export { HTTP };
