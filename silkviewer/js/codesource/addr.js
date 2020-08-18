$(function () {
    //==========本文件变量定义 开始
    //数据源，本地0 或 网络1
    // var datasource = 0;
    //从globalvar.js中获取
    var datasourcedetail, datasourcedetail3, datasourcedetail4;
    // var datasourcedetail5; //输入输出交易统计图
    // var datasourcedetail2;//金额分段统计图
    var datasourcedetail6;//按金额查询
    // var datasourcedetail7; //根据地址查交易列表
    var datasourcedetail8;//根据时间统计交易次数和余额

    //     /address/{address}
    // /address/addr.html?addr=SLUTqWQi77NEsVcGngYPb21nkqrW4g63dgcA

    // /block/{hash}
    // /block/blockhash.html?hash=


    // /contract/{contract_address}
    // /token/token.html?contract_address=ac3413c410ddcba2a56cc2610330cfcbdf0ce5c7

    // /transaction/{txid}
    // /transaction/txid.html?txid=8c4a633ab7ced71a1b475d0afbc2504b603ee89f4bcf534af5e0208a8213b628


    //从url参数中取得hash
    var addr = UrlParam.param("addr");
    //区块hash长度固定为：64位，如果无hash参数，或不是64位
    if (("undefined" == typeof addr) || (addr.length != 36)) {
        //判断兼容/address/{address}
        // console.log(checkAddress("/address/addr.html?addr=SLUTqWQi77NEsVcGngYPb21nkqrW4g63dgcA"));
        // console.log(checkAddress("/address/SLUTqWQi77NEsVcGngYPb21nkqrW4g63dgcA"));
        // console.log(GetUrlRelativePath());
        var relativeurl = GetUrlRelativePath();
        if (checkAddress(relativeurl)) {//符合兼容
            var addrtemp = relativeurl.split("/");
            addr = addrtemp[2];
        } else {
            //出错显示
            var message = $.i18n.prop('Addressinvalid'); //'Address invalid.';
            // console.log(encodeURIComponent(info));
            top.location.href = "/info.html?message=" + encodeURIComponent(message);
        }
    }

    if (datasource == 0) {
        datasourcedetail = {
            "url": "/jsondata/addr.json",
            "newblock":"/jsondata/indexnew.json"
        }
    } else {
        datasourcedetail = {
            "url": weburl + "/addr/" + addr + "?noTxList=1", //要带参数
            "newblock": weburl + "/silkchain/indexnew" //"/jsondata/indexnew.json" //
        }
    }


    // if (datasource == 0) {
    //     datasourcedetail2 = {
    //         "url": "/jsondata/addrVouttxs.json"
    //     }
    // } else {
    //     datasourcedetail2 = {
    //         "url": weburl + "/silkchain/addr/" + addr + "/vouttxs"
    //     }
    // }

    if (datasource == 0) {
        datasourcedetail3 = {
            "url": "/jsondata/addrtoken.json"
        }
    } else {
        datasourcedetail3 = {
            "url": weburl + "/src20/balances?balanceAddress=" + addr
        }
    }

    if (datasource == 0) {
        datasourcedetail4 = {
            "url": "/jsondata/addrtokenTxs.json"
        }
    } else {
        datasourcedetail4 = {
            "url": weburl + "/tokenTransfer?address=" + addr + "&limit=50"
        }
    }

    // if (datasource == 0) {
    //     datasourcedetail5 = {
    //         "url": "/jsondata/addrUtxostat.json"
    //     }
    // } else {
    //     datasourcedetail5 = {
    //         "url": weburl + "/silkchain/addr/" + addr + "/utxostat"
    //     }
    // }

    if (datasource == 0) {
        datasourcedetail6 = {
            "url": "/jsondata/addrVoutxrange.json"
        }
    } else {
        datasourcedetail6 = {
            "url": weburl + "/silkchain/addr/" + addr + "/voutxrange"
        }
    }

    // if (datasource == 0) { 
    //     datasourcedetail7 = {
    //         "url": "/jsondata/addrtxs.json"
    //     }
    // } else {
    //     datasourcedetail7 = {
    //         "url": weburl + "/addrs/" + addr + "/txs?from=0&to=50"
    //     }
    // }
    
    //取30天之前的时间戳
    var source_nowdate = new Date();//new Date("2019-06-12");////取当前时间
    var source_nowdate1 = source_nowdate.format("m/d/Y");//只要日期
    var source_nowdate2_temp=source_nowdate1 + " 00:00:01";//ie报错，只能用/，不能用-
    var source_nowdate2 = new Date(source_nowdate2_temp)//时间为0点
    var source_nowdate3_temp=source_nowdate1 + " 23:59:59";
    var source_nowdate3 = new Date(source_nowdate3_temp)//时间为24点
    var source_cxtime0 = source_nowdate2.getTime() /1000;//当天时间戳，秒，用于x坐标轴计算
    var source_cxtime03 = source_nowdate3.getTime() /1000;//当天时间戳，秒，用于list判断
    var source_cxtime30 = source_cxtime0 - 30 * 24 * 60 * 60;//30天之前的时间戳，秒
    var addr_balance=0;
    if (datasource == 0) {
        datasourcedetail8 = {
            "url": "/jsondata/addrtimesvalue2.json"
        }
    } else {//?from_date_time=1543910352&，默认取30天的数据
        datasourcedetail8 = { //不限定limit
            "url": weburl + "/silkchain/addr/" + addr + "/historynew?from_date_time=1560355199"
        }
        // /silubium-api/silkchain/addr/SLUSy37e1vpzSk3pzK1J8z3iMsdVbsTwUo7R/history
    }

    //构造测试数据，如果请求的参数值在数组中，即使用离线数据
    if (testArray.addr.indexOf(addr)>=0){
        datasourcedetail8.url="/jsontest/addr/history/"+addr+".json";
        datasourcedetail6.url="/jsontest/addr/voutxrange/"+addr+".json";
    }

    //确定整个画图区大小，宽与表格相同，高固定
    var svgw = $(".static_chart").width();// 根据浏览器窗口大小确定画布宽度
    var svgh = Math.max(0.3 * svgw, 150);//不能小于150px;
    // SVG画布边缘与图表内容的距离
    var padding = {
        top: 0.01 * svgw,
        right: 0.01 * svgw,
        bottom: 0.01 * svgw,
        left: 0.01 * svgw
    }
    var mainsvg = d3.select(".static_chart").append("svg")
        .attr("width", svgw).attr("height", 0.85 * svgh);
    var autofontsize = 0.01 * svgw;

    ajaxNewBlock(datasourcedetail.newblock);//显示最新区块高度、交易数和地址数
    ajaxAddressInfo(datasourcedetail.url);//请求数据
    //==========本文件变量定义 结束===============================

    //===============各种执行函数 开始
    function ajaxNewBlock(newblockurl) {
		$.ajax({
			type: "get",
			async: true, // 异步请求
			url: newblockurl,
			success: function (result) {
                $("#s_lastestheight").html(result.height); // 最新区块高度,论文需要
                $("#s_trans").html(result.transactions);// 交易总数
                $("#s_addrs").html(result.addresses);//地址总数	
                $("#block_trans").show();//默认是关闭的
			},
			error: function (err) {
				console.log(err.statusText);
			}
		});
    }
    
    function ajaxAddressInfo(url) {
        $("#detailTable").mask();
        $.ajax({
            type: "get",
            async: true, // 异步请求
            url: url,
            success: function (result) {
                //柱状图要用到余额，异步原因，必须放在这个success函数体内
                addr_balance=result.balance;
                $(".static_chart").mask();
                // $.ajax({
                //     type: "get",
                //     async: true, // 异步请求
                //     url: datasourcedetail8.url,
                //     success: function (result) {
                //         // console.log(result.items)
                //         //tjsvgrender0(result.items);//新图
                //         $(".static_chart").unmask();
                //     },
                //     error: function (err) {
                //         console.error(err);
                //     }
                // });

                addrrender(result);//交易详情
                $("#detailTable").unmask();
                
                //more
                $('.moreshow').addClass('tt'); //默认隐藏不显示
                var ojbk = true;
                $('#optionsRadios1').on('click', function () {
                    if (ojbk) {
                        $('.moreshow').removeClass('tt');
                        ojbk = false;
                    } else {
                        $('.moreshow').addClass('tt');
                        ojbk = true;
                    }
                });
            },
            error: function (err) {
                console.error(err);
            }
        });

        // $("#tokenlist").mask();
        // $.ajax({
        //     type: "get",
        //     async: true, // 异步请求
        //     url: datasourcedetail3.url,
        //     success: function (result) {
        //         // addrtokenlist(result);//根据地址找Tokens
        //         // $("#tokenlist").unmask();
        //     },
        //     error: function (err) {
        //         console.error(err);
        //     }
        // });

        // $("#addrtokentxslistTable").mask();
        // $.ajax({
        //     type: "get",
        //     async: true, // 异步请求
        //     url: datasourcedetail4.url,
        //     success: function (result) {
        //         // addrtokentxslist(result);//根据地址找Tokens交易
        //         // $("#addrtokentxslistTable").unmask();
        //     },
        //     error: function (err) {
        //         console.error(err);
        //     }
        // });

        $("#listTable").mask();
        $.ajax({
            type: "get",
            async: true, // 异步请求
            url: datasourcedetail6.url + "?limit=50&fromtime="+source_cxtime03,
            success: function (result) {
                // console.log(result);
                listTable(result);//交易详情
                $("#listTable").unmask();
            },
            error: function (err) {
                console.error(err);
            }
        });
    }

    //显示地址详情数据
    function addrrender(data) {
        $("#addrStr").text(data.addrStr);
        $("#balance").text(data.balance + " SLU");
        if (data.unconfirmedBalance > 0) {
            $("#unconfirmedBalance").text(data.unconfirmedBalance + " SLU");
        } else {
            $("#trunconfirmed").hide();
        }
        $("#totalReceived").text(data.totalReceived + " SLU");
        $("#totalSent").text(data.totalSent + " SLU");
        $("#txApperances").text(data.txApperances);
    }

    //地址的交易列表
    function listTable(data) {
        // console.log(data);
        $("#listTable").bootstrapTable('destroy');  //先初始化一次
        $('#listTable').bootstrapTable({
            data: data.items,
            pagination: true,  //默认显示10页
            columns: [{
                title: $.i18n.prop('bt-txid'),
                field: 'txid',
                align: 'center',
                formatter: function (value, row, index) {
                    var str = "<a href='/transaction/txid.html?txid=" + value + "'>" + value + "</a>";
                    return str;
                }
            }, {
                title: $.i18n.prop('bt-confirmations'),
                field: 'confirmations', //新接口将去掉，改为最新高度减去高度
                align: 'center',
                sortable: true,
                // ,formatter: function (value, row, index) {
                //     if 
                //     var str = "<a href='/transaction/txid.html?txid=" + value + "'>" + value + "</a>";
                //     return str;
                // }
            }, {
                title: $.i18n.prop('bt-vin_count'),
                field: 'vins',
                align: 'center',
                sortable: true,
            }, {
                title: $.i18n.prop('bt-vout_count'),
                field: 'vouts',
                align: 'center',
                sortable: true,
            }, {
                title: $.i18n.prop('bt-time'),
                field: 'time',
                align: 'center',
                sortable: true,
                formatter: function (value, row, index) {
                    return cnen_timeformater(value);
                    // var timestr = new Date(1000 * value);
                    // timestr = timestr + "";//转为字符
                    // return timestr.replace("(中国标准时间)", "");
                }
            }]

        });
    }

    // function addrtokenlist(data) {
    //     try {
    //         if (data.length > 0) {
    //             var html = "";
    //             for (let index = 0; index < data.length; index++) {
    //                 if (index > 0) {
    //                     html += "</br>";
    //                 }
    //                 //数量要除以token精度
    //                 var amount = data[index].amount / 10 ** data[index].contract.decimals;
    //                 html += amount + "&nbsp;<a href='/token/token.html?contract_address=" + data[index].contract.contract_address + "'>" + data[index].contract.symbol + "</a>";
    //             }
    //             $("#tokenlist").html(html);

    //         } else {
    //             $("#trtoken").hide();
    //         }
    //     } catch (err) {
    //         $("#trtoken").hide();
    //         console.log(err);
    //     }
    // }

    //addrtokentxslistTable
    // function addrtokentxslist(data) {
    //     if (data.items.length > 0) {
    //         $('#addrtokentxslistTable').bootstrapTable({
    //             data: data.items,
    //             pagination: true,
    //             columns: [{
    //                 title: 'Txid',
    //                 field: 'tx_hash',
    //                 align: 'center',
    //                 formatter: function (value, row, index) {
    //                     return "<a href='/transaction/txid.html?txid=" + value + "'>" + value.substr(0, 3) + "..." + value.substr(value.length - 3, value.length) + "</a>";
    //                 }
    //             }, {
    //                 title: 'From',
    //                 field: 'from',
    //                 align: 'center',
    //                 formatter: function (value, row, index) {
    //                     return "<a href='/address/addr.html?addr=" + value + "'>" + value + "</a>";
    //                 }
    //             }, {
    //                 title: 'To',
    //                 field: 'to',
    //                 align: 'center',
    //                 formatter: function (value, row, index) {
    //                     return "<a href='/address/addr.html?addr=" + value + "'>" + value + "</a>";
    //                 }
    //             }, {
    //                 title: 'Value',
    //                 field: 'value',
    //                 align: 'center',
    //                 formatter: function (value, row, index) {
    //                     var str = value;
    //                     try {
    //                         str = row.value / 10 ** row.decimals;
    //                         str += " " + row.symbol;
    //                     } catch (err) {
    //                         console.error(err);
    //                     }
    //                     return str;
    //                 }
    //             }, {
    //                 title: 'Time',
    //                 field: 'tx_time',
    //                 align: 'center',
    //                 formatter: function (value, row, index) {
    //                     return cnen_timeformater(value);
    //                     // var timestr = new Date(1000 * value);
    //                     // timestr = timestr + "";//转为字符
    //                     // return timestr.replace("(中国标准时间)", "");
    //                 }
    //             }]
    //         });
    //     } else {
    //         $("#addrtokentxslistTable").hide();
    //         $("#h4addrtokentxslistTable").hide();
    //     }
    // }
    var autofontsize = 0.0102 * svgw;
    //画新统计图，x轴，日期，y1轴，余额，折线，y2轴，交易次数，柱形
    function tjsvgrender0(result) {
        if (!result || result.length==0){//为空
            return;
        }
        var parseDateShow = d3.timeFormat("%b" + " " + "%d");//转化为jan 01，计算用时间戳，显示用字符
        var praseDateVal=d3.timeFormat("%m" + "/" + "%d" + "/" + "%Y");//月日年
        //倒序排列，原始数据是倒序排列，为保险起见，再排序一次
        result = result.sort(function (a, b) {
            return b.time0 - a.time0;
        });

        //用日期作为key，余额用最新，次数当天相加
        var datamap_balance = d3.map(),
            datamap_balance_temp = d3.map(),//中间值
            datamap_times = d3.map();
        
        //{"time0":1539475200, //当日
        // "balance":654028.15339719,//当日最新余额
        // "balance_diff":24.96052059,//与头日相比变化值
        // "trans":15 //交易次数}
        //近一个月每一天都显示,source_cxtime30为1个月前的时间戳，source_cxtime0为当天时间戳
        //for (i = source_cxtime30; i <= source_cxtime0; i=i+24*60*60) { //初始化，保证x轴连续
        var result_i=0;//result数组默认是倒序排列，定义标尺
        var result_length=result.length;
        var default_balance=addr_balance;
        for (i = source_cxtime0; i >= source_cxtime30; i=i-24*60*60) { //初始化，保证x轴连续
            var key0 = 1000 * i;
            var key = praseDateVal(key0);//parseDateShow
            if (result_length==0){//现有余额0，新地址，从未有过交易
                datamap_times.set(key, 0);
                datamap_balance.set(key,default_balance);//正常情况下default_balance的值应为0
            }else{
                var datakey0=1000 * result[result_i].time0;
                var datakey = praseDateVal(datakey0);
                if (key!=datakey){//键值不符，当天没有交易
                    datamap_times.set(key, 0);
                    datamap_balance.set(key,default_balance);//默认为现有余额
                }else{//当天相等，表示当天有数据
                    datamap_times.set(key, result[result_i].trans);//交易次数
                    datamap_balance.set(key,result[result_i].balance);//默认为现有余额
                    default_balance=result[result_i].balance-result[result_i].balance_diff;//上次交易余额=当前余额-当次变化
                    if (result_i < result_length-1){//数组
                        result_i=result_i+1;
                    }
                }
            }
        }

        // console.log(datamap_balance);
        //位置
        var tjbpos = {
            xw: 0.92 * svgw,  //图形宽度
            xx: 0.04 * svgw,  //x轴位置x
            xy: 0.75 * svgh,  //x轴位置y
            yh: 0.6 * svgh,  //y轴高度
            yy: 0.15 * svgh,  //y轴位置y
            y1x: 0.04 * svgw,  //y1轴位置x
            y2x: 0.96 * svgw  //y2轴位置x
        }
        // 显示图例
        var tjbsign = mainsvg.append("g");
        tjbsign.append("rect").attr("x", tjbpos.xx + 0.30 * svgw).attr("y", 0.045 * svgh)
            .attr("class", "line3-text").attr('width', 0.02 * svgw).attr('height', 0.001 * svgw);
        tjbsign.append("circle").attr("cx", tjbpos.xx + 0.31 * svgw).attr("cy", 0.045 * svgh + 0.0005 * svgw)
            .attr('r', 0.002 * svgw).attr("class", "line3-text");
        tjbsign.append("text").attr("x", tjbpos.xx + 0.33 * svgw).attr("y", 0.055 * svgh)
            .attr("class", "legend").text($.i18n.prop("ad-FinalBalance")).style("font-size", autofontsize + "px");

        tjbsign.append("text").attr("x", tjbpos.xx + 0.50 * svgw).attr("y", 0.055 * svgh)
            .attr("class", "bar1-rect").text("■").style("font-size", autofontsize + "px");// reward_sum
        tjbsign.append("text").attr("x", tjbpos.xx + 0.515 * svgw).attr("y", 0.055 * svgh)
            .attr("class", "legend").text($.i18n.prop("svgTrans"))
            .style("font-size", autofontsize + "px");

        //x轴的刻度值需要反转
        var keys_reverse=datamap_times.keys().reverse();
        var tjbx = d3.scaleBand()
            .domain(keys_reverse)
            .range([0, tjbpos.xw]);
        // console.log(datamap_times.keys(), tjbx("Dec'02"))
        // var tjbx=d3.scaleLinear()
        // .domain([,parseDateShow(1000*d3.max(result.time))])
        // .range([0, tjbpos.xw])

        var tjbbarwidth = tjbx.bandwidth() / 2; //x轴刻度宽一半，限定最大值
        tjbbarwidth = Math.min(10, tjbbarwidth);

        // var txtnums = 20; //显示多少个刻度的文字
        // var keyslen = datamap_times.keys().length;
        var tjbxAxis = d3.axisBottom(tjbx)       //新建一个默认的坐标轴
            .tickFormat(function (d, i) {    //自定义刻度文字格式
                var Axisx_temp=Date.parse(d);
                return parseDateShow(Axisx_temp);
            });
        mainsvg.append("g")
            .attr("class", "axis tjbx")
            .attr("transform", "translate(" + tjbpos.xx + "," + tjbpos.xy + ")")
            .call(tjbxAxis)
            .selectAll("text")
            .attr("transform", "rotate(-30)")
            .style("text-anchor", "end")
            .style("font-size", 0.7 * autofontsize + "px");

        var tjbchart = mainsvg.append("g").on("mousemove", mousemove)
            .on("mouseout", function () {
                d3.select(".tips").style("display", "none");
            });

        //y2轴，交易次数，柱形图先画
        var max_timesvalues=d3.max(datamap_times.values());
        if (max_timesvalues==0){
            max_timesvalues=1;
        }
        var tjby2 = d3.scaleLinear()
            .range([0, tjbpos.yh])
            .domain([max_timesvalues*1.2, 0]);
        var tjby2Axis = d3.axisRight(tjby2)       //新建一个默认的坐标轴
            .ticks(5)
            .tickFormat(function (d) {    //自定义刻度文字格式
                return toShowMK(d,4);//d.toFixed(1);
            });
        mainsvg.append("g")
            .attr("class", "axis tjby2")
            .attr("transform", "translate(" + tjbpos.y2x + "," + tjbpos.yy + ")")
            .call(tjby2Axis)
            .selectAll("text")
            .style("font-size", 0.7 * autofontsize + "px");
        mainsvg.append("text")
            .attr("transform", "translate(" + (tjbpos.y2x+0.02*svgw) + "," + (tjbpos.yy - 0.03 * svgh) + ")")
            .text($.i18n.prop("svgTrans"))
            .style("font-size", autofontsize + "px")
            .attr('text-anchor','end');
            
        function sortDownDate(a, b) {//顺序，从小到大
            var x1_temp=Date.parse(a.key);
            var x2_temp=Date.parse(b.key);
            return  x1_temp-x2_temp ;
        }
        //柱形图        
        var data_bar = datamap_times.entries(); //将map转为数组        
        var data_bar = data_bar.sort(sortDownDate);
        tjbchart.selectAll(".barRect").data(data_bar)    //绑定数据
            .enter().append("g")    //创建缺少的页面元素
            .attr('class', 'barRect').append("rect").attr('class', 'bar1-rect')
            .attr("width", tjbbarwidth)
            .attr("y", function (d) {
                return tjbpos.yy + tjby2(d.value);      //使用比例尺确定坐标Y值
            })
            .attr("x", function (d) {
                // console.log(d.key, tjbx(d.key))
                return tjbpos.xx + tjbx(d.key) + 0.5 * tjbx.bandwidth() - 0.5 * tjbbarwidth;   //使用比例尺确定坐标X值，让tick与柱对齐，偏移一定量
            })
            .attr("height", function (d) {   //条形的高度
                return tjbpos.yh - tjby2(d.value);
            });

        //y1轴，余额，折线
        //为了让y1轴更美观，最大和最小值分别扩展10%
        var balance_max_temp=d3.max(datamap_balance.values());
        var balance_min_temp=d3.min(datamap_balance.values());
        var y1min_temp=balance_min_temp-(balance_max_temp-balance_min_temp)*0.1;
        //向下取整
        // y1min_temp=Math.floor(y1min_temp);
        if (y1min_temp<0) {
            y1min_temp=0;
        }
        var y1max_temp=balance_max_temp+(balance_max_temp-balance_min_temp)*0.1;
        //向上取整
        // y1max_temp=Math.ceil(y1max_temp);
        var tjby1 = d3.scaleLinear()
            .range([0, tjbpos.yh])
            .domain([y1max_temp,y1min_temp]);
        
        var valtemp=[];
        valtemp.push(y1min_temp);
        var addtemp=(y1max_temp-y1min_temp)/5;
        valtemp.push(y1min_temp+addtemp);
        valtemp.push(y1min_temp+2*addtemp);
        valtemp.push(y1min_temp+3*addtemp);
        valtemp.push(y1min_temp+4*addtemp);
        valtemp.push(y1min_temp+5*addtemp);
        var tjby1Axis = d3.axisLeft(tjby1)       //新建一个默认的坐标轴
            .tickValues(valtemp)//返回一个数组[y1min_temp,..., y1max_temp]
        //因为起始坐标不显示，所有改为用  tickValues
        // .ticks(5)
            .tickFormat(function (d) {    //自定义刻度文字格式       
                return toShowMK(d,4);//d.toFixed(1);
            });
        mainsvg.append("g")
            .attr("class", "axis tjby1")
            .attr("transform", "translate(" + tjbpos.y1x + "," + tjbpos.yy + ")")
            .call(tjby1Axis)
            .selectAll("text")
            .style("font-size", 0.7 * autofontsize + "px");
        mainsvg.append("text")
            .attr("transform", "translate(" + (tjbpos.y1x - 0.035 * svgw) + "," + (tjbpos.yy - 0.03 * svgh) + ")")
            .text($.i18n.prop("ad-FinalBalance"))
            .style("font-size", autofontsize + "px")
            .attr('text-anchor','start');;

        //折线map.entries()　
        var line_balance = d3.line()
            .x(function (d) {
                return tjbpos.y1x + tjbx(d.key) + 0.5*tjbx.bandwidth();
            }).y(function (d) {
                return tjbpos.yy + tjby1(d.value);
            });
        // //添加折线
        var data_line = datamap_balance.entries(); //将map转为数组
        var data_line = data_line.sort(sortDownDate);
        // console.log(data_line);

        tjbchart.append("g").append("path").attr("d", line_balance(data_line))
            .attr("class", "line3-rect").style("stroke-width", 0.001 * svgw);

        tjbchart.selectAll("circle .tjby3-line").data(data_line).enter().append("circle")
            .attr("class", "tjby3-line")
            .attr("cx", function (d) {
                return tjbpos.y1x + tjbx(d.key) + 0.5 * tjbx.bandwidth();
            }).attr("cy", function (d) {
                return tjbpos.yy + tjby1(d.value);
            }).attr("r", function (d) {
                // console.log(d.key);
                // for (var i = 0; i < result.length; i++) {
                //     if (parseDateShow(result[i].time * 1000) == d.key) {
                //         return 0.002 * svgw;
                //     }
                // }
                return 0.002 * svgw;
            }).attr("class", "line3-text");

        //悬浮框
        //tips显示组合
        var tips = mainsvg.append('g').attr('class', 'tips').style("display", "none");
        tips.append('rect')
            .attr('class', 'tips-border')
            .attr('width', 0.22 * svgw)
            .attr('height', 0.14 * svgh)
            .attr('rx', 10)
            .attr('ry', 10);

        var tipswording0 = tips.append('text')//date
            .attr('class', 'tips-text blocktextblack')
            .attr('x', autofontsize)
            .attr('y', 0.04 * svgh)
            .text('')
            .style("font-size", autofontsize + "px");
        var tipswording1 = tips.append('text') //
            .attr('class', 'tips-text blocktextblack')
            .attr('x', autofontsize)
            .attr('y', 0.08 * svgh)
            .text('')
            .style("font-size", autofontsize + "px");
        var tipswording2 = tips.append('text') //
            .attr('class', 'tips-text blocktextblack')
            .attr('x', autofontsize)
            .attr('y', 0.12 * svgh)
            .text('')
            .style("font-size", autofontsize + "px");

        function mousemove() {
            //获取鼠标相对于图形区的坐标，左上角坐标为(0,0)
            var mouseX = d3.mouse(this)[0];
            var mouseY = d3.mouse(this)[1];

            //通过比例尺的反函数计算invert原数据中的值，但非连续定义域无法反查
            /**
             * 设计算法
             * 1. 总宽度tjbxpos.width，步长 tjbx.step()，居中偏移tjby1pos.x + 1 * tjbbarwidth
             * 2. 通过mouseX，判断在哪个step，再判断更接近第几个step，通过这个索引再查具体数据
             * 	var index=Math.round((mouseX-tjby1pos.x-tjbbarwidth)/step());
             */
            var index = Math.round((mouseX - tjbpos.xx - tjbbarwidth) / tjbx.step());
            //var index1=data_line.length - index-1;
            index = Math.max(0, index);
            index = Math.min(data_line.length - 1, index);

            var mouseDataline = data_line[index];//日期反转
            var mousedatabar = data_bar[index];

            var date_temp=Date.parse(mouseDataline.key);
            date_temp=date_temp/1000;//毫秒转为秒
            tipswording0.text($.i18n.prop("axis-date") + ": " + cnen_timeformaterShort(date_temp))
                .style("font-size", autofontsize + "px");
            tipswording1.text($.i18n.prop("ad-FinalBalance") + ": " + mouseDataline.value.toFixed(3) + " SLU")
                .style("font-size", autofontsize + "px");
            tipswording2.text($.i18n.prop("svgTrans") + ": " + mousedatabar.value)
                .style("font-size", autofontsize + "px");

            //显示框不要被遮住
            if (mouseX > 0.8 * svgw && mouseY > 0.6 * svgh) {
                d3.select(".tips")
                    .attr('transform', 'translate(' + (mouseX - 0.23 * svgw) + ',' + (mouseY - 0.2 * svgh) + ')')
                    .style('display', 'block');
            } else if (mouseX > 0.8 * svgw) {
                d3.select(".tips")
                    .attr('transform', 'translate(' + (mouseX - 0.23 * svgw) + ',' + mouseY + ')')
                    .style('display', 'block');
            } else if (mouseY > 0.6* svgh) {
                d3.select(".tips")
                    .attr('transform', 'translate(' + (mouseX + 0.01 * svgw) + ',' + (mouseY - 0.2 * svgh) + ')')
                    .style('display', 'block');
            } else {
                d3.select(".tips")
                    .attr('transform', 'translate(' + (mouseX + 0.01 * svgw) + ',' + (mouseY + 0.01 * svgh) + ')')
                    .style('display', 'block');
            }
        }
    }

    $("#showhideBtn").bind("click", function () {
        // console.log($("#showhideBtn").text());
        var titletext = $("#showhideBtn").text();
        if ("显示" == titletext || "Show" == titletext) {
            $("#showhideBtn").text($.i18n.prop('btn-hide'));
            $("#showhideDiv").show();
        } else {
            $("#showhideBtn").text($.i18n.prop('btn-show'));
            $("#showhideDiv").hide();
        }

    });

    //正则判断是否是兼容地址
    function checkAddress(s) {
        var re = new RegExp("^/address/(\\w{36})$");
        if (re.test(s)) {
            return true;
        } else {
            return false;
        }
    }
    
    //保留x位小数，不会补0
    function toDecimal2NoZero(v,x) {
        var t=Math.pow(10,x);//乘方
        var f = Math.round(v * t) / t;
        var s = f.toString();
        return s;
    }

    //坐标显示，如果大于1000 000，显示M，如果大于1000，显示K，保留小数位x
    function toShowMK(v,x){
        if (v >= 1000000) {
            return toDecimal2NoZero((v / 1000000),x) + "M";
        } else if (v >= 1000){
            return toDecimal2NoZero((v / 1000),x) + "K";
        } else {
            return toDecimal2NoZero(v,x);
        }
    }
    //===============各种执行函数 结束=====================
});