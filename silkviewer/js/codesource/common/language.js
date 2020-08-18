/**
 * cookie操作
 */
var getCookie = function (name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        var path = options.path ? '; path=' + options.path : '';
        var domain = options.domain ? '; domain=' + options.domain : '';
        var s = [cookie, expires, path, domain, secure].join('');
        var secure = options.secure ? '; secure' : '';
        var c = [name, '=', encodeURIComponent(value)].join('');
        var cookie = [c, expires, path, domain, secure].join('')
        document.cookie = cookie;
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};

/**
 * 获取浏览器语言类型
 * @return {string} 浏览器国家语言
 */
var getNavLanguage = function () {
    if (navigator.appName == "Netscape") {
        var navLanguage = navigator.language;
        return navLanguage.substr(0,2);
    }
    return false;
}

/**
 * 设置语言类型： 默认为英文
 */
var i18nLanguage = "en";

/*
设置一下网站支持的语言种类
 */
var webLanguage = { 'en': 'English', 'zh': '中文' };

/**
 * 执行页面i18n方法
 * @return
 */
var execI18n = function () {
    /*
    获取一下资源文件名
     */

    /*
    首先获取用户浏览器设备之前选择过的语言类型
        */
    if (getCookie("userLanguage")) {
        i18nLanguage = getCookie("userLanguage");
    } else {
        // 获取浏览器语言
        // var navLanguage = getNavLanguage();
        // if (navLanguage) {
        //     i18nLanguage = navLanguage;
        //     // 存到缓存中
        //     getCookie("userLanguage", navLanguage);
        // } else {
        //     console.log("not navigator");
        //     return false;
        // }
    }
    /* 需要引入 i18n 文件*/
    if ($.i18n == undefined) {
        console.log("请引入i18n js 文件")
        return false;
    };

    /*
    这里需要进行i18n的翻译
        */
    jQuery.i18n.properties({
        name: 'language',
        path: '/i18n/', //资源文件路径
        mode: 'map', //用Map的方式使用资源文件中的值
        language: i18nLanguage,
        callback: function () {//加载成功后设置显示内容
            console.log("i18n赋值中...");
            try {
                //初始化页面元素
                $('[data-i18n-placeholder]').each(function () {
                    try{
                        $(this).attr('placeholder', $.i18n.prop($(this).data('i18n-placeholder')));
                    }catch(err){
                        console.log($(this).attr("data-i18n-placeholder"));
                        console.error(err);
                    }
                });
                $('[data-i18n-title]').each(function () {
                    try{
                        $(this).attr('title', $.i18n.prop($(this).data('i18n-title')));
                    }catch(err){
                        console.log($(this).attr("data-i18n-title"));
                        console.error(err);
                    }
                });
                $('[data-i18n-text]').each(function () {
                    //如果text里面还有html需要过滤掉
                    var html = $(this).html();
                    var reg = /<(.*)>/;
                    if (reg.test(html)) {
                        try{
                            var htmlValue = reg.exec(html)[0];
                            $(this).html(htmlValue + $.i18n.prop($(this).data('i18n-text')));
                        }catch(err){
                            console.log($(this).attr("data-i18n-text"));
                            console.error(err);
                        }
                    }
                    else {
                        try{
                            $(this).text($.i18n.prop($(this).data('i18n-text')));
                        }catch(err){
                            console.log($(this).attr("data-i18n-text"));
                            console.error(err);
                        }
                    }
                });
                $('[data-i18n-value]').each(function () {
                    try{
                        $(this).val($.i18n.prop($(this).data('i18n-value')));
                    }catch(err){
                        console.log($(this).attr("data-i18n-value"));
                        console.error(err);
                    }
                });
            }
            catch (ex) { }
            console.log("i18n写入完毕");
        }
    });
}

/*页面执行加载执行*/
$(function () {

    /*执行I18n翻译*/
    execI18n();

    /*将语言选择默认选中缓存中的值*/
    $("#i18n-selected").text(webLanguage[i18nLanguage]);

    /* 选择语言 */
    $("#i18n-en").click(function () {
        getCookie("userLanguage", "en", {
            expires: 30,
            path: '/'
        });

        location.reload();
    });
    /* 选择语言 */
    $("#i18n-zh").click(function () {
        getCookie("userLanguage", "zh", {
            expires: 30,
            path: '/'
        });
        location.reload();
    });
});