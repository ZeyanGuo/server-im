//start方法开启服务器，服务器直接调用build方法并且放回webpack打包之后的React页面，
//服务器使用Express框架进行搭建，书写server router(服务器路由)，路由分为方法路由和页面路由。
//实现模版热替换已经热加载。
//单页应用分模块加载实现策略。(
//路由配置拆分怎么做？
//动态加载怎么做？
//props怎么传递？
//登录拦截怎么做？
//列表页能不能缓存？)


//start the server.
const server = require('../src');
