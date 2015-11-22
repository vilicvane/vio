# vio - 基于 Promise 的路由

在之前 zm-www 使用的 vio 版本基础上, 这一版 vio 主要解决如下问题:

1. 整合原有 vio 和 page-router.
2. 整合模板.
3. 开发环境下按照访问路径动态加载路由.

## 访问路径到文件系统的匹配规则

default 设置为 "desktop"

### /

- Routes

  + /desktop/default.js

- Views

  + /desktop/default.hbs
  + /desktop/default/default.hbs
  + /desktop/default/default.hbs *

### /desktop/

- Routes

  + /desktop/default.js

- Views

  + /desktop/default.hbs
  + /desktop/default/default.hbs
  + /desktop/default/default.hbs *

### /mobile/

如果 /mobile 目录存在

- Routes

  + /mobile/default.js           - default
  
- Views

  + /mobile/default.hbs
  + /mobile/default/default.hbs
  + /mobile/default/default.hbs *

否则

- Routes

  + /desktop/default.js          - mobile
  
  + /desktop/mobile.js           - default
  + /desktop/mobile/default.js   - default
  + /desktop/mobile/mobile.js    - default

- Views

  + /desktop/mobile/default.hbs  
  + /desktop/mobile/mobile.hbs

### /desktop/some-path/

- Routes

  + /desktop/default.js               - somePath
  
  + /desktop/some-path.js             - default
  + /desktop/some-path/default.js     - default
  + /desktop/some-path/some-path.js   - default

- Views

  + /desktop/some-path.hbs
  + /desktop/some-path/default.hbs
  + /desktop/some-path/default/default.hbs
  + /desktop/some-path/some-path.hbs

### /desktop/some/path/

- Routes

  + /desktop.js                      - some
  + /desktop/default.js              - some
  + /desktop/desktop.js              - some
  
  + /desktop/some.js                 - default / path
  + /desktop/some/default.js         - default / path
  + /desktop/some/some.js            - default / path
  + /desktop/some/path.js
  + /desktop/some/path/path.js

- Views
  + /desktop/some/path.hbs
  + /desktop/some/path/path.hbs
