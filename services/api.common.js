import { request } from '@utils/requestUtil';

/** 获取广告申请明细列表 */
export const getAdRequestApi = (params) => {
  return request({
    method: 'GET',
    url: '/user/advertisingsublist',
    params,
  });
};

/** 广告申请明细修改 */
export const modifyAdRequestApi = (params) => {
  return request({
    method: 'POST',
    url: '/user/advertisingsublist/update',
    data: params,
  });
};