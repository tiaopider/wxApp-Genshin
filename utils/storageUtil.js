// 获取key值
export function GetStorageKey(url, method) {
  return `${method.toUpperCase()}:${url.toUpperCase()}`;
}
//删除缓存
export function RemoveCache({ url = '', method = 'get' }) {
  try {
    wx.removeStorage({
      key: GetStorageKey(url, method),
    });
  } catch (error) {}
}
//删除缓存
export function RemoveCacheSync({ url = '', method = 'get' }) {
  try {
    wx.removeStorageSync(GetStorageKey(url, method));
  } catch (error) {}
}
/**
 * 保存缓存信息，存的是res对象
 * @param cache 缓存时间，单位s
 * @param url 缓存url
 * @param method 缓存方法
 * @param res 缓存数据
 */
export function SaveCache({ cache = 0, url = '', method = 'get' }, res) {
  try {
    wx.setStorageSync(GetStorageKey(url, method), {
      res,
      expires: Date.now() + cache * 1000,
    });
  } catch (error) {}
  // wx.setStorage({
  //   key: GetStorageKey(url, method),
  //   data: {
  //     res,
  //     expires: Date.now() + cache * 1000
  //   }
  // })
}
/**
 * 添加缓存，设置缓存时间
 * @param key 缓存的值
 * @param cache 需要缓存的时间，单位秒
 * @param res 需要缓存的数据
 */
export function SaveCacheByKey(key, cache = -1, res) {
  try {
    console.log(key);
    console.log(cache);
    console.log(res);
    wx.setStorageSync(key, {
      res,
      expires: cache < 0 ? cache : Date.now() + cache * 1000,
    });
  } catch (error) {
    console.error(error);
  }
  // wx.setStorage({
  //   key: key,
  //   data: {
  //     res,
  //     expires: cache < 0 ? cache : Date.now() + cache * 1000
  //   }
  // })
}
// 获取缓存
export function GetCache({ url = '', method = 'get' }) {
  try {
    let data = wx.getStorageSync(GetStorageKey(url, method));
    if (data && data.res && data.expires && data.expires > Date.now()) {
      return data.res;
    }
  } catch (error) {}
  return null;
}

/**
 * 获取缓存
 * @param key 存储ID
 */
export function GetCacheByKey(key) {
  try {
    let data = wx.getStorageSync(key);
    if (data && data.res && data.expires < 0) {
      return data.res;
    }
    if (data && data.res && data.expires && data.expires > Date.now()) {
      return data.res;
    }
  } catch (error) {}
  return null;
}
/**
 * 根据缓存key删除缓存
 * @param key 缓存值
 */
export function deleteCache(key) {
  try {
    let data = wx.getStorageSync(key);
    if (data && data.res && data.expires && data.expires > Date.now()) {
      wx.removeStorageSync(key);
    }
  } catch (error) {}
}
export function removeCacheByKey(key) {
  try {
    wx.removeStorageSync(key);
  } catch (error) {}
}
/**
 * 删除除了指定的键之外的缓存
 * @param {Array} exceptKeys 排查删除的缓存键值
 */
export function removeCacheExcept(exceptKeys) {
  try {
    let { keys } = wx.getStorageInfoSync();
    let removeKeys = keys.filter((key) => exceptKeys.indexOf(key) === -1);
    for (var i = 0, len = removeKeys.length; i < len; i++) {
      removeCacheByKey(removeKeys[i]);
    }
  } catch (error) {}
}
/**
 * 删除过期缓存
 * @param keyName 要指定删除的过期存储
 */
export function ClearExpiresCache(keyName) {
  let storageInfo = wx.getStorageInfoSync();
  if (keyName) {
    deleteCache(keyName);
  } else {
    for (let key of storageInfo.keys) {
      deleteCache(key);
    }
  }
}
