$(function () {
    //==========本文件变量定义 开始
    //数据源，本地0 或 网络1
    //var datasource = 1;从globalvar.js中获取
    var datasourcedetail,datasourcedetail2,datasourcedetail3;

    //从url参数中取得hash
    var addr = UrlParam.param("contract_address");
    //合约地址为40位
    if (("undefined" == typeof addr) || (addr.length != 40)) {
        var relativeurl=GetUrlRelativePath();
        if (checkContract(relativeurl)){//符合兼容
            var temp=relativeurl.split("/");
            hash=temp[2];
        }else{
            //出错显示
            var message = $.i18n.prop('Tokeninvalid');
            // console.log(encodeURIComponent(info));
            top.location.href = "/info.html?message=" + encodeURIComponent(message);
        }
    }

    if (datasource == 0) {
        datasourcedetail = {
            "url": "/jsondata/token.json"
        }
    } else {
        datasourcedetail = {
            "url": weburl + "/src20/" + addr
        }
    }

    if (datasource == 0) {
        datasourcedetail2 = {
            "url": "/jsondata/tokentransfers.json"
        }
    } else {
        datasourcedetail2 = {
            "url": weburl + "/src20/" + addr +"/transfers?limit=50"
        }
    }

    if (datasource == 0) {
        datasourcedetail3 = {
            "url": "/jsondata/tokenbalances.json"
        }
    } else {
        datasourcedetail3 = {
            "url": weburl + "/src20/" + addr +"/balances?limit=50"
        }
    }
    ajaxTokenInfo(datasourcedetail.url);//请求数据
    //==========本文件变量定义 结束===============================
    //===============各种执行函数 开始

    function ajaxTokenInfo(url) {        
        $("#addrdetailTable").mask();
        $.ajax({
            type: "get",
            async: true, // 异步请求
            url: url,
            success: function (result) {
                tokenrender(result);//交易详情
                $("#addrdetailTable").unmask();
                
                $("#tokenHolderlistTable").mask();
                $.ajax({
                    type: "get",
                    async: true, // 异步请求
                    url: datasourcedetail3.url,
                    success: function (result2) {
                        tokenHolderlist(result2,result);
                        $("#tokenHolderlistTable").unmask();
                    },
                    error: function (err) {
                        console.error(err);
                    }
                });
            },
            error: function (err) {
                console.error(err);
            }
        });

        $("#addrtokentxslistTable").mask();
        $.ajax({
            type: "get",
            async: true, // 异步请求
            url: datasourcedetail2.url,
            success: function (result) {
                addrtokentxslist(result);
                $("#addrtokentxslistTable").unmask();
            },
            error: function (err) {
                console.error(err);
            }
        });

    }

    
    //显示地址详情数据
    function tokenrender(data) {
        $("#contract_address").text(data.contract_address);
        $("#tx_hash").html("<a href='/transaction/txid.html?txid="+data.tx_hash+"'>"+data.tx_hash+"</a>");
        $("#block_height").text(data.block_height);

        // var timestr = new Date(1000 * data.tx_time);
        // timestr = timestr + "";//转为字符
        // $("#tx_time").text(timestr.replace("(中国标准时间)", ""));
        $("#tx_time").text(cnen_timeformater(data.tx_time));

        $("#name").text(data.name);

        var supply=data.total_supply / 10**data.decimals;
        $("#total_supply").text(supply+" "+data.symbol);

        $("#holders_count").text(data.holders_count);
        $("#transfers_count").text(data.transfers_count);
    }

    //正则判断是否是兼容交易编号
    function checkContract(s) {
        var re = new RegExp("^/contract/(\\w{40})$");
        if (re.test(s)) {
            return true;
        } else {
            return false;
        }
    }
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
    function addrtokentxslist(data) {
        if (data.items.length > 0) {
            $('#addrtokentxslistTable').bootstrapTable({
                data: data.items,
                pagination: true,
                columns: [{
                    title: $.i18n.prop('token-txhash'),
                    field: 'tx_hash',
                    align: 'center',
                    formatter: function (value, row, index) {
                        return "<a href='/transaction/txid.html?txid=" + value + "'>" + value.substr(0, 3) + "..." + value.substr(value.length - 3, value.length) + "</a>";
                    }
                }, {
                    title: $.i18n.prop('token-from'),
                    field: 'from',
                    align: 'center',
                    formatter: function (value, row, index) {
                        return "<a href='/address/addr.html?addr=" + value + "'>" + value + "</a>";
                    }
                }, {
                    title: $.i18n.prop('token-to'),
                    field: 'to',
                    align: 'center',
                    formatter: function (value, row, index) {
                        return "<a href='/address/addr.html?addr=" + value + "'>" + value + "</a>";
                    }
                }, {
                    title: $.i18n.prop('token-values'),
                    field: 'value',
                    align: 'center',
                    formatter: function (value, row, index) {
                        var str = value;
                        try {
                            str = row.value / 10 ** row.decimals;
                            str += " " + row.symbol;
                        } catch (err) {
                            console.error(err);
                        }
                        return str;
                    }
                }, {
                    title: $.i18n.prop('token-time'),
                    field: 'tx_time',
                    align: 'center',
                    formatter: function (value, row, index) {
                        return cnen_timeformater(value);
                        // var timestr = new Date(1000 * value);
                        // timestr = timestr + "";//转为字符
                        // return timestr.replace("(中国标准时间)", "");
                    }
                }]
            });
        } else {
            $("#addrtokentxslistTable").hide();
            $("#h4addrtokentxslistTable").hide();
        }
    }

    function tokenHolderlist(data,contract) {
        if (data.items.length > 0) {
            $('#tokenHolderlistTable').bootstrapTable({
                data: data.items,
                pagination: true,
                columns: [{
                    title: $.i18n.prop('token-holder-Address'),
                    field: 'address',
                    align: 'center',
                    formatter: function (value, row, index) {
                        return "<a href='/address/addr.html?addr=" + value + "'>" + value + "</a>";
                    }
                }, {
                    title: $.i18n.prop('token-holder-Quantity'),
                    field: 'amount',
                    align: 'center',
                    formatter: function (value, row, index) {
                        var amt=value/ 10**contract.decimals;
                        return thousandBitSeparator(amt)+"&nbsp;"+contract.symbol;
                    }
                },{
                    title: $.i18n.prop('token-holder-Percentage'),
                    field: 'amount',
                    align: 'center',
                    formatter: function (value, row, index) {
                        var per=100*value/contract.total_supply;
                        return per.toFixed(2)+"%";
                    }
                }]
            });
        }
    }
    //===============各种执行函数 结束=====================
});