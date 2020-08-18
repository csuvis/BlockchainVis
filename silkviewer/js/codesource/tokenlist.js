$(function () {
    //==========本文件变量定义 开始
    //数据源，本地0 或 网络1
    //var datasource = 1;从globalvar.js中获取
    var datasourcedetail;

    if (datasource == 0) {
        datasourcedetail = {
            "url": "/jsondata/tokenlist.json",
            "newblock":"/jsondata/indexnew.json"
        }
    } else {
        datasourcedetail = {
            "url": weburl + "/tokens",
            "newblock": weburl + "/silkchain/indexnew"
        }
    }
    ajaxNewBlock(datasourcedetail.newblock);//显示最新区块高度、交易数和地址数
    ajaxTokens(datasourcedetail.url);//请求数据
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
function ajaxTokens(url) {
    $("#tokenlistTable").mask();
    $.ajax({
        type: "get",
        async: true, // 异步请求
        url: url,
        success: function (result) {
            tokensrender(result);//通证详情
            $("#tokenlistTable").unmask();
        },
        error: function (err) {
            console.error(err.statusText);
        }
    });
}


//处理数据的过程//渲染区块详情视图
function tokensrender(data) {
    $('#tokenlistTable').bootstrapTable({
        data: data.items,
        pagination: true,
        columns: [{
            field: 'name',
            title: $.i18n.prop('token-name'),
            align: 'center',
            formatter: function (value, row, index) {
                var str = row.contract_address;
                str = "<a href='/token/token.html?contract_address=" + str + "'>" + value + "</a>";//转为字符
                return str;
            }
        }, {
            field: 'total_supply',
            title: $.i18n.prop('token-supply'),
            align: 'center',
            formatter: function (value, row, index) {
                var str = value / 10 ** row.decimals;
                return thousandBitSeparator(str) + "&nbsp;" + row.symbol;
            }
        }, {
            field: 'count_holders',
            title: $.i18n.prop('token-holders'),
            align: 'center'
        }, {
            field: 'tx_time',
            title: $.i18n.prop("token-created_time"),
            align: 'center',
            formatter: function (value, row, index) {
                return cnen_timeformater(value);
            }
        }]
    });

    function thousandBitSeparator(num) {
        num=num.toString().split(".");  // 分隔小数点
        var arr=num[0].split("").reverse();  // 转换成字符数组并且倒序排列
        var res=[];
        for(var i=0,len=arr.length;i<len;i++){
          if(i%3===0&&i!==0){
             res.push(",");   // 添加分隔符
          }
          res.push(arr[i]);
        }
        res.reverse(); // 再次倒序成为正确的顺序
        if(num[1]){  // 如果有小数的话添加小数部分
          res=res.join("").concat("."+num[1]);
        }else{
          res=res.join("");
        }
        return res;
    }
};