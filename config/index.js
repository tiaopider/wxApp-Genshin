const CONFIG = {
  // 开发环境配置
  dev: {
    env: "dev",
    apiBasePath: "https://zht-gateway-test.okii.com",
    basePath: "https://zhth5-test.okii.com",
    sso: {
      realm: "Channel",
      "auth-server-url": "https://sso-test.okii.com/auth/",
      "ssl-required": "external",
      resource: "ZHT",
      "public-client": true,
      "confidential-port": 0,
    },
    hrUserUrl: "http://hrtest.eebbk.com", //hr测试环境
  },
  // 测试环境配置
  test: {
    env: "test",
    apiBasePath: "https://zht-gateway-test.okii.com",
    basePath: "https://zhth5-test.okii.com",
    sso: {
      realm: "Channel",
      "auth-server-url": "https://sso-test.okii.com/auth/",
      "ssl-required": "external",
      resource: "ZHT",
      "public-client": true,
      "confidential-port": 0,
    },
    hrUserUrl: "http://hrtest.eebbk.com", //hr测试环境
  },
  // 正式环境配置
  prod: {
    env: "prod",
    apiBasePath: "https://qdapi.okii.com",
    basePath: "https://zhth5.okii.com",
    sso: {
      realm: "Channel",
      "auth-server-url": "https://qdlogin.okii.com/auth/",
      "ssl-required": "external",
      resource: "ZHT",
      "public-client": true,
      "confidential-port": 0,
    },
    hrUserUrl: "https://qdhr.eebbk.com", //hr正式环境
  },
};
/** 当前环境自动检测 */
let version = __wxConfig.envVersion;
let config;
switch (version) {
  /* 测试环境(体验版) */
  case "trial":
    config = CONFIG["dev"];
    break;
  /* 测试环境(开发环境) */
  case "develop":
    config = CONFIG["dev"];
    break;
  /* 生产环境(正式版) */
  case "release":
    config = CONFIG["prod"];
    break;
  default:
    config = CONFIG["prod"];
}
export default config;