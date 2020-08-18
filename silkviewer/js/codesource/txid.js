$(function () {
    //==========本文件变量定义 开始
    //数据源，本地0 或 网络1
    // var datasource = 0;//从globalvar.js中获取
    var datasourcedetail, datasourcedetail1;

    //从url参数中取得hash
    var hash = UrlParam.param("txid");
    hash = hash.replace(/(^\s*)|(\s*$)/g, "");
    //区块hash长度固定为：64位，如果无hash参数，或不是64位
    // if (("undefined" == typeof hash) || (hash.length != 64)) {
    //     var relativeurl = GetUrlRelativePath();
    //     if (checkTxid(relativeurl)) {//符合兼容
    //         var temp = relativeurl.split("/");
    //         hash = temp[2];
    //     } else {
    //         //出错显示
    //         var message = $.i18n.prop('Txidinvalid');//'Txid invalid.';
    //         // console.log(encodeURIComponent(info));
    //         top.location.href = "/info.html?message=" + encodeURIComponent(message);
    //     }
    // }
    if (datasource == 0) {
        datasourcedetail = {
            "url": "/jsondata/txid.json",
            "newblock":"/jsondata/indexnew.json"
        }
    } else {
        datasourcedetail = {
            "url": weburl + "/tx/" + hash, //要带hash参数
            "newblock": weburl + "/silkchain/indexnew"  //"/jsondata/indexnew.json" //
        }
    }
    if (datasource == 0) {
        datasourcedetail1 = {
            "url": "/jsondata/tokentransfer.json"
        }
    } else {
        datasourcedetail1 = {
            "url": weburl + "/tokenTransfer?txHash=" + hash //要带hash参数
        }
    }

    var shownums_input = 7; //2019.5.26，指定显示的节点数，含虚拟组合结点，必须大于3
    var shownums_output = 7; 

    ajaxNewBlock(datasourcedetail.newblock);//显示最新区块高度、交易数和地址数
    ajaxTransaction(datasourcedetail.url);//请求数据
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

    function ajaxTransaction(url) {
        $("#detailTable").mask();
        $("#coin_glyph").mask();
        $("#vinslistTable").mask();
        $("#voutslistTable").mask();
        $.ajax({
            type: "get",
            async: true, // 异步请求
            url: url,
            success: function (result) {
                //vout的第一笔交易如果是空的话，即删除
                if (result && result.vout.length>0 && (result.vout[0].value+0)==0){
                    result.vout.shift();//删除第一条
                }

                txidrender(result);//交易详情
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

                vinrender(result);//输入
                $("#vinslistTable").unmask();

                voutrender(result);//输出
                $("#voutslistTable").unmask();

                //svgrender(result);//d3图形
                $("#coin_glyph").unmask();
            },
            error: function (err) {
                console.error(err);
            }
        });

        $("#tokentransferlistTable").mask();
        $.ajax({
            type: "get",
            async: true, // 异步请求
            url: datasourcedetail1.url,
            success: function (result) {
                tokentransferrender(result);//交易详情
                $("#tokentransferlistTable").unmask();
            },
            error: function (err) {
                console.error(err);
            }
        });
    }

    //显示交易详情数据
    function txidrender(data) {
        // console.log(data);
        $("#txid").text(data.txid);
        $("#blockhash").text(data.blockhash);
        $("#blockhash_href").attr("href", "/block/blockhash.html?hash=" + data.blockhash);
        $("#time").text(cnen_timeformater(data.time));
        $("#size").text(data.size+' Bytes');
        $("#confirmations").text(data.confirmations);//(211199-data.blockheight+1);//
        $("#vins").text(data.vin.length);
        $("#vouts").text(data.vout.length);
        $("#totalInput").text(data.valueIn + " SLU");
        $("#totalOutput").text(data.valueOut + " SLU");

        try {
            if (data.fees > 0) {
                $("#fees").text(data.fees + " SLU");
            } else {//无交易费隐藏
                $("#trfees").hide();
            }
        } catch (err) {
            console.error(err);
        }
    }

    //输入列表
    function vinrender(data) {
        $('#vinslistTable').bootstrapTable({
            data: data.vin,
            pagination: true,
            pageList: [5, 10, 25],
            pageSize: 10,
            columns: [{
                title: $.i18n.prop('bt-vins'),
                field: 'addr',
                align: 'left',
                formatter: function (value, row, index) {
                    var str = "Coinbase.";
                    if (!row.coinbase) {
                        str = "<a href='/address/addr.html?addr=" + row.addr + "'>" + row.addr + "</a>&nbsp;&nbsp;";
                        str = str + "<a href='/transaction/txid.html?txid=" + row.txid + "'>" + row.value + " SLU[" + row.vout + "]</a>";
                    }
                    return str;
                }
            }]
        });
        $('#vinslistTable').removeClass("table-bordered");//不要表格边框
    }

    //输出列表
    function voutrender(data) {
        $('#voutslistTable').bootstrapTable({
            data: data.vout,
            pagination: true,
            pageList: [5, 10, 25],
            num_edge_entries: 1,
            pageSize: 10,
            columns: [{
                title: $.i18n.prop('bt-vouts'),
                field: 'n',
                align: 'left',

                formatter: function (value, row, index) {
                    var str = "Empty output.";
                    try {
                        if (row.scriptPubKey.addresses) {
                            str = "<a href='/address/addr.html?addr=" + row.scriptPubKey.addresses[0] + "'>"
                                + row.scriptPubKey.addresses[0] + "</a>&nbsp;&nbsp;" + row.value;
                            if ("" != row.spentTxId && null != row.spentTxId) {//花了
                                str = str + "<a href='/transaction/txid.html?txid=" + row.spentTxId + "'>[S]</a>";
                            } else {//未花
                                str = str + "[U]";
                            }
                            //     str = str + "<span class='scriptdata wordwrap'></br>&nbsp;&nbsp;Asm: " + row.scriptPubKey.asm + "</span>";
                        }
                    } catch (err) {
                        console.error(err);
                    }
                    return str;
                }
            }]
        });
        $('#voutslistTable').removeClass("table-bordered");//不要表格边框
    }

    //tokentransferlistTable
    function tokentransferrender(data) {
        if (data.items.length > 0) {
            $('#tokentransferlistTable').bootstrapTable({
                data: data.items,
                pagination: true,
                columns: [{
                    title: $.i18n.prop('bt-from'),
                    field: 'from',
                    align: 'left',
                    formatter: function (value, row, index) {
                        return "<a href='/address/addr.html?addr=" + value + "'>" + value + "</a>";
                    }
                }, {
                    title: $.i18n.prop('bt-to'),
                    field: 'to',
                    align: 'left',
                    formatter: function (value, row, index) {
                        return "<a href='/address/addr.html?addr=" + value + "'>" + value + "</a>";
                    }
                }, {
                    title: $.i18n.prop('bt-value'),
                    field: 'value',
                    align: 'left',
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
                }]
            });
        } else {
            $("#tokentransferlistTable").hide();
            $("#h4tokentransferlistTable").hide();
        }

    }

    //渲染d3
    function svgrender(result) {
        //确定整个画图区大小，宽与表格相同，高固定
        var svgw = $("#coin_glyph").width();// 根据浏览器窗口大小确定画布宽度
        var svgh = Math.max(0.25 * svgw, 150);//不能小于150px;
        // SVG画布边缘与图表内容的距离
        var padding = {
            top: 0.01 * svgh,
            right: 0.01 * svgw,
            bottom: 0.1 * svgh,
            left: 0.01 * svgw,
            sankeyh:0.7 * svgh,//桑基图画图区高
            sankeyw:0.5 * svgw//桑基图画图区宽
        }

        var autofontsize = 0.014 * svgw;
        var mainsvgh=svgh;       
            
        var vinlength = result.vin.length; //保存到变量，重复到数组中取消耗性能
        var voutlength = result.vout.length;
         if((vinlength+voutlength)<=4){
            mainsvgh=0.7*svgh;
            padding.sankeyh=0.4*svgh;
        }
        if((vinlength+voutlength)<=2){
            mainsvgh=0.6*svgh;
            padding.sankeyh=0.2*svgh;
        }  
         var mainsvg = d3.select("#coin_glyph").append("svg")
            .attr("width", svgw).attr("height", mainsvgh+padding.bottom).attr('transform',
                "translate(" + padding.left + ',' + 0 + ')');
        var legend = mainsvg.append('g')
            .attr('transform', 'translate(' + (0) + ',' + '0)');
        //在main的基础上画桑基图
        var main = mainsvg.append('g').attr('class', 'mainClass').attr("id", "mainsvg")
            .attr('transform',
                "translate(" + 0.2 * svgw + ',' + padding.top * 22
                + ')');

        //根据输入输出地址的最大值，测算地址圆的直径和间距
        // var maxcount = Math.max(result.max_vin_count, result.max_vout_count);        
        //2019.5.26，不用全局最大，用当前交易的最大值
        var maxcount = Math.max(vinlength, voutlength); //决定中心圆弧的大小
        var maxcount1=Math.min(maxcount,Math.max(shownums_input,shownums_output));//比较规定的数量
        maxcount=6*maxcount1;//让最大的圆弧充满1/

        //圆之间的间距，maxcount1-1个空
        var nodespace=padding.sankeyh/(2*maxcount1-1);
        var sankey = d3.sankey()
            .nodeWidth(0.1)  //要用圆代替
            .nodePadding(nodespace)  //尽量大，用圆代替
            .size([padding.sankeyw, padding.sankeyh]);//注释要超出，减小宽度

        // var path = sankey.link();//改为输入和输出单独计算path
        var path_in = sankey.link_in();
        var path_in_line= sankey.link_in_line();//中间用直线
        var path_out = sankey.link_out();
        var path_out_line = sankey.link_out_line();//中间用直线

        //组装符合sankey要求的数据
        var coinnode = { name: result.txid, value: 0, tag: "coin", tag0: false };//中心节点
        var sankey_data = {
            nodes: [],
            links: []
        }
        
        //输入按金额大小排序
        result.vin.sort(function (a, b) {
            return (b.value - a.value);//从大到小
        });
        //输出按金额大小排序
        result.vout.sort(function (a, b) {
            return (b.value - a.value);//从大到小
        });

        //value相差太大，用线性比例尺规定范围
        //先求出vin和vout中最大的value和最小值
        var maxvalue_in=d3.max(result.vin,function(d){
            if (d.value != null && d.value) {
                return d.value;
            }else{
                return 0;
            }
        });
        var minvalue_in=d3.min(result.vin,function(d){
            if (d.value != null && d.value) {
                return d.value;
            }else{
                return 0;
            }
        });
        var maxvalue_out=d3.max(result.vout,function(d){
            if (d.value != null && d.value) {
                return d.value;
            }else{
                return 0;
            }
        });
        var minvalue_out=d3.min(result.vout,function(d){
            if (d.value != null && d.value) {
                return d.value;
            }else{
                return 0;
            }
        });
        var maxvalue=Math.max(maxvalue_in,maxvalue_out),
            minvalue=Math.min(minvalue_in,minvalue_out);
        if (maxvalue==0){
            return; //该交易是空值，不必画图
        }
        

        //输入重新布置节点2019.5.14
        var resultVinlength = vinlength;//中心节点所在位置，当有省略号时，默认值要变化
        // var vinNodecreate = true;//标记需要生成虚拟节点
        var vinnode3 = {}
        if (vinlength > shownums_input) {//2个以上才虚拟结点
            vinnode3["name"] = vinlength - shownums_input+1;
            // vinnode3["value"] = valueScale(result.vin[shownums_input-2].value - 0.00000001);//在shownums_input数据之后
            vinnode3["tag"] = "in";
            vinnode3["showdot"] = true;

            //将虚拟结点的实际值算出来
            vinnode3["actualvalue"] = 0;
            for (let vi =shownums_input-2; vi < vinlength; vi++) {
                if (result.vin[vi].value != null && result.vin[vi].value) {
                    vinnode3["actualvalue"]=vinnode3["actualvalue"]+1*result.vin[vi].value;
                }
            }

            maxvalue=Math.max(maxvalue,vinnode3["actualvalue"]);
        }else{
            shownums_input=vinlength;
        }
        //输出重新布置节点2019.5.14
        var resultVoutlength = voutlength;//当有省略号时，默认值要变化
        // var voutNodecreate = true;//标记需要生成虚拟节点
        var voutnode3 = {}
        if (voutlength > shownums_output) {//2个以上才虚拟结点
            voutnode3["name"] = voutlength - shownums_output+1;
            // voutnode3["value"] = valueScale((1 * result.vout[shownums_output-2].value) - 0.00000001);
            voutnode3["tag"] = "out";
            voutnode3["showdot"] = true;

            //将虚拟结点的实际值算出来
            voutnode3["actualvalue"] = 0;
            for (let vi =shownums_output-2; vi < voutlength; vi++) {
                if (result.vout[vi].value != null && result.vout[vi].value) {
                    voutnode3["actualvalue"]=voutnode3["actualvalue"]+1*result.vout[vi].value;//1* 变为数值
                }
            }

            maxvalue=Math.max(maxvalue,voutnode3["actualvalue"]);
        }else{
            shownums_output=voutlength;
        }

        //这个比例尺决定各地址圆的大小
        var valueScale = d3.scaleLinear()
            .domain([minvalue, maxvalue])
            .range([1, 3]);//最大圆和最小圆的直径比例
        if (vinnode3["name"] ){
            vinnode3["value"] = valueScale(result.vin[shownums_input-2].value - 0.00000001);
        }
        if (voutnode3["name"] ){
            voutnode3["value"] = valueScale((1 * result.vout[shownums_output-2].value) - 0.00000001);
        }

        for (let index = 0; index < vinlength; index++) {//输入
            if (vinlength > shownums_input) {//最后用3个虚拟节点表示
                resultVinlength = shownums_input;
                var vinnode = {}  //输入节点
                if (index < shownums_input-1) {
                    if (result.vin[index].addr) {
                        vinnode["name"] = result.vin[index].addr;
                        vinnode["value"] = valueScale(result.vin[index].value);
                        vinnode["actualvalue"] = result.vin[index].value;
                        vinnode["tag"] = "in";
                        vinnode["tag0"] = false;
                    } else if (result.vin[index].coinbase) {//挖矿
                        vinnode["name"] = "Coinbase";
                        vinnode["value"] = valueScale(0);//不能为0，否则计算出来无位置
                        vinnode["actualvalue"] = 0;
                        vinnode["tag"] = "in";
                        vinnode["tag0"] = true;
                    } else {//空节点
                        vinnode["name"] = "Empty";
                        vinnode["value"] = valueScale(0);
                        vinnode["actualvalue"] = 0;
                        vinnode["tag"] = "in";
                        vinnode["tag0"] = true;
                    }
                    sankey_data.nodes.push(vinnode);
                    sankey_data.links.push({ source: index, target: resultVinlength, value: vinnode.value });
                } else {//最后一个虚拟，只需要执行一次
                    // if (vinNodecreate) {
                    //     vinNodecreate = false;
                    //     vinnode3["actualvalue"] = result.vin[index].value;
                    // } else {
                    //     vinnode3["actualvalue"] = vinnode3["actualvalue"] + result.vin[index].value;
                    // }
                }
            } else {
                var vinnode = {}  //输入节点
                if (result.vin[index].addr) {
                    vinnode["name"] = result.vin[index].addr;
                    vinnode["value"] = valueScale(result.vin[index].value);
                    vinnode["actualvalue"] = result.vin[index].value;
                    vinnode["tag"] = "in";
                    vinnode["tag0"] = false;
                } else if (result.vin[index].coinbase) {//挖矿
                    vinnode["name"] = "Coinbase";
                    vinnode["value"] = valueScale(0);//不能为0，否则计算出来无位置
                    vinnode["actualvalue"] = 0;
                    vinnode["tag"] = "in";
                    vinnode["tag0"] = true;
                } else {//空节点
                    vinnode["name"] = "Empty";
                    vinnode["value"] = valueScale(0);
                    vinnode["actualvalue"] = 0;
                    vinnode["tag"] = "in";
                    vinnode["tag0"] = true;
                }
                sankey_data.nodes.push(vinnode);
                sankey_data.links.push({ source: index, target: vinlength, value: vinnode.value });
            }
        }

        if (vinlength > shownums_input) {
            sankey_data.nodes.push(vinnode3);
            sankey_data.links.push({ source: shownums_input-1, target: resultVinlength, value: vinnode3.value });
        }

        sankey_data.nodes.push(coinnode);//放入中心节点

        
        for (let index = 0; index < voutlength; index++) {//输出
            if (voutlength > shownums_output) {//中间节点用省略号，用3个虚拟节点表示
                resultVoutlength = shownums_output;
                var voutnode = {}  //输出节点
                if (index < shownums_output-1) {
                    if (result.vout[index].scriptPubKey.addresses) {
                        voutnode["name"] = result.vout[index].scriptPubKey.addresses[0];
                        voutnode["value"] = valueScale(1 * result.vout[index].value);//字符转数值
                        voutnode["actualvalue"] = 1 * result.vout[index].value;
                        voutnode["tag"] = "out";
                        voutnode["tag0"] = false;
                        if ("" != result.vout[index].spentTxId && null != result.vout[index].spentTxId) {//花费了
                            voutnode["spended"] = true;
                        }
                    } else {//空节点
                        voutnode["name"] = "Empty";
                        voutnode["value"] = valueScale(0);
                        voutnode["actualvalue"] = 0;
                        voutnode["tag"] = "out";
                        voutnode["tag0"] = true;
                    }
                    sankey_data.nodes.push(voutnode);
                    sankey_data.links.push({ source: resultVinlength, target: resultVinlength + index + 1, value: voutnode.value });
                } else {//只需要执行一次
                    // if (voutNodecreate) {
                    //     voutNodecreate = false;
                    //     voutnode3["actualvalue"] = 1 * result.vout[index].value;
                    // } else {
                    //     voutnode3["actualvalue"] = voutnode3["actualvalue"] + 1 * result.vout[index].value;
                    // }
                }
            } else {
                var voutnode = {}  //输出节点
                if (result.vout[index].scriptPubKey.addresses) {
                    voutnode["name"] = result.vout[index].scriptPubKey.addresses[0];
                    voutnode["value"] = valueScale(1 * result.vout[index].value);//字符转数值
                    voutnode["actualvalue"] = 1 * result.vout[index].value;
                    voutnode["tag"] = "out";
                    voutnode["tag0"] = false;
                    if ("" != result.vout[index].spentTxId && null != result.vout[index].spentTxId) {//花费了
                        voutnode["spended"] = true;
                    }
                } else {//空节点
                    voutnode["name"] = "Empty";
                    voutnode["value"] = valueScale(0);
                    voutnode["actualvalue"] = 0;
                    voutnode["tag"] = "out";
                    voutnode["tag0"] = true;
                }
                sankey_data.nodes.push(voutnode);
                sankey_data.links.push({ source: resultVinlength, target: resultVinlength + index + 1, value: voutnode.value });
            }
        }

        if (voutlength > shownums_output) {
            sankey_data.nodes.push(voutnode3);
            sankey_data.links.push({
                source: resultVinlength, target: resultVinlength + shownums_output,
                value: voutnode3.value
            });
        }

        sankey.nodes(sankey_data.nodes)
            .links(sankey_data.links)
            .layout(32);

        //最后一个圆，要根据汇总的金额大小，确定圆的大小
        //现在d.dy是根据d.value生成的，用valueScale(d.actualvalue)反算实际d.dy
        //这样处理的目的是，保证inputs,outputs在最后一个，避免被重新排序
        //inputs所在位置：shownums_input-1，outputs所在位置：shownums_input+shownums_output
        //输入节点存在汇取情况才处理
        //TODO:
        if (vinlength>shownums_input){
            var tempinputnode=sankey_data.nodes[shownums_input-1];
            var tempinput_dy=tempinputnode.dy * valueScale(tempinputnode.actualvalue)/tempinputnode.value;
            sankey_data.nodes[shownums_input-1].dy=tempinput_dy;
        }
        if (voutlength>shownums_output){
            var tempoutnode=sankey_data.nodes[shownums_input+shownums_output];
            var tempoutnode_dy=tempoutnode.dy*valueScale(tempoutnode.actualvalue)/tempoutnode.value;
            sankey_data.nodes[shownums_input+shownums_output].dy=tempoutnode_dy;
        }

        // //legend画图例
        legend.append('circle')
            .attr('cx', svgw * 0.3)
            .attr('cy', padding.top * 6)
            .attr('r', 0.006 * svgw)
            .attr('fill', '#e1b681');
        legend.append('text')
            .attr("x", padding.left + svgw * 0.3).attr("y", padding.top * 7)
            .text($.i18n.prop("tx_legend1"))
            .style("font-size", autofontsize + "px");
        //
        // if (vinlength>shownums_input){
            legend.append('circle')
                .attr('cx', svgw * 0.4)
                .attr('cy', padding.top * 6)
                .attr('r', 0.006 * svgw - 1)
                .attr('fill', 'none').attr('stroke', '#e1b681').attr("stroke-width", 1);
            legend.append('circle')
                .attr('cx', svgw * 0.4 - 3)
                .attr('cy', padding.top * 6)
                .attr('r', 0.8)
                .attr('fill', '#e1b681');
            legend.append('circle')
                .attr('cx', svgw * 0.4)
                .attr('cy', padding.top * 6)
                .attr('r', 0.8)
                .attr('fill', '#e1b681');
            legend.append('circle')
                .attr('cx', svgw * 0.4 + 3)
                .attr('cy', padding.top * 6)
                .attr('r', 0.8)
                .attr('fill', '#e1b681');
            legend.append('text')
                .attr("x", padding.left + svgw * 0.4).attr("y", padding.top * 7)
                .text($.i18n.prop("tx_legend2"))
                .style("font-size", autofontsize + "px");
        // }
        //
        legend.append('circle')
            .attr('cx', svgw * 0.5)
            .attr('cy', padding.top * 6)
            .attr('r', 0.006 * svgw)
            .attr('fill', '#fd6f58');
        legend.append('text')
            .attr("x", padding.left + svgw * 0.5).attr("y", padding.top * 7)
            .text($.i18n.prop("tx_legend3"))
            .style("font-size", autofontsize + "px");

        //
        // if (voutlength>shownums_output){
            legend.append('circle')
                .attr('cx', svgw * 0.6)
                .attr('cy', padding.top * 6)
                .attr('r', 0.006 * svgw - 1)
                .attr('fill', 'none').attr('stroke', '#fd6f58').attr("stroke-width", 1);
            legend.append('circle')
                .attr('cx', svgw * 0.6 - 3)
                .attr('cy', padding.top * 6)
                .attr('r', 0.8)
                .attr('fill', '#fd6f58');
            legend.append('circle')
                .attr('cx', svgw * 0.6)
                .attr('cy', padding.top * 6)
                .attr('r', 0.8)
                .attr('fill', '#fd6f58');
            legend.append('circle')
                .attr('cx', svgw * 0.6 + 3)
                .attr('cy', padding.top * 6)
                .attr('r', 0.8)
                .attr('fill', '#fd6f58');
            legend.append('text')
                .attr("x", padding.left + svgw * 0.6).attr("y", padding.top * 7)
                .text($.i18n.prop("tx_legend4"))
                .style("font-size", autofontsize + "px");
        // }

        //20190403设计算法：根据中心圆输入和输出地址数显示圆弧大小，link自动匹配，vin的link.target调整,vout的link.source调整
        //通过圆弧算出坐标，按地址数求角度，再用正弦余弦函数求每个link的位置。
        //20190526，中心圆，输入和输出圆弧应一样大
        //中心圆节点
        var centerCoinNode = sankey_data.nodes[resultVinlength];//第 输入地址数 个
        //记录中心圆的核心参数
        var coinCicle = {
            id: "node" + resultVinlength,  //中心圆id
            x: centerCoinNode.x,//圆中心x
            y: centerCoinNode.y + centerCoinNode.dy / 2 + 18,//圆中心x
            outerRadius: 0.4 * centerCoinNode.dy, //最外圈，半径
            innerRadius: 0.32 * centerCoinNode.dy,  //外到内次圈
        }
        var addrsLinear = d3.scaleLinear()
            .domain([0, maxcount]) //取输入输出地址数量的最大值
            .range([0, Math.PI]);
        var arc_in = d3.arc()  //后面画弧用
            .startAngle(-0.5 * Math.PI + addrsLinear(maxcount1 / 2.0))
            .endAngle(function () {
                return -addrsLinear(maxcount1 / 2.0) - 0.5 * Math.PI;
            })
            .innerRadius(coinCicle.innerRadius + 0.6)
            .outerRadius(coinCicle.outerRadius - 0.3);
        var arc_out = d3.arc()  //后面画弧用
            .startAngle(0.5 * Math.PI - addrsLinear(maxcount1 / 2.0))
            .endAngle(function () {
                return addrsLinear(maxcount1 / 2.0) + 0.5 * Math.PI;
            })
            .innerRadius(coinCicle.innerRadius + 0.6)
            .outerRadius(coinCicle.outerRadius - 0.3);
        //弧坐标
        var arcpos = {
            in_x: coinCicle.x - Math.cos(addrsLinear(maxcount1 / 2.0)) * coinCicle.outerRadius,
            in_up_y: coinCicle.y - Math.sin(addrsLinear(maxcount1 / 2.0)) * coinCicle.outerRadius,
            in_down_y: coinCicle.y + Math.sin(addrsLinear(maxcount1 / 2.0)) * coinCicle.outerRadius,
            out_x: coinCicle.x + Math.cos(addrsLinear(maxcount1 / 2.0)) * coinCicle.outerRadius,
            out_up_y: coinCicle.y - Math.sin(addrsLinear(maxcount1 / 2.0)) * coinCicle.outerRadius,
            out_down_y: coinCicle.y + Math.sin(addrsLinear(maxcount1 / 2.0)) * coinCicle.outerRadius
        }
        //把sankey_data.links分成2部分:
        //links_in2coin,按dy排序，根据角度偏移生成ty2和dy2
        //links_coin2out,按dy排序，根据角度偏移生成sy2和dy2
        var links_in2coin = [];
        var links_coin2out = [];

        //每根link偏移的值
        var linkdy = {
            in_dy: (arcpos.in_down_y - arcpos.in_up_y) / resultVinlength,
            out_dy: (arcpos.out_down_y - arcpos.out_up_y) / resultVoutlength
        }

        //圆心左右二边，金额总和小的，会从上到下排列，不美观，移至中间。20190324增加
        //算法：1.先求出vin和vout更小值，如果vin小，调整target的y值，如果vout小，调整source的y值
        //2. 求出最大的dy 减去 小边的dy相加，得出值的一半作为y的偏移值
        //3. 用偏移值调整link的值
        var vin_dy_sum = 0, vout_dy_sum = 0, dy_offset = 0;
         sankey_data.links.forEach(function (link, index) {
            if ("in" == link.source.tag) {
                vin_dy_sum = vin_dy_sum + link.dy;
                links_in2coin.push(link);
            } else {
                vout_dy_sum = vout_dy_sum + link.dy;
                links_coin2out.push(link);
            }
        });
        dy_offset = Math.max(vin_dy_sum, vout_dy_sum) - Math.min(vin_dy_sum, vout_dy_sum);

        //重新排序便于计算新位置
        links_in2coin.sort(function (a, b) {
            return (a.ty - b.ty);//端点从小到大
        });
        links_coin2out.sort(function (a, b) {
            return (a.sy - b.sy);//起点从小到大排列
        });

        //计算具体的新位置
        links_in2coin.forEach(function (link, index) {
            link["tx2"] = arcpos.in_x;
            link["dy2"] = linkdy.in_dy;
            link["ty2"] = arcpos.in_up_y + index * (linkdy.in_dy);
            if (links_in2coin.length==1){//与中心节点持平
                link.source.y=link.ty2+0.5*link.dy2-0.5*link.dy;
            }
        });
        //计算具体的新位置
        links_coin2out.forEach(function (link, index) {
            link["sx2"] = arcpos.out_x;
            link["dy2"] = linkdy.out_dy;
            link["sy2"] = arcpos.out_up_y + index * (linkdy.out_dy);
            if (links_coin2out.length==1){//与中心节点持平
                link.target.y=link.sy2+0.5*link.dy2-0.5*link.target.dy;
            }
        });

        sankey_data.nodes.forEach(node => {
            if (vin_dy_sum < vout_dy_sum) {//输入小，每个ty偏移                
                if ("in" == node.tag) {
                    node.sourceLinks[0].sy = node.sourceLinks[0].sy - 2 * dy_offset;
                    node.sourceLinks[0].ty = node.sourceLinks[0].ty;
                }
            } else {//输出小，每个sy偏移
                if ("out" == node.tag) {
                    // node.sy=node.sy+0.5*dy_offset;
                    node.targetLinks[0].sy = node.targetLinks[0].sy + 0.8 * dy_offset;
                    node.targetLinks[0].ty = node.targetLinks[0].ty - 0.8 * dy_offset;
                }
            }
        });
        // console.log(sankey_data.links);


        // 设置 link
        // 求最大的dy，用于圆的偏移
        var max_link_dy_offset = 0;
        var max_linkin_dymax=0;

        var link_in = main.append("g").selectAll(".link_in")
            .data(links_in2coin)
            .enter().append("path")
            .attr("class", "link_in")
            .attr("d", function(d){
                max_linkin_dymax=Math.max(max_linkin_dymax,d.dy);
                //如果输入只有一个，不要弧线，直接直线连接
                if (links_in2coin.length==1){
                    return path_in_line(d);
                }else{
                    return path_in(d);
                }
            })
            .attr("fill", '#b2d9ed');
        if (vinlength>shownums_input){
            //单独连接到中心圆的弧线
            var temp_inputCircle_data = [];
            var path_in_last = sankey.link_in_last();
            temp_inputCircle_data.push(links_in2coin[links_in2coin.length - 1]);
            main.append("g").selectAll('.pathinputdot').data(temp_inputCircle_data)
                .enter().append("path").attr("class", "pathinputdot")
                .attr("d", path_in_last)
                .attr("fill", '#b2d9ed');
        }

        var link_out = main.append("g").selectAll(".link_out")
            .data(links_coin2out)
            .enter().append("path")
            .attr("class", "link_out")
            .attr("d", function (d) {
                max_link_dy_offset = Math.max(max_link_dy_offset, d.dy);
                if (links_coin2out.length==1){
                    return path_out_line(d);
                }else{
                    return path_out(d);
                }
            }).attr("fill", '#b2d9ed');

        var link_marker = main.append("g").selectAll(".link_marker")
            .data(links_coin2out)
            .enter().append("path")
            .attr("class", "link_marker")
            .attr("d", function (d) {
                //return markerRightAlign(d);//以箭头最右边顶点对齐
                return markerLeftAlign(d);//以箭头最左边对齐
            }).attr("fill", '#b2d9ed')
            .attr("stroke", '#b2d9ed');

        var maxoffset = Math.sin(Math.PI / 3) * max_link_dy_offset;//等边三角形中分线长度

        //以箭头最左边对齐
        function markerLeftAlign(d) {
            var edge = 1 * d.target.dy;//设定箭头为等边三角形，边长为1.2*d.dy

            //因为link宽度不一样，不延长尾巴
            var x1 = d.target.x, //从link终端的上边开始
                y1 = d.target.y,
                // x2 = x1 + (maxoffset-edge*Math.sin(Math.PI/3)),//延长的距离
                // y2 = y1,
                x3 = x1,//箭头最上面顶点
                y3 = y1 - 0.04 * d.target.dy,
                x4 = x1 + edge * Math.sin(Math.PI / 3),//箭头最右面顶点
                y4 = y1 + d.target.dy / 2,
                x5 = x3,////箭头最下面顶点
                y5 = y1 + 1.04 * d.target.dy,
                // x6 = x5,//从link终端的下边结束
                // y6 = y2 + d.target.dy,
                x7 = x1,
                y7 = y1 + d.target.dy;

            return "M" + x1 + "," + y1
                // + "L" + x2 + "," + y2
                + "L" + x3 + "," + y3
                + "L" + x4 + "," + y4
                + "L" + x5 + "," + y5
                // + "L" + x6 + "," + y6
                + "L" + x7 + "," + y7
                + "L" + x1 + "," + y1;
        }

        

        in_max_dy = 0, out_max_dy = 0;
        for (var i = 0; i < sankey_data.nodes.length; i++) {
            if ('in' == sankey_data.nodes[i].tag) {
                if (sankey_data.nodes[i].dy > in_max_dy) {
                    in_max_dy = sankey_data.nodes[i].dy
                }
            } else {
                if (sankey_data.nodes[i].dy > out_max_dy) {
                    out_max_dy = sankey_data.nodes[i].dy
                }
            }
        }


        if (vinlength>shownums_input){
            //3个小圆聚合，sankey_data.nodes
            var inputCircle_data = sankey_data.nodes[shownums_input-1];
            //var inputCircle1 = 
            main.append("g").append("circle")
                .attr("transform", function () {
                    return "translate(" + inputCircle_data.x + "," + (inputCircle_data.y) + ")";
                })
                .attr("r", inputCircle_data.dy / 2)
                .attr("cx", inputCircle_data.dx / 2)
                .attr("cy", inputCircle_data.dy / 2)
                .attr("stroke", '#e1b681')
                .attr("stroke-width", Math.min(inputCircle_data.dy / 15, 1.5))
                .attr("fill", 'none');
            max_linkin_dymax=Math.max(max_linkin_dymax,inputCircle_data.dy);//更新偏移值
            //三个小圆点
            main.append("g").append("circle")
                .attr("transform", function () {
                    return "translate(" + (inputCircle_data.x) + "," + (inputCircle_data.y) + ")";
                })
                .attr("r", Math.min(inputCircle_data.dy / 15, 1.5))
                .attr("cx", inputCircle_data.dx / 2)
                .attr("cy", inputCircle_data.dy / 2)
                .style("fill", '#e1b681');
    
            main.append("g").append("circle")
                .attr("transform", function () {
                    return "translate(" + (inputCircle_data.x - inputCircle_data.dy / 4) + "," + (inputCircle_data.y) + ")";
                })
                .attr("r", Math.min(inputCircle_data.dy / 15, 1.5))
                .attr("cx", inputCircle_data.dx / 2)
                .attr("cy", inputCircle_data.dy / 2)
                .style("fill", '#e1b681');
    
            main.append("g").append("circle")
                .attr("transform", function () {
                    return "translate(" + (inputCircle_data.x + inputCircle_data.dy / 4) + "," + (inputCircle_data.y) + ")";
                })
                .attr("r", Math.min(inputCircle_data.dy / 15, 1.5))
                .attr("cx", inputCircle_data.dx / 2)
                .attr("cy", inputCircle_data.dy / 2)
                .style("fill", '#e1b681');
        }

        if (voutlength>shownums_output){
            var outputCircle_data = sankey_data.nodes[shownums_input+shownums_output];
            maxoffset = Math.max(maxoffset, outputCircle_data.dy);
            //var outputCircle1 = 
            main.append("g").append("circle")
                .attr("transform", function () {
                    if (vin_dy_sum < vout_dy_sum) {
                        return "translate(" + (outputCircle_data.x +maxoffset) + "," + outputCircle_data.y + ")";
                    } else {
                        return "translate(" + (outputCircle_data.x +maxoffset) + "," + (outputCircle_data.y) + ")";
                    }
                }).attr("r", outputCircle_data.dy / 2)
                .attr("cx", (outputCircle_data.dx / 2)+ maxoffset)
                .attr("cy", outputCircle_data.dy / 2)
                .attr("stroke", '#fd6f58')
                .attr("stroke-width", Math.min(outputCircle_data.dy / 15, 1.5))
                .attr("fill", 'none');            
            //三个小圆点
            main.append("g").append("circle")
                .attr("transform", function () {
                    if (vin_dy_sum < vout_dy_sum) {
                        return "translate(" + ((outputCircle_data.x +maxoffset) - outputCircle_data.dy / 4) + "," + (outputCircle_data.y) + ")";
                    } else {
                        return "translate(" + ((outputCircle_data.x +maxoffset) - outputCircle_data.dy / 4) + "," + (outputCircle_data.y) + ")";
                    }
                }).attr("r", Math.min(outputCircle_data.dy / 15, 1.5))
                .attr("cx", (outputCircle_data.dx / 2) + maxoffset)
                .attr("cy", outputCircle_data.dy / 2)
                .style("fill", '#fd6f58');
            main.append("g").append("circle")
                .attr("transform", function () {
                    if (vin_dy_sum < vout_dy_sum) {
                        return "translate(" + ((outputCircle_data.x +maxoffset) + outputCircle_data.dy / 4) + "," + (outputCircle_data.y) + ")";
                    } else {
                        return "translate(" + ((outputCircle_data.x +maxoffset) + outputCircle_data.dy / 4) + "," + (outputCircle_data.y) + ")";
                    }
                }).attr("r", Math.min(outputCircle_data.dy / 15, 1.5))
                .attr("cx", (outputCircle_data.dx / 2) + maxoffset)
                .attr("cy", outputCircle_data.dy / 2)
                .style("fill", '#fd6f58');
            main.append("g").append("circle")
                .attr("transform", function () {
                    if (vin_dy_sum < vout_dy_sum) {
                        return "translate(" + (outputCircle_data.x +maxoffset) + "," + (outputCircle_data.y) + ")";
                    } else {
                        return "translate(" + (outputCircle_data.x +maxoffset) + "," + (outputCircle_data.y) + ")";
                    }
                }).attr("r", Math.min(outputCircle_data.dy / 15, 1.5))
                .attr("cx", (outputCircle_data.dx / 2) + maxoffset)
                .attr("cy", outputCircle_data.dy / 2)
                .style("fill", '#fd6f58');
        }

        // 设置node
        var node = main.append("g").selectAll(".node")
            .data(sankey_data.nodes)
            .enter().append("g")
            .attr("id", function (d, i) {
                return "node" + i;
            }).attr("class", "node")
            .attr("transform", function (d) {
                if (vin_dy_sum < vout_dy_sum) {
                    if ('in' == d.tag) {
                        return "translate(" + d.x + "," + (d.y) + ")";
                    } else {
                        return "translate(" + (d.x+maxoffset) + "," + d.y + ")";
                    }
                } else {
                    if ('out' == d.tag) {
                        return "translate(" + (d.x+maxoffset) + "," + (d.y) + ")";
                    } else {
                        return "translate(" + d.x + "," + d.y + ")";
                    }
                    //return "translate(" + (d.x + 5) + "," + (d.y-tt) + ")";
                }
            });

        var circle = node.append("g").on("mousedown", function (d) {
            //console.log("circle click");TODO: 奇怪，为何click不起作用？？？
            if ("coin" != d.tag && !d.tag0) {
                top.location.href = "/address/addr.html?" + $.param({ addr: d.name });
            }
        }).append("circle")
            // .attr("transform", function (d) {
            //     return "translate(" + d.x + "," + d.y + ")";
            // })
            .attr("r", function (d) {
                // if ("coin" == d.tag) {//中间节点
                //     coinCicle.outerRadius = 0.5 * d.dy;
                //     coinCicle.innerRadius = 0.4 * d.dy;
                //     coinCicle.x = d.x;
                //     coinCicle.y = d.y + d.dy / 2;
                // }
                if (d.showdot) {//省略号
                    //return d.dy / 4;
                } else {
                    return d.dy / 2;
                }
            }).attr("cx", function (d) {
                if ("out" == d.tag) {
                    return (d.dx / 2) + maxoffset;
                } else {
                    return (d.dx / 2);
                }
            }).attr("cy", function (d) { 
                return d.dy / 2; 
            }).style("fill", function (d, i) {                
                if ("in" == d.tag) {
                    return '#e1b681';
                } else {//支出
                    return '#fd6f58';
                }
            }).style('opacity', function(d){
                if (d.tag0 && !d.showdot) {
                    // tag0是表示空节点或者不正常的节点
                    return 0.5;
                } else {
                    return 1;
                }
            });

        circle.append("title")
            .text(function (d) {
                if (d.tag0) {
                    return $.i18n.prop('title-emptynode');
                }
                if ("coin" == d.tag) {
                    return $.i18n.prop('bt-txid') + ": " + d.name;
                } else if ("in" == d.tag) {
                    return $.i18n.prop('title-addr') + ": " + d.name + "\n" + $.i18n.prop('title-value') + ": " + d.actualvalue + " SLU";
                } else {//out
                    var tempstr = $.i18n.prop('title-addr') + ": " + d.name + "\n" + $.i18n.prop('title-value') + ": " + d.actualvalue + " SLU";
                    if (d.spended) {
                        return tempstr + "\n" + $.i18n.prop('title-spented');
                    } else {
                        return tempstr + "\n" + $.i18n.prop('title-unspent');
                    }
                }
            });


        node.append("g").append('text').text(function (d) {
            if (d.showdot && d.tag == 'in') {
                return d.name + ' ' + 'inputs' + ', ' + d.actualvalue.toFixed(4) + ' SLU';
            } else if (d.showdot && d.tag == 'out') {
                return d.actualvalue.toFixed(4) + ' SLU' + ', '+ d.name + ' ' + 'outputs';
            } else {
                return d.actualvalue + ' SLU';
            }
        }).attr('x', function (d) {
            if ("out" == d.tag) {
                return d.dx + maxoffset+ 1.2*max_link_dy_offset;
            } else if ("in" == d.tag) {
                return d.dx-0.6*max_linkin_dymax;
            }
        }).attr('y', function (d) {
            return 0.175 * autofontsize + d.dy/2;//文字有高度，下移高度的四分之一
        }).attr('text-anchor',function(d){
            if ("in" == d.tag) {
                return 'end';
            } else if ("out" == d.tag) {
                return 'start';
            }
        }).style('font-size', 0.7 * autofontsize);
        
        //生成中心圆
        $("#" + coinCicle.id).hide();
        //交易费圆心大小算法
        // 1. 最大交易费的中心圆，占铜钱最外圆大小的1/4，最小的占1/8，用线性比例尺计算
        // 2. 有些交易费为0，则计为0，有交易费最小为0.0001

        var feecirleLinear = d3.scaleLinear()
            .domain([0, result.max_txfee])
            .range([0.5, 1]);


        //交易尺寸占比算法
        //1. 外环分为10段，每段 0.2*Math.PI
        var sizerectLinear = d3.scaleLinear()
            .range([0.2 * coinCicle.innerRadius, 0.8 * coinCicle.innerRadius])
            .domain([0, result.max_txsize]);

        coin_glyph(main, coinCicle, result, 0, feecirleLinear, addrsLinear, sizerectLinear);

        /*//绘制铜钱glyph的函数
        一笔交易表示一枚铜钱
        __svgmain:画图区
        _coinsize:铜钱大小，宽和高一样
        _maxtxsize:所有交易中，尺寸最大值
        _tx:交易详情
                {
                    "txid": "19721c0f647610148768d44445aa5c73b170ef48e0b1e3dd709643ec2651c0cf",
                    "vin_count": 1,
                    "vout_count": 2,
                    "txfee": 0,
                    "size": 148
                }
        num: 交易在区块中的序号
        _feecirleLinear:交易费圆大小比例尺
        _addrsLinear：地址数圆弧大小比例尺
        _sizerectLinear：交易大小分段比例尺
        
        */
        function coin_glyph(_svgmain, _coinsize, _tx, num, _feecirleLinear, _addrsLinear, _sizerectLinear) {
            var coinsvg = _svgmain.append("g").attr('class', 'ring');
            coinsvg.attr('id', 'coin' + num)
                .attr('transform', "translate(" + _coinsize.x + "," + _coinsize.y + ")").on("mouseover", mouseover)
                .on("mouseout", function () {
                    d3.select("#tipsbox").style("display", "none");
                });//监听用;

            //设置弧度生成器，最外圆r1，次圆r2，半径固定
            var arc = d3.arc()
                .startAngle(0)  //d3.v5 不指定会出错
                .endAngle(2 * Math.PI)  //d3.v5 不指定会出错
                .innerRadius(_coinsize.innerRadius)
                .outerRadius(_coinsize.outerRadius);

            coinsvg.append("path")
                .attr("d", arc)
                .style("fill", "white")
                .style('stroke', '#ae7c4b')
                .attr('stroke-width', '1');

            var ring_2 = coinsvg.append('g')
                .attr('class', 'ring_2');

            //中间大圆
            ring_2.append('circle')
                .attr('r', _coinsize.innerRadius - 0.5)
                .style('fill', '#e9c598')
                .attr('opacity', function (d, i) {
                    // console.log(_feemiddlecircle(_tx.txfee));
                    return _feecirleLinear(_tx.txfee);
                });
            // .style('stroke', '#ae7c4b')
            // .style('stroke-width', '0.8');

            //合并成一段，方便算高度
            coinsvg.append("path")
                .attr("d", arc_out)
                .style("fill", "#b2d9ed");


            //合并成一段
            coinsvg.append("path")
                .attr("d", arc_in)
                .style("fill", "#b2d9ed");

            //中间竖线
            ring_2.append('rect')
                .attr('x', -0.5)  //线宽一半
                .attr('y', -_coinsize.innerRadius)
                .attr('height', 2 * _coinsize.innerRadius)
                .attr('width', 1)
                .style('fill', '#ae7c4b').style('opacity', '0.3');

            var middlerect = ring_2.append('g').attr('class', 'rect');
            middlerect.append('rect')
                .attr("x", function (d, i) {
                    return -0.5 * _sizerectLinear(_tx.size);
                })
                .attr("y", function (d, i) {
                    return -0.5 * _sizerectLinear(_tx.size);
                })
                .attr("width", function (d, i) {
                    return _sizerectLinear(_tx.size);
                })
                .attr("height", function (d, i) {
                    return _sizerectLinear(_tx.size);
                })
                .attr("fill", "white")
                .style('stroke', '#ae7c4b')
                .style('stroke-width', 0.8);

            //tips显示组合
            var tips = _svgmain.append('g').attr("class", "tips").attr('id', 'tipsbox').style("display", "none");
            tips.append('rect')
                .attr('class', 'tips-border')
                .attr('width', 0.18* svgw)
                .attr('height', 0.255*svgh)
                .attr('rx', 10)
                .attr('ry', 10);


                console.log('fjdhfkjs');


            tips.append('text').attr("id", "tipstext1")
                .attr('class', 'tips-text blocktextblack')
                .attr('x', 0.5*autofontsize)
                .attr('y', 0.05*svgh)
                .text('txid:').style('font-size',0.8*autofontsize);
                
            tips.append('text').attr("id", "tipstext2")
                .attr('class', 'tips-text blocktextblack')
                .attr('x', 0.5*autofontsize)
                .attr('y', 0.09*svgh)
                .text('vin_count:').style('font-size',0.8*autofontsize);
            tips.append('text').attr("id", "tipstext3")
                .attr('class', 'tips-text blocktextblack')
                .attr('x', 0.5*autofontsize)
                .attr('y', 0.14*svgh)
                .text('vout_count:').style('font-size',0.8*autofontsize);
            tips.append('text').attr("id", "tipstext4")
                .attr('class', 'tips-text blocktextblack')
                .attr('x', 0.5*autofontsize)
                .attr('y', 0.19*svgh)
                .text('txfee:').style('font-size',0.8*autofontsize);
            tips.append('text').attr("id", "tipstext5")
                .attr('class', 'tips-text blocktextblack')
                .attr('x', 0.5*autofontsize)
                .attr('y', 0.23*svgh)
                .text('size:').style('font-size',0.8*autofontsize);

        }

        //鼠标移入，移动，移出 监听，出现虚线、提示框
        /* 当鼠标在图形内滑动时调用 */
        function mouseover() {
            //指向对象的实际位置
            // var mousePointObj=this.getBoundingClientRect();

            //获取鼠标相对于图形区的坐标，左上角坐标为(0,0) d3.mouse(this)[0]; d3.mouse(this)[1];
            // var mouseX = mousePointObj.x-padding.svgleft-padding.left;
            // var mouseY = mousePointObj.y-padding.svgtop-padding.top;

            try {
                //通过this取出对象坐标
                var _tx = result;
                d3.select("#tipstext1")
                    .text($.i18n.prop('bt-txid') + ': ' + _tx.txid.substring(0, 5) + '...' + _tx.txid.substring(59, 64));
                d3.select("#tipstext2")
                    .text($.i18n.prop('bt-vin_count') + ': ' + _tx.vin.length);
                d3.select("#tipstext3")
                    .text($.i18n.prop('bt-vout_count') + ': ' + _tx.vout.length);
                d3.select("#tipstext4")
                    .text(function () {
                        var tempfee = _tx.fees;
                        if (tempfee < 0 || !tempfee) {
                            tempfee = 0;
                        }
                        return $.i18n.prop('bt-txfee') + ': ' + tempfee + ' SLU';
                    });
                d3.select("#tipstext5")
                    .text($.i18n.prop('bt-size') + ': ' + _tx.size + ' bytes');

                var mouseX = coinCicle.x + padding.left;
                var mouseY = coinCicle.y + padding.top;

                d3.select("#tipsbox").attr("transform", "translate(" + mouseX + "," + mouseY + ")").style("display", "block");
            } catch (e) {
                console.log(e);
            }
        }
    }

    $("#showhideBtn").bind("click", function () {
        //console.log($("#showhideBtn").text());
        var titletext = $("#showhideBtn").text();
        if ("显示" == titletext || "Show" == titletext) {
            $("#showhideBtn").text($.i18n.prop('btn-hide'));
            $("#showhideDiv").show();
        } else {
            $("#showhideBtn").text($.i18n.prop('btn-show'));
            $("#showhideDiv").hide();
        }
    });
    //===============各种执行函数 结束=====================
});