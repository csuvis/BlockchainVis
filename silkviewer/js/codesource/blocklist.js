$(function () {
    //==========本文件变量定义 开始
    //数据源，本地0 或 网络1
    //var datasource = 1;从globalvar.js中获取
    var datasourcedetail;

    //从url参数中取得blockDate，可以为空，但有值必须是yyyy-mm-dd
    var blockDate = UrlParam.param("blockDate");
    
    //区块列表以UTC0计算，默认显示当天的
    //当本地时间是utc+8时，0-8时不会显示当地时间当天的列表数据
    var t1=new Date().getTime();
    var t2=new Date().getTimezoneOffset(); //480，8小时
    var t=t1+(60000)*t2; //转化为60秒*1000豪秒
    // console.log(FormatDateTime(t));
    //取UTC0的年月日
    var blockToday=FormatDateTime(t);

    if (blockDate){//如果有，必须满足规则
        var reg = /^\d{4}-\d{2}-\d{2}$/;
        if (!reg.test(blockDate)) {
            //出错显示
            var message = 'BlockHash invalid.';
            // console.log(encodeURIComponent(info));
            top.location.href = "/info.html?message=" + encodeURIComponent(message);
        }
    }else{//如果无，取当日        
        blockDate=blockToday;
    }
    //blockDate="2019-06-11";//论文需要

    if (datasource == 0) {
        datasourcedetail = {
            "url": "/jsondata/blocklist.json",
            "newblock":"/jsondata/indexnew.json"
        }
    } else {
        datasourcedetail = {
            "url": weburl + "/blocks?blockDate=" + blockDate,
            "newblock": weburl + "/silkchain/indexnew"
        }
    }

    $('#datetimepicker').change(function(){
        console.log("change");
    });
    ajaxNewBlock(datasourcedetail.newblock);//显示最新区块高度、交易数和地址数
    ajaxBlocks(datasourcedetail.url,blockToday);//请求数据
    //==========本文件变量定义 结束===============================
    //===============各种执行函数 开始

    
    //===============各种执行函数 结束=====================
});

function ajaxNewBlock(newblockurl) {
    $.ajax({
        type: "get",
        async: true, // 异步请求
        url: newblockurl,
        success: function (result) {
            $("#s_lastestheight").html(result.height); // 最新区块高度
            $("#s_trans").html(result.transactions);// 交易总数
            $("#s_addrs").html(result.addresses);//地址总数	
            $("#block_trans").show();//默认是关闭的
        },
        error: function (err) {
            console.log(err.statusText);
        }
    });
}
//blocklist.html直接调用
// function datapickfunc(){
//     //console.log();
//     //时区，导致日期与本地不一致。解决后再放开
//     var url=weburl + "/blocks?blockDate=" + $('#datetimepicker').val();
// 	$("#blocklistTable").bootstrapTable('destroy');
//     ajaxBlocks(url);
// }

function ajaxBlocks(url,blockToday) {
    $.ajax({
        type: "get",
        async: true, // 异步请求
        url: url,
        success: function (result) {
            //交易数减去1，第1条为空值
            for (let index = 0; index < result.blocks.length; index++) {
                result.blocks[index].txlength=result.blocks[index].txlength-1;
            }

            blocksrender(result);//区块详情
            $("#hreftoday").attr("href","/block/blocklist.html?blockDate="+blockToday);
            $("#hrefleft").attr("href","/block/blocklist.html?blockDate="+result.pagination.prev);
            $("#hrefright").attr("href","/block/blocklist.html?blockDate="+result.pagination.next);
        },
        error: function (err) {
            console.error(err.statusText);
        }
    });
}


//处理数据的过程//渲染区块详情视图
function blocksrender(data) {
    $('#listTable').bootstrapTable({
        data: data.blocks,
        pagination: true,
        columns: [{
            field: 'height',
            title: $.i18n.prop('bi-Blockheight'),
            align: 'center'
        }, {
            field: 'hash',
            title: $.i18n.prop('bi-Blockhash'),
            align: 'center',
            formatter: function (value, row, index) {
                var str = value.substring(0, 5) + '...' + value.substring(59, 64);
                str = "<a href='/block/blockhash.html?hash=" + value + "'>" + str + "</a>";//转为字符
                return str;
            }
        }, {
            field: 'txlength',
            title: $.i18n.prop('bi-Transactions'),
            align: 'center'
        }, {
            field: 'size',
            title: $.i18n.prop('bi-Size'),
            align: 'center'
        }, {
            field: 'minedBy',
            title: $.i18n.prop('bi-minedby'),
            align: 'center'
        }, {
            field: 'time',
            title: $.i18n.prop('bi-Age'),
            align: 'center',
            formatter: function (value, row, index) {
                // var timestr = new Date(1000 * value);
                // timestr = timestr + "";//转为字符
                // return timestr.replace("(中国标准时间)", "");
                return cnen_timeformater(value);
            }
        }]
    });
}

function FormatDateTime(UnixTime) {
    //var a = UnixTime.replace("/Date(", "").replace(")/", "");
    var date = new Date(parseInt(UnixTime));
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    var d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    var h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    var minute = date.getMinutes();
    var second = date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute;
    second = second < 10 ? ('0' + second) : second;
    return y + '-' + m + '-' + d;// + ' ' + h + ':' + minute + ':' + second;
};