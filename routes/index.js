const Router = require('koa-router')
const { Common } = require("../controllers/controllers.js")
const { createRoutes } = require("./routes");
const { createRoutesFail } = require("./routesFail");
const { customerWarningCallback } = require("../interceptor/customerWarning");
const timerTask = require("./timer");
const db = require('../config/db')
const Sequelize = db.sequelize;
const ConfigTable = Sequelize.import('../schema/config');

global.monitorInfo = {
    registerEmailCode: {},
    webMonitorIdList: [],
    userIdArray: [],
    tempDebugInfoArray: {},
    debugInfoArray: [],
    debugInfoTimer: {},
    debugTimer: null,
    debugInfo: {},
    debugClearLocalInfo: [], // 记录将要清理本地缓存的userId
    logServerStatus: true, // 日志服务状态
    stopWebMonitorIdList: [], // 停止上报服务的项目列表
    waitCounts: 40,   // 日志等待上报的时间间隔，可以调整日志上报的密度（40代表8s上报一次）
    logCountInMinute: 0, // 每分钟的日志量
    logCountInMinuteList: [], // 每分钟日志量数组
    errorLogListForLast200: [],  // 存放最近200条报错日志
    purchaseCodeValid: false,
    warningMessageList: []
}
global.tableTimeStamp = new Date().Format("yyyyMMdd")
global.web_monitor_version = "1.0.0"
global.BUILD_ENV = process.argv[3]

const router = new Router({
    prefix: '/server'
})

ConfigTable.sync({force: false}).then(() => {
    Common.checkPurchase(() => {
        createRoutes(router)
        // 启动定时任务, 如果是slave模式，则不启动定时器
        if (global.serverType == "slave") {
            Common.consoleInfo(global.serverType)
        } else {
            timerTask(customerWarningCallback)
        }
        // 3秒后开始消费消息
        setTimeout(() => {
            Common.startReceiveMsg()
        }, 3000)
    }, () => {
        createRoutesFail(router)
        Common.consoleInfo()
    })
})

module.exports = router