$(function () {//必须dom加载完成后再执行
    $("#welcomestr").text($.i18n.prop("welcome"));//多语种切换
});

//全局变量，数据源，本地0 或 网络1
//网络1取实时真实数据
//本地0可以构建json，随意调整数据
var datasource = 1;

//接口地址
var webhost = "http://sluapi.blockchaindata.top";
var weburl = webhost + "/silubium-api";

//中英文时间格式统一处理，参数为时间戳
function cnen_timeformater(timemills) {
    var d3timeformat=d3.timeFormat($.i18n.prop("svgTimeFormat"));;
    try {
        var temp=new Date(1000 * timemills);
        // return (temp.format($.i18n.prop("svgTimeFormat")));
        return d3timeformat(temp);
    } catch (err) {
        console.error(err);
        return d3timeformat(temp);
    }
}

//只返回年月日
function cnen_timeformaterShort(timemills) {
    var d3timeformat=d3.timeFormat($.i18n.prop("svgTimeFormatYMD"));
    try {
        var temp=new Date(1000 * timemills);
        return d3timeformat(temp);
    } catch (err) {
        console.error(err);
        return d3timeformat(temp);
    }
}

//获得相对路径
function GetUrlRelativePath() {
    var url = document.location.toString();
    var arrUrl = url.split("//");

    var start = arrUrl[1].indexOf("/");
    var relUrl = arrUrl[1].substring(start);//stop省略，截取从start开始到结尾的所有字符

    if (relUrl.indexOf("?") != -1) {
        relUrl = relUrl.split("?")[0];
    }
    return relUrl;
}