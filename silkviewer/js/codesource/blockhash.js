$(function () {
    //==========本文件变量定义 开始
    //数据源，本地0 或 网络1
    // var datasource = 1;//从globalvar.js中获取
    var datasourcedetail;

    //从url参数中取得hash
    var hash = UrlParam.param("hash");
    //区块hash长度固定为：64位，如果无hash参数，或不是64位
    if (("undefined" == typeof hash) || (hash.length != 64)) {
        var relativeurl = GetUrlRelativePath();
        if (checkHash(relativeurl)) { //符合兼容
            var temp = relativeurl.split("/");
            hash = temp[2];
        } else {
            //出错显示
            var message = $.i18n.prop('BlockHashinvalid');
            // console.log(encodeURIComponent(info));
            top.location.href = "/info.html?message=" + encodeURIComponent(message);
        }
    }
    if (datasource == 0) {
        datasourcedetail = {
            "url": "/jsondata/blockhash.json",
            "newblock": "/jsondata/indexnew.json"
        }
    } else {
        datasourcedetail = {
            "url": weburl + "/silkchain/block/" + hash, //要带hash参数
            "newblock": weburl + "/silkchain/indexnew"  //"/jsondata/indexnew.json"//
        }
    }
    //构造测试数据，如果请求的参数值在数组中，即使用离线数据
    if (testArray.blockhash.indexOf(hash)>=0){
        datasourcedetail.url="/jsontest/blockhash/"+hash+".json";
    }

    //确定整个画图区大小，宽与表格相同，高固定
    // svg大小
    centw = window.innerWidth;
    var padding = {
        top: 0.01 * centw,
        right: 0.01 * centw,
        bottom: 0.01 * centw,
        left: 0.01 * centw
    }
    var svgw = $("#coin_glyph").width(); // 根据浏览器窗口大小确定画布宽度
    var svgh = 0.2 * svgw < 100 ? 100 : 0.2 * svgw; //不能小于50px;
    // SVG画布边缘与图表内容的距离

    var blockw = (svgw - padding.left - padding.right) / 7.5;
    var blockh = blockw * 1.2974;// 根据宽度确定块高度（背景图的宽高比例）
    left_svg_w = 0.38 * blockw * 2;
    left_svg_h = 0.24 * blockh * 0.88 * 2

    var autofontsize = 0.01 * svgw;
    var radio_height = $('#coin_radio').height(); //radio的高度，方面下面控制上间距
    //铜钱画图区
    var mainsvg_height = left_svg_h;
    //coin画图区宽度
    var coin_svgw = svgw - left_svg_w-padding.left*0.6;
    var blocksvg = d3.select("#coin_glyph").append("svg")
        .attr("width", left_svg_w * 0.8).attr("height", left_svg_h).attr('transform',
            "translate(" + padding.left * 0.6 + ',' + 10 + ')').attr('class', 'mainsvg_block');

    var mainsvg = d3.select("#coin_glyph").append("svg")
        .attr("width", coin_svgw).attr("height", left_svg_h)
        .attr('transform', "translate(" + 10 + ',' + 10 + ')');

    var filtersvg = d3.select("#coin_filter").append("svg")
        .attr("width", svgw * 0.32).attr("height", svgh * 0.5).attr('transform',
            "translate(" + 0 + ',' + padding.left + ')');
    var filtersvg2 = d3.select("#coin_filter").append("svg")
        .attr("width", svgw * 0.32).attr("height", svgh * 0.5).attr('transform',
            "translate(" + svgw * 0.37 + ',' + padding.left + ')');
    var filtersvg3 = d3.select("#coin_filter").append("svg")
        .attr("width", svgw * 0.32).attr("height", svgh * 0.5).attr('transform',
            "translate(" + (-svgw * 0.296) + ',' + padding.left + ')');

    //所有的bar宽度用一样的
    var barwidth;

    ajaxNewBlock(datasourcedetail.newblock);//显示最新区块高度、交易数和地址数
    ajaxBlockhash(datasourcedetail.url); //请求数据
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

    var xsize = {}, //x轴位置
        ysize = {}, //位置
        resultdata, //原始请求结果，用于后面恢复所有数据
        databins = [], databins2 = [], databins3 = [],
        filterx, filterx2, filterx3, filtery, filtery2, filtery3, //比例尺
        xdatamax, xdatamax2, xdatamax3,
        ydatamax, ydatamax2, ydatamax3, //x，y轴最大值
        histogram, histogram2, histogram3,//直方图数据
        filterSeleTxs = [], filterSeleTxs2 = [], filterSeleTxs3 = [], addrsScale_max, addrsScale_min,
        blocktext2;//暂存三个刷选的数据

    var result_max_txfee, result_max_txsize, result_max_vin_count, result_max_vout_count;//结果中的最大值
    var addrsLinear, feecolor;//地址最大数量、费用比例尺

    function ajaxBlockhash(url) {
        $("#detailTable").mask();
        $("#coin_glyph").mask();
        $("#coin_filter").mask();
        $("#listTable").mask();
        $.ajax({
            type: "get",
            //dataType:"text",//firefox不正常，会自动转换为object
            async: true, // 异步请求
            url: url,
            success: function (result) {
                //每个区块第1笔交易都是coinbase，前1万个块要显示
                if (result.height>10000){
                    result.txs.shift();// 将区块中包括的第一笔交易去掉
                }

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

                // result_max_txfee = result.max_txfee;
                result_max_txsize = result.max_txsize;
                result_max_vin_count = result.max_vin_count;
                result_max_vout_count = result.max_vout_count;

                var max1 = Math.max.apply(Math, result.txs.map(function (item) { return item.vin_count }));
                var min1 = Math.min.apply(Math, result.txs.map(function (item) { return item.vin_count }));
                var max2 = Math.max.apply(Math, result.txs.map(function (item) { return item.vout_count }));
                var min2 = Math.min.apply(Math, result.txs.map(function (item) { return item.vout_count }));

                result_max_txfee = Math.max.apply(Math, result.txs.map(function (item) { return item.txfee }));


                addrsScale_max = Math.max(max1, max2);
                addrsScale_min = Math.min(min1, min2);


                var maxaddrcount = Math.max(result_max_vin_count, result_max_vout_count);
                addrsLinear = d3.scaleLinear()
                    .domain([0, 1.5 * addrsScale_max]) //取输入输出地址数量的最大值
                    .range([0.02*Math.PI, Math.PI]);
                feecolor = d3.scaleLinear()
                    .domain([0, result_max_txfee])
                    .range([0.5, 1]);

                blockrender(result); //区块详情
                //blockcoin(result);
                $("#detailTable").unmask();

                //coinfilterrender(result); //铜钱下方选择区 生成databins
                //$("#coin_filter").unmask();
                //initcoinrender(result.txs); //初始铜钱分布 必须在选择区后面
                //$("#coin_glyph").unmask();

                txsrender(result.txs); //交易列表
                $("#listTable").unmask();

                resultdata = result;//原始全部数据
            },
            error: function (err) {
                console.error(err.statusText);
            }
        });
    }

    //显示区块详情数据
    function blockrender(data) {
        // console.log(data);
        $("#block").text(data.height);
        $("#blockheight").text(data.height);
        $("#previousblockhash").attr("href", "/block/blockhash.html?hash=" + data.previousblockhash);
        $("#nextblockhash").attr("href", "/block/blockhash.html?hash=" + data.nextblockhash);
        $("#blockhash").text(data.hash);
        $("#blocktime").text(cnen_timeformater(data.time));
        // $("#blocktransactions").text(data.txs.length);
        $("#blockminedby").text(data.miner);
        $("#blockreward").text(data.reward + " SLU");
        $("#blocktxsfee").text(data.txfee_sum + " SLU");
        $("#blocksize").text(data.size + " bytes");
        $("#blockversion").text(parseInt(data.version).toString(16)); //转十六进制
        $("#blockconfirmations").text(data.confirmations);//(211199-data.height+1);////
    }

    function blockcoin(data) {
        // console.log(data);
        // var blockw=0.08*svgw,blockh=0.055*svgw;

        var blockheight = blocksvg.append('g').append('rect').attr('class', 'barbgclass')
            .attr('width', left_svg_w * 0.8)
            .attr('height', left_svg_h * 0.8)
            .attr('transform', "translate(" + 0 + ',' + 0 + ')')
            .attr('fill-opacity', 0.2);
        // var blockheight= blocksvg.append('g').attr('class','nonono');

        //     blockheight.append('image').attr("opacity", 1).attr(
        //     'xlink:href', "/images/bg2.png")
        //     .attr('width', 0.38 * blockw)
        //     .attr('height', 0.24 * blockh*0.88)
        //     .attr('transform',"translate("+padding.left + ',' +padding.left+ ')');

        blocksvg.append('text').attr('text-anchor', 'middle').attr('x', '50%').attr('y', padding.left * 2)
            .style('font-size', autofontsize)
            .attr('class', 'blocktext2')
            .text($.i18n.prop("current_trans"));

        blocktext2 = blocksvg.append('text').attr('text-anchor', 'middle').attr('x', '50%').attr('y', padding.left * 4)
            .style('font-size', 1.7 * autofontsize)
            .attr('class', 'blocktext1')
            .text('');

    }
    //处理数据的过程//渲染区块详情视图
    function txsrender(data) {
        // console.log(data);
        $("#listTable").bootstrapTable('destroy');
        $('#listTable').bootstrapTable({
            data: data,
            pagination: true,
            sortable: true,
            columns: [{
                field: 'txid',
                title: $.i18n.prop('bt-txid'),
                align: 'center',
                formatter: function (value, row, index) {
                    var str = "<a href='/transaction/txid.html?txid=" + value + "'>" + value + "</a>"; //转为字符
                    return str;
                }
            }, {
                field: 'vin_count',
                title: $.i18n.prop('bt-vin_count'),
                align: 'center',
                sortable: true
            }, {
                field: 'vout_count',
                title: $.i18n.prop('bt-vout_count'),
                align: 'center',
                sortable: true
            },
            {
                field: 'size',
                title: $.i18n.prop('bt-size'),
                align: 'center',
                sortable: true
            },
            {
                field: 'txfee',
                title: $.i18n.prop('bt-txfee'),
                align: 'center',
                sortable: true
            }]
        });
    }
    //绘制初始状态铜钱按横坐标分布，参数resulttxs是数组，交易不需要排序
    function initcoinrender(resulttxs, name, order) {
        blocktext2.text(resulttxs.length);

        // var result_address_sort = [], result_txfee_sort=[],result_size_sort=[],
        var result_sort = resulttxs;
        if (name) {//有name才排序
            if ('asc' == order) {
                result_sort = resulttxs.sort(function (a, b) {//升序，从小到大
                    return (a[name] - b[name]);
                });
            } else {
                result_sort = resulttxs.sort(function (a, b) {//降序，从大到小
                    return (b[name] - a[name]);
                });
            }
        }

        //在main的基础上画铜钱
        var coinheight = mainsvg_height;
        d3.select('.mainClass').remove(); // 清空原图
        var main= mainsvg.append('g').attr('class', 'mainClass').attr("id", "mainsvg");
        // .attr("transform", "translate("+0+ "," + 0 + ")");

        var coinDiameter = coinheight * 0.65;//直径
        var radius = 0.5 * coinDiameter;//半径

        var sizerectLinear = d3.scaleLinear()  //铜钱里面用的比例尺
            .range([0.2 * 0.8 * radius, 0.8 * 0.8 * radius])
            .domain([0, result_max_txsize]);

        var result_txs_length = resulttxs.length;

        var coinsize = {
            "outerRadius": radius,
            "innerRadius": 0.8 * radius,
            'x': 0, //后面计算
            'y': 0.5 * left_svg_h * 0.8
        }

        /** 需要智能判断铜钱个数，算法:
         * 1 画图区宽度可以装铜钱个数c_n0=svgw/coinDiameter，
         * 2 如果交易条数>c_n0，则左右二边铜钱一样多，中间用一个3个直径放小圆点，向下取整Math.floor((c_n0-3)/2)=c_n
         *     c_n为左右两边铜钱的个数，铜钱之间的空隙c_s=(svgw-(2*c_n+1)*d)/c_n
         * 2019.5.19调整，省略号放最后

         * 3 如果交易条数<c_n0，则所有铜钱居中摆放
        */
        var c_svgw = coin_svgw;//可用宽度
        var c_n0 = c_svgw / coinDiameter;//最多放铜钱数
        var c_side = 1;//1为居中，2为两侧
        var c_n = 0;//铜钱个数
        c_n = Math.floor(c_n0 - 4);//省略号占2个直径，4为增大空隙
        var c_s = 0;//铜钱之间的空隙
        var c_left = 0;//居中时左边留白
        if (result_txs_length > c_n) {//交易数据过多用省略号;此处必须是c_n而不能是c_n0,因为要考虑铜钱之间的间隙,c_n0是理想状态,实际上不可能画的了这么多,c_n才是实际可以画的数量;
            c_side = 2;
            // c_n = Math.floor(c_n0 - 4);//省略号占4个直径;4为增大空隙
            c_s = (c_svgw - (c_n + 1.4) * coinDiameter) / (c_n);
        } else {//一排全部显示完
            c_side = 1;
            c_n = result_txs_length;
            c_s = c_svgw / c_n;//若空隙大于半径，则2边留白
            if (c_s > radius) {
                c_s = radius;
                c_left = (c_svgw - (c_n * coinDiameter + (c_n + 1) * radius)) / 2;
            }
        }

        for (let index = 0; index < c_n; index++) {
            coinsize.x = c_left + index * (coinDiameter + c_s) + 2 * radius;
            coin_glyph(main, coinsize, result_max_txsize, result_sort[index], index, sizerectLinear);
        }

        if (c_side == 2) {
            //画省略号
            for (var i = 0; i < 6; i++) {
                main.append("g").append('circle').attr('class', 'coin_circle')
                    .attr("cx", function (d) {
                        return c_left + c_n * (coinDiameter + c_s) + 1.1 * radius + i * coinDiameter / 7.0;
                    }).attr("cy", function (d) {
                        return coinsize.y;
                    }).attr("r", 1)
                    .attr('fill', 'grey');
            }
        }

        var tips = main.append('g').attr("class", "tips").attr('id', 'tipsbox')
            .style("display", "none");
        tips.append('rect')
            .attr('class', 'tips-border')
            .attr('width', 0.18 * svgw)
            .attr('height', 0.26 * svgh)
            .attr('rx', 10)
            .attr('ry', 10);
        tips.append('text').attr("id", "tipstext1")
            .attr('class', 'tips-text blocktextblack')
            .attr('x', 0.8*autofontsize)
            .attr('y', svgh*0.05)
            .text('')
            .style('font-size', autofontsize);
        tips.append('text').attr("id", "tipstext2")
            .attr('class', 'tips-text blocktextblack')
            .attr('x', 0.8*autofontsize)
            .attr('y', svgh*0.09)
            .text('').style('font-size', autofontsize);
        tips.append('text').attr("id", "tipstext3")
            .attr('class', 'tips-text blocktextblack')
            .attr('x', 0.8*autofontsize)
            .attr('y', svgh*0.14)
            .text('').style('font-size', autofontsize);
        tips.append('text').attr("id", "tipstext4")
            .attr('class', 'tips-text blocktextblack')
            .attr('x', 0.8*autofontsize)
            .attr('y', svgh*0.19)
            .text('').style('font-size', autofontsize);
        tips.append('text').attr("id", "tipstext5")
            .attr('class', 'tips-text blocktextblack')
            .attr('x', 0.8*autofontsize)
            .attr('y', svgh*0.23)
            .text('').style('font-size', autofontsize);
    }

    //生成单个铜钱
    var pagex, pagey;
    function coin_glyph(_svgmain, _coinsize, _maxtxsize, _tx, num, _sizerectLinear) {
        // console.log(_coinsize);
        pagex = _coinsize.x, pagey = _coinsize.y;
        var tempdata = [];
        tempdata.push(_tx);//作为弹出框定位用
        var coinsvg = _svgmain.append("g").selectAll("ring" + num)
            .data(tempdata).enter().append("g").attr("class", "ring" + num);
        coinsvg.attr('id', 'coin' + num)
            .attr('transform', "translate(" + _coinsize.x + "," + _coinsize.y + ")")
            .on("mouseover", mousemove)
            .on("mouseout", function () {
                d3.select("#tipsbox").style("display", "none");
            })
            .on('click', function () {
                top.location.href = "/transaction/txid.html?" + $.param({ txid: _tx.txid, addrsScale_max: addrsScale_max });
            }); //监听用;

        //设置弧度生成器，最外圆r1，次圆r2，半径固定
        var arc = d3.arc()
            .startAngle(0) //d3.v5 不指定会出错
            .endAngle(2 * Math.PI) //d3.v5 不指定会出错
            .innerRadius(_coinsize.innerRadius)
            .outerRadius(_coinsize.outerRadius);

        coinsvg.append("path")
            .attr("d", arc)
            .style("fill", "white")
            .style('stroke', '#ae7c4b')
            .attr('stroke-width', '1px');

        var ring_2 = coinsvg.append('g')
            .attr('class', 'ring_2');

        //中间大圆
        ring_2.append('circle')
            .attr('r', _coinsize.innerRadius)
            .style('fill', '#e9c598')
            .attr('opacity', function (d, i) {
                // console.log(_feemiddlecircle(_tx.txfee));
                return feecolor(_tx.txfee);
            });
        // .style('stroke', '#e5bb87')
        // .style('stroke-width', '1px');
        // var distance = (_coinsize.innerRadius - (_sizerectLinear(_tx.size) + 0.8 * 2) * 0.5) * 0.5;
        ring_2.append('text').attr('text-anchor', 'middle').attr('class', 'blocktext1')
            .attr('x', -0.5*_coinsize.innerRadius).attr('y', 0.25*_coinsize.innerRadius-0.25*autofontsize).text('T')
            .style('font-size', autofontsize).attr('opacity', 0.5);

        ring_2.append('text').attr('text-anchor', 'middle').attr('class', 'blocktext1')
            .attr('x', 0.5*_coinsize.innerRadius).attr('y', 0.25*_coinsize.innerRadius-0.25*autofontsize).text('X')
            .style('font-size', autofontsize).attr('opacity', 0.5);

        //算出交易尺寸占比
        var gper = 10 * _tx.size / _maxtxsize; //实际比例
        // console.log(gper);
        gper = Math.ceil(gper); //按高进位
        if (gper < 1) { // 实际 数据太小看不出效果
            gper = 1;
        }

        var arc_in = d3.arc() //后面画弧用
            .startAngle(-0.5 * Math.PI + addrsLinear(_tx.vin_count / 2.0))
            .endAngle(function () {
                return -addrsLinear(_tx.vin_count / 2.0) - 0.5 * Math.PI;
            }).innerRadius(_coinsize.innerRadius + 0.6)
            .outerRadius(_coinsize.outerRadius - 0.3);
        var arc_out = d3.arc() //后面画弧用
            .startAngle(0.5 * Math.PI - addrsLinear(_tx.vout_count / 2.0))
            .endAngle(function () {
                return addrsLinear(_tx.vout_count / 2.0) + 0.5 * Math.PI;
            }).innerRadius(_coinsize.innerRadius + 0.6)
            .outerRadius(_coinsize.outerRadius - 0.3);

        coinsvg.append("path")
            .attr("d", arc_in)
            .style("fill", "#b2d9ed");

        coinsvg.append("path")
            .attr("d", arc_out)
            .style("fill", "#b2d9ed");


        //中间竖线
        ring_2.append('rect')
            .attr('x', -0.5) //线宽一半
            .attr('y', -_coinsize.innerRadius)
            .attr('height', 2 * _coinsize.innerRadius)
            .attr('width', 1)
            .style('fill', '#ae7c4b')
            .style('opacity', '0.3');

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

    }

    function mousemove(d) {
        // 指向对象的实际位置
        // console.log();
        // console.log(pagey);

        // var mousePointObj = this.getBoundingClientRect();

        // // 获取鼠标相对于图形区的坐标，左上角坐标为(0,0) d3.mouse(this)[0]; d3.mouse(this)[1];
        var mouseX = $(this).css('transform').split('(')[1].split(')')[0].split(',')[4]
        var mouseY = $(this).css('transform').split('(')[1].split(')')[0].split(',')[5]
        // var mouseX = d3.mouse(this)[0];
        // var mouseY = d3.mouse(this)[1];

        try {
            d3.select("#tipstext1")
                .text($.i18n.prop('bt-txid') + ': ' + trim(d.txid).substring(0, 5) + '...' + trim(d.txid).substring(59, 64));
            d3.select("#tipstext2")
                .text($.i18n.prop('bt-vin_count') + ': ' + d.vin_count);
            d3.select("#tipstext3")
                .text($.i18n.prop('bt-vout_count') + ': ' + d.vout_count);
            d3.select("#tipstext4")
                .text($.i18n.prop('bt-txfee') + ': ' + d.txfee + ' SLU');
            d3.select("#tipstext5")
                .text($.i18n.prop('bt-size') + ': ' + d.size + ' bytes');

            d3.select("#tipsbox").attr("transform", "translate(" + mouseX + "," + (mouseY - 30) + ")").style("display", "block");
            // console.log('mouseX:'+mouseX+','+'mouseY:'+mouseY);

        } catch (e) {
            console.log(e);
        }

        function trim(s) {
            return s.replace(/(^\s*)|(\s*$)/g, "");
        }
    }

    //result:数据，radioitem单选按钮
    function coinfilterrender(result) {//构造x轴数据
        xsize = {
            x: padding.left * 2,
            y: svgh * 0.4 - padding.top,
            w: 0.28 * svgw
        }
        //y坐标轴
        ysize = {
            "h": svgh * 0.4 - padding.top * 2 - padding.bottom,
            "x": padding.left * 2,
            "y": padding.top * 2
        }

        coinfilterrender1(result.txs);
        coinfilterrender2(result.txs);
        coinfilterrender3(result.txs);

    }
 var  flag_addr=true;var XMAX_1; //控制地址数量chart的横轴不变
    function coinfilterrender1(result) {  //地址数量图
        d3.select('.filterClass1').remove(); // 清空原图
        var mainfilter = filtersvg.append('g').attr('class', 'filterClass1').attr("id", "filtersvg");
        xdatamax = d3.max(result, function (d) {
            return d.vin_count + d.vout_count
        });
        if(flag_addr==true){
        XMAX_1=xdatamax;
        }
        flag_addr=false;
        //线性比例尺
        filterx = d3.scaleLinear()
            .domain([0, XMAX_1 + XMAX_1/5.0])
            .range([0, xsize.w]);
        var xAxis = d3.axisBottom(filterx).ticks(5);//只标明5个刻度
        //定义直方图数据，自动分组
        histogram = d3.histogram() //bar
            .domain(filterx.domain())
            .thresholds(filterx.ticks(25))
            .value(function (d) {
                return d.vin_count + d.vout_count;
            });
        databins = histogram(result).filter(d => d.length > 0); //去掉过滤

        //添加x轴
        mainfilter.append("g")
            .attr("class", "axis xAxis")
            .attr("transform", "translate(" + xsize.x + "," + xsize.y + ")")
            .call(xAxis)
            .selectAll("text")
            .style("font-size", 0.7 * autofontsize + "px");

        mainfilter.append("text").attr('text-anchor', 'end')
            .attr("transform", "translate(" + (xsize.w + xsize.x) + "," + (xsize.y + padding.top * 2.4) + ")rotate(0)")
            .text($.i18n.prop("axis-x1"))
            .style("font-size", autofontsize + "px");

        ydatamax = d3.max(databins, function (d) { //bar
            return d.length;
        });//y1轴最大值
        filtery = d3.scaleLinear()
            .domain([ydatamax, 0])
            .range([0, ysize.h]);
        var yAxis = d3.axisLeft(filtery).ticks(3);
        //添加y1轴
        mainfilter.append("g")
            .attr("class", "axis xAxis")
            .attr("transform", "translate(" + ysize.x + "," + ysize.y + ")")
            .call(yAxis)
            .style("font-size", 0.7 * autofontsize + "px");
        mainfilter.append("text")
            .attr("transform", "translate(" + (ysize.x - 20) + "," + (ysize.y - 10) + ")rotate(0)")
            .text($.i18n.prop("axis-txs"))
            .style("font-size", autofontsize + "px");

        var flag; //true为刷子选中交易
        var brush = mainfilter.append("g")
            .data(databins)
            .attr("class", "brush")
            .call(d3.brushX().on('end', brushed));

        // console.log(databins[0]);

        //绘制矩形
        barwidth=svgw*0.005;
        // barwidth=0.5*(filterx(databins[0].x1)-filterx(databins[0].x0));
        // console.log("barwidth:"+barwidth);
        mainfilter.append("g")
            .selectAll("rect")
            .data(databins).enter()
            .append("rect")
            .attr("x", d => filterx(d.x0) + ysize.x+1)
            .attr("width", d => barwidth)
            .attr("y", d => filtery(d.length) + ysize.y)
            .attr("height", d => filtery(0) - filtery(d.length)).attr("fill", "#d6b58e")
            .attr('value', d => d.length).attr('fill-opacity', 0.9)
            .on('mouseover', rectbar).on('mouseout', function () {
                $('#rectbar').remove();
            });

        function rectbar(d) {
            var str="Range: "+d.x0+"~"+d.x1+", ";
            str=str+"Value: "+d.length;
            if($(this).attr('x')>(xsize.x+0.5*xsize.w)){
                // console.log($(this).attr('x')-0.3*xsize.w);
            mainfilter.append('g').attr('id', 'rectbar').append('text')
                .text(str).attr('x', $(this).attr('x')-0.32*xsize.w).attr("y", $(this).attr('y') - 2)
                .style('font-size', 0.7 * autofontsize).style('display', 'inline-block');
            }else{
                mainfilter.append('g').attr('id', 'rectbar').append('text')
                .text(str).attr('x', $(this).attr('x')).attr("y", $(this).attr('y') - 2)
                .style('font-size', 0.7 * autofontsize).style('display', 'inline-block');
            }
        }


        //刷选地址
        function brushed() {
            try {
                if (!d3.event.selection) {//没有选择
                    if (flag) { //之前选择了 现在取消选择区
                        flag = false;
                        resetBeforeBrush();
                    }
                    return;//本来就没有选择 不动
                }
                flag = true; //刷选之后就变成true

                //选中的x0到x1范围
                var sele = d3.event.selection;
                if (sele) {
                    var databinsele = [];
                    //判断d.x0是否在sele[0]和sele[1]之间
                    var seleminx = Math.min(sele[0], sele[1]) - xsize.x,
                        selemaxx = Math.max(sele[0], sele[1]) - xsize.x;
                    databins.forEach(element => {
                        var elementv = element.x0;
                        if (filterx(elementv) >= seleminx && filterx(elementv) <= selemaxx) {
                            databinsele.push(element); //存储刷子刷选出来的数据
                        }
                    });
                    if (databinsele.length > 0) { //刷新交易列表数据
                        filterSeleTxs = [];
                        databinsele.forEach(element => {
                            filterSeleTxs = filterSeleTxs.concat(element); //数组进行合并,刷子所选数据移到filterSeleTxs[]
                        });
                    } else {
                        filterSeleTxs = [];
                    }
                }

            } catch (err) {
                filterSeleTxs = [];
            }

            if (filterSeleTxs.length > 0) {//filterSeleTxs[] 存储着刷子所选数据
                filterSeleTxs2 = [];
                coinfilterrender2(filterSeleTxs);
                filterSeleTxs3 = [];
                coinfilterrender3(filterSeleTxs);
            } else {
                resetBeforeBrush();
            }
            queryTxsTable();
        }
    }

    //恢复没有刷选状态
    function resetBeforeBrush() {
        filterSeleTxs = [];
        filterSeleTxs2 = [];
        filterSeleTxs3 = [];
        queryTxsTable();
        coinfilterrender1(resultdata.txs);
        coinfilterrender2(resultdata.txs);
        coinfilterrender3(resultdata.txs);
    }


    var  flag_fee=true;var XMIN2,XMAX2; //控制交易费chart的横轴不变
    function coinfilterrender2(result) {
        d3.select('.filterClass2').remove(); // 清空原图
        var mainfilter2 = filtersvg2.append('g').attr('class', 'filterClass2').attr("id", "filtersvg2");
        var xdatamax2 = d3.max(result, function (d) {
            return d.txfee*1000;
        });
        var xdatamax2min = d3.min(result, function (d) {
            return d.txfee*1000;
        });

       if(flag_fee==true){
            XMIN2=xdatamax2min
            XMAX2=xdatamax2
       }
       flag_fee=false;
// console.log(flag_fee)
        filterx2 = d3.scaleLinear()
            .domain([XMIN2, XMAX2]) //增加一个刻度
            .range([0, xsize.w]);

        var xAxis2 = d3.axisBottom(filterx2).ticks(5);//只标明5个刻度
        histogram2 = d3.histogram() //bar
            .domain(filterx2.domain())
            .thresholds(filterx2.ticks(25))
            .value(function (d) {
                return d.txfee*1000;
            });
        databins2 = histogram2(result).filter(d => d.length > 0);
        mainfilter2.append("g")
            .attr("class", "axis xAxis")
            .attr("transform", "translate(" + xsize.x + "," + xsize.y + ")")
            .call(xAxis2)
            .selectAll("text")
            .style("font-size", 0.7 * autofontsize + "px");

        mainfilter2.append("text").attr('text-anchor', 'end')
            .attr("transform", "translate(" + (xsize.w + 1.12 * xsize.x) + "," + (xsize.y + padding.top * 2.4) + ")rotate(0)")
            .text($.i18n.prop("axis-x3"))
            .style("font-size", autofontsize + "px");

        ydatamax2 = d3.max(databins2, function (d) { //bar
            return d.length;
        });//y2轴最大值
        filtery2 = d3.scaleLinear()
            .domain([ydatamax2, 0])
            .range([0, ysize.h]);
        var yAxis2 = d3.axisLeft(filtery2).ticks(3);
        mainfilter2.append("g")
            .attr("class", "axis xAxis")
            .attr("transform", "translate(" + ysize.x + "," + ysize.y + ")")
            .call(yAxis2)
            .style("font-size", 0.7 * autofontsize + "px");
        mainfilter2.append("text")
            .attr("transform", "translate(" + (ysize.x - 23) + "," + (ysize.y - 10) + ")rotate(0)")
            .text($.i18n.prop("axis-txs"))
            .style("font-size", autofontsize + "px");
        //刷选费用
        var flag2; //true为刷子选中交易
        var brush2 = mainfilter2.append("g")
            .data(databins2)
            .attr("class", "brush")
            .call(d3.brushX().on('end', brushed2));

        mainfilter2.append("g")
            .attr("fill", "#d6b58e")
            .selectAll("rect")
            .data(databins2)
            .join("rect")
            .attr("x", d => filterx2(d.x0) + ysize.x)
            .attr("width", d => barwidth)
            .attr("y", d => filtery2(d.length) + ysize.y)
            .attr("height", d => filtery2(0) - filtery2(d.length)).attr('fill-opacity', 0.9)
            .text(d => d.length).attr('value', d => d.length).on('mouseover', rectbar2).on('mouseout', function () {
                $('#rectbar2').remove();
            });

        function rectbar2(d) {
            var str="Range: "+d.x0+"~"+d.x1+", ";
            str=str+"Value: "+d.length;
            // console.log($(this).attr('x'));
            if($(this).attr('x')>(0.5*xsize.w+xsize.x)){
            mainfilter2.append('g').attr('id', 'rectbar2').append('text').text(str)
                .attr('x', $(this).attr('x')-0.45*xsize.w).attr("y", $(this).attr('y') - 2)
                .style('font-size', 0.7 * autofontsize).style('display', 'block');
            }else{
                mainfilter2.append('g').attr('id', 'rectbar2').append('text').text(str)
                .attr('x', $(this).attr('x')).attr("y", $(this).attr('y') - 2)
                .style('font-size', 0.7 * autofontsize).style('display', 'block');
            }

        }



        function brushed2() {
            try {
                // $("#optionsRadios2").prop("checked", true);
                if (!d3.event.selection) {//没有选择
                    if (flag2) { //之前选择了，现在取消选择区
                        flag2 = false;
                        resetBeforeBrush();
                    }
                    return;//本来就没有选择，不动
                }
                flag2 = true; //刷选之后就变成true

                //选中的x0到x1范围
                var sele = d3.event.selection;
                if (sele) {
                    var databinsele = [];
                    //判断d.x0是否在sele[0]和sele[1]之间
                    var seleminx = Math.min(sele[0], sele[1]) - xsize.x,
                        selemaxx = Math.max(sele[0], sele[1]) - xsize.x;
                    databins2.forEach(element => {
                        var elementv = element.x0;
                        if (filterx2(elementv) >= seleminx && filterx2(elementv) <= selemaxx) {
                            databinsele.push(element);
                        }
                    });
                    if (databinsele.length > 0) { //刷新交易列表数据     
                        filterSeleTxs2 = [];
                        databinsele.forEach(element => {
                            filterSeleTxs2 = filterSeleTxs2.concat(element); //数组进行合并
                        });
                    } else {
                        filterSeleTxs2 = [];
                    }
                }

            } catch (err) {
                filterSeleTxs2 = [];
            }

            if (filterSeleTxs2.length > 0) {
                filterSeleTxs = [];
                coinfilterrender1(filterSeleTxs2);
                filterSeleTxs3 = [];
                coinfilterrender3(filterSeleTxs2);
            } else {
                resetBeforeBrush();
            }
            queryTxsTable();
        }
    }

    var  flag_size=true;var XMAX_3;
    function coinfilterrender3(result) {
        d3.select('.filterClass3').remove(); // 清空原图
        var mainfilter3 = filtersvg3.append('g').attr('class', 'filterClass3').attr("id", "filtersvg3");
        xdatamax3 = d3.max(result, function (d) {
            return d.size;
        });
        if(flag_size==true){
            XMAX_3=xdatamax3
        }
        flag_size=false;

        filterx3 = d3.scaleLinear()
            .domain([0, XMAX_3 + XMAX_3/5.0])
            .range([0, xsize.w]);
        var xAxis3 = d3.axisBottom(filterx3).ticks(5);//只标明5个刻度
        histogram3 = d3.histogram() //bar
            .domain(filterx3.domain())
            .thresholds(filterx3.ticks(25))
            .value(function (d) {
                return d.size;
            });
        databins3 = histogram3(result).filter(d => d.length > 0);
        // console.log(databins3)
        mainfilter3.append("g")
            .attr("class", "axis xAxis")
            .attr("transform", "translate(" + xsize.x + "," + xsize.y + ")")
            .call(xAxis3)
            .selectAll("text")
            .style("font-size", 0.7 * autofontsize + "px");

        mainfilter3.append("text").attr('text-anchor', 'end')
            .attr("transform", "translate(" + (xsize.w + 1.12 * xsize.x) + "," + (xsize.y + padding.top * 2.4) + ")rotate(0)")
            .text($.i18n.prop("axis-x2"))
            .style("font-size", autofontsize + "px");


        ydatamax3 = d3.max(databins3, function (d) { //bar
            return d.length;
        });//y3轴最大值
        filtery3 = d3.scaleLinear()
            .domain([ydatamax3, 0])
            .range([0, ysize.h]);
        var yAxis3 = d3.axisLeft(filtery3).ticks(3);
        mainfilter3.append("g")
            .attr("class", "axis xAxis")
            .attr("transform", "translate(" + ysize.x + "," + ysize.y + ")")
            .call(yAxis3)
            .style("font-size", 0.7 * autofontsize + "px");
        mainfilter3.append("text")
            .attr("transform", "translate(" + (ysize.x - 20) + "," + (ysize.y - 10) + ")rotate(0)")
            .text($.i18n.prop("axis-txs"))
            .style("font-size", autofontsize + "px");

        //刷选尺寸
        var flag3; //true为刷子选中交易
        var brush3 = mainfilter3.append("g")
            .data(databins3)
            .attr("class", "brush")
            .call(d3.brushX().on('end', brushed3));

        mainfilter3.append("g")
            .attr("fill", "#d6b58e")
            .selectAll("rect")
            .data(databins3)
            .join("rect")
            .attr("x", d => filterx3(d.x0) + ysize.x+1)
            .attr("width", d => barwidth)
            .attr("y", d => filtery3(d.length) + ysize.y)
            .attr("height", d => filtery3(0) - filtery3(d.length)).attr('fill-opacity', 0.9)
            .text(d => d.length).attr('value', d => d.length).on('mouseover', rectbar3).on('mouseout', function () {
                $('#rectbar3').remove();
            });

        function rectbar3(d) {
            var str="Range: "+d.x0+"~"+d.x1+", ";
            str=str+"Value: "+d.length;
             if($(this).attr('x')>(0.5*xsize.w+xsize.x)){
            mainfilter3.append('g').attr('id', 'rectbar3').append('text').text(str)
                .attr('x', $(this).attr('x')-0.4*xsize.w).attr("y", $(this).attr('y') - 2)
                .style('font-size', 0.7 * autofontsize).style('display', 'block');
            }else{
                mainfilter3.append('g').attr('id', 'rectbar3').append('text').text(str)
                .attr('x', $(this).attr('x')).attr("y", $(this).attr('y') - 2)
                .style('font-size', 0.7 * autofontsize).style('display', 'block');
            }
        }


        function brushed3() {
            try {
                // $("#optionsRadios3").prop("checked", true);
                if (!d3.event.selection) {//没有选择
                    if (flag3) { //之前选择了，现在取消选择区
                        flag3 = false;
                        resetBeforeBrush();
                    }
                    return;//本来就没有选择，不动
                }
                flag3 = true; //刷选之后就变成true

                //选中的x0到x1范围
                var sele = d3.event.selection;
                if (sele) {
                    var databinsele = [];
                    //判断d.x0是否在sele[0]和sele[1]之间
                    var seleminx = Math.min(sele[0], sele[1]) - xsize.x,
                        selemaxx = Math.max(sele[0], sele[1]) - xsize.x;
                    databins3.forEach(element => {
                        var elementv = element.x0;
                        if (filterx3(elementv) >= seleminx && filterx3(elementv) <= selemaxx) {
                            databinsele.push(element);
                        }
                    });
                    if (databinsele.length > 0) { //刷新交易列表数据     
                        filterSeleTxs3 = [];
                        databinsele.forEach(element => {
                            filterSeleTxs3 = filterSeleTxs3.concat(element); //数组进行合并
                        });
                    } else {
                        filterSeleTxs3 = [];
                    }
                }

            } catch (err) {
                filterSeleTxs3 = [];
            }

            if (filterSeleTxs3.length > 0) {
                filterSeleTxs2 = [];
                coinfilterrender2(filterSeleTxs3);
                filterSeleTxs = [];
                coinfilterrender1(filterSeleTxs3);
            } else {
                resetBeforeBrush();
            }
            queryTxsTable();
        }
    }


    //刷新显示刷子选中的数据
    function queryTxsTable() {
        // if(filterSeleTxs[i])

        var contractTxs = concatDelDup();
        $("#coin_glyph").mask();
        $("#listTable").mask();
        txsrender(contractTxs);
        initcoinrender(contractTxs);
        $("#coin_glyph").unmask();
        $("#listTable").unmask();
    }

    //处理三个刷选区的数据，相减，永远只有一个不为0
    function concatDelDup() {
        var obj = {}, newarr = [],
            len = filterSeleTxs.length,
            len2 = filterSeleTxs2.length,
            len3 = filterSeleTxs3.length;
        //不需要合并去重
        // if (len + len2 + len3 > 0) {
        //     for (var i = 0; i < len; i++) { //将原数组项作为对象的key进行赋值
        //         obj[filterSeleTxs[i].txid] = filterSeleTxs[i];
        //     }
        //     for (var i = 0; i < len2; i++) { //将原数组项作为对象的key进行赋值
        //         obj[filterSeleTxs2[i].txid] = filterSeleTxs2[i];
        //     }
        //     for (var i = 0; i < len3; i++) { //将原数组项作为对象的key进行赋值
        //         obj[filterSeleTxs3[i].txid] = filterSeleTxs3[i];
        //     }

        //     for (var attr in obj) { //遍历对象，取出key值添加到新数组
        //         newarr.push(obj[attr]);
        //     }
        //     return newarr;//返回新数组
        // } else {
        //     return resultdata.txs;
        // }
        if (len > 0) {
            return filterSeleTxs;
        } else if (len2 > 0) {
            return filterSeleTxs2;
        } else if (len3 > 0) {
            return filterSeleTxs3;
        } else {
            return resultdata.txs;
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

    //===============各种执行函数 结束=====================
});