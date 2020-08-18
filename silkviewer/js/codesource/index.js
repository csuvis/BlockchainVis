$(function () {	
	//从url参数中取得hash
    var url_fromheight = UrlParam.param("fromheight");
    var url_fromdate = UrlParam.param("fromdate");
    //设定显示的最新区块号，用于测试211199
    if ("undefined" == typeof url_fromheight) {
		url_fromheight=0;
	}else{
		try{
			url_fromheight=parseInt(url_fromheight);
			if (isNaN(url_fromheight)){
				url_fromheight=0;
			}
		}catch(e){
			url_fromheight=0;
		}
	}
	//url_fromheight=211199;
    //设定显示的最新日期，用于测试
    if ("undefined" == typeof url_fromdate) {
		url_fromdate="";
	}else{
		try{
			var t_regu =/^[2][0][0-9]{2}-[0-1]{1}[0-9]{1}-[0-3]{1}[0-9]{1}$/;
			var t_re = new RegExp(t_regu);
			if (!t_re.test(url_fromdate)) {//不符合
				url_fromdate="";
			}
		}catch(e){
			url_fromdate="";
		}
	}
	url_fromdate="2019-06-12";

	//指定首页显示高度，论文需要
	var maxblockHeight = url_fromheight,
		maxTrans;// 如果ajax请求最大块高度没变，则不必刷新

	var datasourcedetail;
	if (datasource == 0) {
		datasourcedetail = {
			"ajaxBlockcount": "/jsondata/indexnew.json",
			"ajaxsvgdata": "/jsondata/indexlimit6.json",
			"ajaxtjs30": "/jsondata/transactionNums.json"
		}
	} else {
		datasourcedetail = {
			"ajaxBlockcount": weburl + "/silkchain/indexnew",//"/jsondata/indexnew.json",//,
			"ajaxsvgdata": "/jsondata/indexlimit6.json",//weburl + "/silkchain/index?limit=6&fromheight="+maxblockHeight,
			"ajaxtjs30": weburl + "/silkchain/statistics/transactions?days=90"
		}
		
		if (url_fromheight>0){
			datasourcedetail.ajaxsvgdata="/jsondata/indexlimit6.json"; //weburl + "/silkchain/index?limit=6&fromheight="+url_fromheight;
		}
		if (url_fromdate.length>0){
			datasourcedetail.ajaxtjs30=weburl + "/silkchain/statistics/transactions?days=90&fromdate="+url_fromdate;
		}
	}

	ajaxBlockcount();
	//ajaxtjs30();//生成统计图
	//setInterval(ajaxBlockcount, 65000);//每65秒判断是否有最新块
	//改用websocket监听，不用重复刷新，监听到有新块产生时，再更新图
					
	if (url_fromheight>0){
		//不需更新
	}else{
		var socket = io(webhost);
		socket.on('connect', function () {
			socket.emit('subscribe', 'silubiumd/hashblock');
		});
		socket.on('silubiumd/hashblock', function (data) {
			// console.log("New silubiumd/hashblock received: " + JSON.stringify(data));
			setTimeout(ajaxBlockcount,5000);//因为后台需要处理区块数据，直接请求会将第1个块忽略。延迟5秒请求
		});
	}

	//setInterval(ajaxtjs30, 10 * 60 * 1000);//统计图10分钟更新

	function ajaxBlockcount() {
		$("#d3layout").mask();
		$.ajax({
			type: "get",
			async: true, // 异步请求
			url: datasourcedetail.ajaxBlockcount,
			data: { "height": maxblockHeight },
			success: function (result) {
				// console.log(result);
				if (result.result) {//有新块	
					$("#s_trans").html(result.transactions);// 交易总数
					$("#s_addrs").html(result.addresses);//地址总数	
					$("#block_trans").show();//默认是关闭的

					// maxblockHeight = result.height;//指定，不需改变					
					if (url_fromheight>0){
						maxblockHeight = url_fromheight;
					}else{
						maxblockHeight = result.height;
					}
					$("#s_lastestheight").html(maxblockHeight); // 最新区块高度,论文需要

					maxTrans=result.transactions;
					ajaxsvgdata();
					$("#d3layout").unmask();

				}
			},
			error: function (err) {
				console.log(err.statusText);
			}
		});
	}

	// ================通用变量================
	// svg大小
	var svgw = $("#d3layout").width();// 根据浏览器窗口大小确定画布宽度
	// SVG画布边缘与图表内容的距离
	var padding = {
		top: 0,
		right: 0.02 * svgw,
		bottom: 0.01 * svgw,
		left: 0.005 * svgw
	}
	// 第1行放最新的6个区块,最新的放右边
	// 一行6个块，5个间距=2块宽度，共8块宽度
	var blockw = (svgw - padding.left - padding.right) / 7.5;
	var blockh = blockw * 1.2974;// 根据宽度确定块高度（背景图的宽高比例）
	var svgh = 4*blockh;// 根据区块大小确定画布高度

	var blockspacemax = 0.6 * blockw;// 最大间距
	var blockspacemin = 0.2 * blockw;// 最小间距
	var barwidth = 0.8 * blockw;// 进度条宽度
	var barheight = 0.07 * blockh;// 进度条高度
	var sizebarwidth = 0.38 * blockw;//区块尺寸宽度和高度
	var sizebarheight = 0.24 * blockh;
	var blockspace;// 区块间距比例尺
	var chaindashsize = 0.012 * blockw;//链条点线小圆点大小
	var chaindashsizestr = chaindashsize + "," + chaindashsize;
	var autofontsize = 0.0102 * svgw;
	// var clientwidth=document.body.clientWidth;

	// 创建一个分组用来组合要画的图表元素，区块
	var mainsvg = d3.select("#d3layout").append("svg").attr("width", svgw).attr(
		"height", svgh).attr('transform',
			"translate(" + 0 + ',' + 0.03*blockh + ')');
	//动态控制都layout与搜索框的间隙	
	// document.getElementById('d3layout').style.marginTop=clientwidth*0.015+'px';

	var main = mainsvg.append('g').attr('class', 'mainClass');



	//浏览器可见区域内，全部看到区块和统计图，自动计算统计图高度
	//改进，手机竖屏统计图过长，改为统计区为3*blockh
	// var tjbmainheight = $(window).height() - svgh - 0.2 * blockh;
	// if (tjbmainheight < 1.3 * svgh) {
	// 	tjbmainheight = 1.3 * svgh;//保证统计图区不过小
	// }
	var tjbmainheight = svgh;//与上部保持0.618黄金分割比例
	var tjbmainsvg = d3.select("#d3tjb").append("svg").attr("width", svgw).attr(
		"height", blockh * 1.4).attr('transform',
			"translate(" + padding.left + ',' + 0 + ')');
	// document.getElementById('d3tjb').style.marginTop=clientwidth*0.015+'px';

	var tjbmain = tjbmainsvg.append('g').attr('class', 'tjbClass');


	// 创建一个分组用来组合要画的图表元素，统计图
	var tjbmainsvgpos = { left: padding.left, top: padding.top + svgh }
	//x坐标轴
	var tjbxpos = {
		"width": svgw-0.576 * blockw,
		"x": tjbmainsvgpos.left + 0.14 * blockw, //定位x
		"y": blockh * 1.22 //定位y
	}

	// 生成首页d3图
	function ajaxsvgdata() {
		$("#loading").removeClass("hidden");
		$.ajax({
			type: "get",
			async: true, // 异步请求
			url: datasourcedetail.ajaxsvgdata,// 取最新6个块的数据
			success: function (result) {
				// console.log(result);
				
				//item中包括的交易数，第一个区块是空的，去掉
				for (let index = 0; index < result.items.length; index++) {
					result.items[index].transaction_count=result.items[index].transaction_count-1;					
				}

				createsvg(result,maxblockHeight,maxTrans);

				$("#loading").addClass("hidden");

				// 刷新主页上左右颜色块的高度
				// $("#globalrightdiv").height($(document).height());
				// $("#globalcenterdiv").height($(document).height());
			},
			error: function (err) {
				console.error(err.statusText);
			}
		});
	}

	// ajax后得到数据，再执行的过程
	function createsvg(svgdata,maxblockHeight,maxTrans) {
		// console.log(maxblockHeight);
		d3.select('.mainClass').remove();// 清空原图
		main = mainsvg.append('g').attr('class', 'mainClass');
		// 
		// main = d3.select('svg').append('g').attr('class', 'mainClass');

		//记录时间差
		var max_timediff = svgdata.items[0].time_diff_lastblock,
			min_timediff = svgdata.items[0].time_diff_lastblock;
		for (let index = 1; index < svgdata.items.length - 1; index++) {//length-1计算前5个块就可以了
			if (max_timediff < svgdata.items[index].time_diff_lastblock) {
				max_timediff = svgdata.items[index].time_diff_lastblock;
			}
			if (min_timediff > svgdata.items[index].time_diff_lastblock) {
				min_timediff = svgdata.items[index].time_diff_lastblock;
			}
		}
		var blockspacetemp = d3.scaleLinear().domain(
			[min_timediff, max_timediff]).range(
				[blockspacemin, blockspacemax]);// 区块间距比例尺

		// 最大间距调优
		var spacesum15 = 0,spacesum610=0;
		for (let index = 0; index < 4; index++) {
			spacesum15 = spacesum15 + blockspacetemp(svgdata.items[index].time_diff_lastblock);
		}
		for (let index = 5; index < 9; index++) {
			spacesum610 = spacesum610 + blockspacetemp(svgdata.items[index].time_diff_lastblock);
		}
		var spacesum=Math.max(spacesum15,spacesum610);
		//为了让第1和第6区块正好左右对齐，页面上允许总间距，总长-6个区块
		var spacepage = svgw - padding.left - padding.right - 5 * blockw;
		var spaceadjust = spacepage / spacesum;
		blockspace = function (blockx) {
			return spaceadjust * blockspacetemp(blockx);
		}

		var block5size = {// 第5个区块尺寸 + blockw + blockspace(svgdata.items[4].time_diff_lastblock)
			x: padding.left,
			y: padding.top,
			width: blockw,
			height: blockh,
			no: 5,
			opacity: 0.8
		}
		var g5 = main.append('g').attr('class', 'block5').append("a").attr(
			"xlink:href",
			"/block/blockhash.html?" + $.param({hash:svgdata.items[4].hash}));
		var block5 = drawRect(g5, block5size);
		drawBlockHead(g5, 5, block5size, svgdata);// 区域，编号，区块大小，数据

		var block4size = {// 第4个区块尺寸
			x: padding.left + blockw  + blockspace(svgdata.items[3].time_diff_lastblock),
			y: padding.top,
			width: blockw,
			height: blockh,
			no: 4,
			opacity:0.68
		}
		var g4 = main.append('g').attr('class', 'block4').append("a").attr(
			"xlink:href",
			"/block/blockhash.html?" + $.param({hash:svgdata.items[3].hash}));
		var block4 = drawRect(g4, block4size);
		drawBlockHead(g4, 4, block4size, svgdata);// 区域，编号，区块大小，数据

		var block3size = {// 第3个区块尺寸
			x: padding.left + 2 * blockw + blockspace(svgdata.items[3].time_diff_lastblock)
				+ blockspace(svgdata.items[2].time_diff_lastblock),
			y: padding.top,
			width: blockw,
			height: blockh,
			no: 3,
			opacity: 0.55
		}
		var g3 = main.append('g').attr('class', 'block3').append("a").attr(
			"xlink:href",
			"/block/blockhash.html?" + $.param({hash:svgdata.items[2].hash}));
		var block3 = drawRect(g3, block3size);
		drawBlockHead(g3, 3, block3size, svgdata);// 区域，编号，区块大小，数据

		var block2size = {// 第2个区块尺寸
			x: padding.left + 3 * blockw  + blockspace(svgdata.items[3].time_diff_lastblock)
				+ blockspace(svgdata.items[2].time_diff_lastblock) + blockspace(svgdata.items[1].time_diff_lastblock),
			y: padding.top,
			width: blockw,
			height: blockh,
			no: 2,
			opacity: 0.4
		}
		var g2 = main.append('g').attr('class', 'block2').append("a").attr(
			"xlink:href",
			"/block/blockhash.html?" + $.param({hash:svgdata.items[1].hash}));
		var block2 = drawRect(g2, block2size);
		drawBlockHead(g2, 2, block2size, svgdata);// 区域，编号，区块大小，数据

		var blockchaing = main.append('g').attr("fill", "none").attr("stroke", "#a07757").attr("stroke-width", chaindashsize);
		dwawChainDash(blockchaing, block5size, 3, svgdata);
		dwawChainDash(blockchaing, block4size, 2, svgdata);
		dwawChainDash(blockchaing, block3size, 1, svgdata);

		var block1size = {// 第1个区块尺寸
			x: padding.left + 4 * blockw + blockspace(svgdata.items[3].time_diff_lastblock)
				+ blockspace(svgdata.items[2].time_diff_lastblock) + blockspace(svgdata.items[1].time_diff_lastblock)
				+ blockspace(svgdata.items[0].time_diff_lastblock),
			y: padding.top,
			width: blockw,
			height: blockh,
			no: 1,
			opacity: 0.3
		}
		var g1 = main.append('g').attr('class', 'block1').append("a").attr(
			"xlink:href",
			"/block/blockhash.html?" + $.param({hash:svgdata.items[0].hash}));
		// 最新块 动画链条

		// var blockchainnew = g1.append('image').attr('xlink:href',
		// 	"/images/blockchainNew.png").attr('x',
		// 		block1size.x - blockspace(svgdata.items[0].time_diff_lastblock)).attr('y',
		// 			block1size.y + 0.5 * blockh).attr('width',
		// 				9.32 * 0.067 * blockh);
		var blockchainnew = g1.append("g").attr("fill", "none").attr("stroke", "#91633F").attr("stroke-width", chaindashsize);
		dwawChainDash(blockchainnew, block2size, 0, svgdata);
		var block1 = drawRect(g1, block1size);
		var g1head = drawBlockHead(g1, 1, block1size, svgdata);// 区域，编号，区块大小，数据

		// 最新块 g1动画展示
		var g1BouncePos = {
			x0: block1size.x,
			y0: block1size.y,
			x1: 0,// 相对距离
			y1: 0
		}
		g1head.attr('transform',
			"translate(" + g1BouncePos.x0 + ',' + g1BouncePos.y0 + ')')
			.transition().duration(2000).ease(d3.easeElasticInOut).attr(
				'transform',
				"translate(" + g1BouncePos.x1 + ',' + g1BouncePos.y1
				+ ')');


		var block6size = {// 第6个区块尺寸
			x: padding.left,
			y: padding.top+blockh+blockspace(svgdata.items[4].time_diff_lastblock),
			width: blockw,
			height: blockh,
			no: 6,
			opacity: 1
		}
		// 写入区块头部信息
		var g6 = main.append('g').attr('class', 'block6').append("a").attr(
			"xlink:href", "/block/blockhash.html?" +$.param({hash:svgdata.items[5].hash}));
		var block6 = drawRect(g6, block6size);// 画区块形状
		drawBlockHead(g6, 6, block6size, svgdata);// 画区块数据，区域，编号，区块大小，数据		
		dwawChainDashV(blockchaing, block6size, 4, svgdata);//竖画65

		var block7size = {// 第7个区块尺寸
			x: padding.left+blockw+blockspace(svgdata.items[5].time_diff_lastblock),
			y: padding.top+blockh+blockspace(svgdata.items[4].time_diff_lastblock),
			width: blockw,
			height: blockh,
			no: 7,
			opacity: 1
		}
		// 写入区块头部信息
		var g7 = main.append('g').attr('class', 'block7').append("a").attr(
			"xlink:href", "/block/blockhash.html?" +$.param({hash:svgdata.items[6].hash}));
		var block7 = drawRect(g7, block7size);// 画区块形状
		drawBlockHead(g7, 7, block7size, svgdata);// 画区块数据，区域，编号，区块大小，数据		
		dwawChainDashR(blockchaing, block7size, 5, svgdata);

		var block8size = {// 第7个区块尺寸
			x: padding.left+2*blockw+blockspace(svgdata.items[5].time_diff_lastblock)+blockspace(svgdata.items[6].time_diff_lastblock),
			y: padding.top+blockh+blockspace(svgdata.items[4].time_diff_lastblock),
			width: blockw,
			height: blockh,
			no: 8,
			opacity: 1
		}
		// 写入区块头部信息
		var g8 = main.append('g').attr('class', 'block8').append("a").attr(
			"xlink:href", "/block/blockhash.html?" +$.param({hash:svgdata.items[7].hash}));
		var block8 = drawRect(g8, block8size);// 画区块形状
		drawBlockHead(g8, 8, block8size, svgdata);// 画区块数据，区域，编号，区块大小，数据		
		dwawChainDashR(blockchaing, block8size, 6, svgdata);

		
		var block9size = {// 第7个区块尺寸
			x: padding.left+3*blockw+blockspace(svgdata.items[5].time_diff_lastblock)+blockspace(svgdata.items[6].time_diff_lastblock)+blockspace(svgdata.items[7].time_diff_lastblock),
			y: padding.top+blockh+blockspace(svgdata.items[4].time_diff_lastblock),
			width: blockw,
			height: blockh,
			no: 9,
			opacity: 1
		}
		// 写入区块头部信息
		var g9 = main.append('g').attr('class', 'block9').append("a").attr(
			"xlink:href", "/block/blockhash.html?" +$.param({hash:svgdata.items[8].hash}));
		var block9 = drawRect(g9, block9size);// 画区块形状
		drawBlockHead(g9, 9, block9size, svgdata);// 画区块数据，区域，编号，区块大小，数据		
		dwawChainDashR(blockchaing, block9size, 7, svgdata);


		var block10size = {// 第7个区块尺寸
			x: padding.left+4*blockw+blockspace(svgdata.items[5].time_diff_lastblock)+blockspace(svgdata.items[6].time_diff_lastblock)+blockspace(svgdata.items[7].time_diff_lastblock)+blockspace(svgdata.items[8].time_diff_lastblock),
			y: padding.top+blockh+blockspace(svgdata.items[4].time_diff_lastblock),
			width: blockw,
			height: blockh,
			no: 10,
			opacity: 1
		}
		// 写入区块头部信息
		var g10 = main.append('g').attr('class', 'block10').append("a").attr(
			"xlink:href", "/block/blockhash.html?" +$.param({hash:svgdata.items[9].hash}));
		var block10 = drawRect(g10, block10size);// 画区块形状
		drawBlockHead(g10, 10, block10size, svgdata);// 画区块数据，区域，编号，区块大小，数据		
		dwawChainDashR(blockchaing, block10size, 8, svgdata);

		var block11size = {// 第11个区块尺寸
			x: block10size.x,
			y: block10size.y+blockh+blockspace(svgdata.items[9].time_diff_lastblock),
			width: blockw,
			height: blockh,
			no: 11,
			opacity: 1
		}
		// 写入区块头部信息
		var g11 = main.append('g').attr('class', 'block11').append("a").attr(
			"xlink:href", "/block/blockhash.html?" +$.param({hash:svgdata.items[10].hash}));
		var block11 = drawRect(g11, block11size);// 画区块形状
		drawBlockHead(g11, 11, block11size, svgdata);// 画区块数据，区域，编号，区块大小，数据		
		dwawChainDashV(blockchaing, block11size, 9, svgdata);//竖画1110

		var block0size = {// 第11个区块尺寸
			x: padding.left,
			y: block10size.y+blockh+blockspace(svgdata.items[9].time_diff_lastblock),
			width: blockw,
			height: blockh,
			no: 0,
			opacity: 1
		}
		// 写入区块头部信息
		var g0 = main.append('g').attr('class', 'block0');
		var block0 = drawRect0(g0, block0size);// 画区块形状
		drawBlockHead0(g0, 0, block0size, svgdata)

		// =========生成链条================
		
		var chain1110size = {
			x: block11size.x +0.502* blockw,
			y: block11size.y - 0.42*blockspace(svgdata.items[9].time_diff_lastblock),
			w: 0.5*blockw,
			h: blockh / 5
		}
		var chain1110 = main.append('g').attr('class', 'chain1110');
		drawChain(chain1110, chain1110size,
			svgdata.items[9].previousblockhash, svgdata.items[9].time_diff_lastblock);// 65之间

		var chain109size = {
			x: block10size.x - blockspace(svgdata.items[8].time_diff_lastblock),
			y: block10size.y + 0.45 * blockh,
			w: blockspace(svgdata.items[8].time_diff_lastblock),
			h: blockh / 5
		}
		var chain109 = main.append('g').attr('class', 'chain109');
		drawChain(chain109, chain109size,
			svgdata.items[8].previousblockhash, svgdata.items[8].time_diff_lastblock);

		var chain98size = {
			x: block9size.x - blockspace(svgdata.items[7].time_diff_lastblock),
			y: block9size.y + 0.45 * blockh,
			w: blockspace(svgdata.items[7].time_diff_lastblock),
			h: blockh / 5
		}
		var chain98 = main.append('g').attr('class', 'chain98');
		drawChain(chain98, chain98size,
			svgdata.items[7].previousblockhash, svgdata.items[7].time_diff_lastblock);
		
		var chain87size = {
			x: block8size.x - blockspace(svgdata.items[6].time_diff_lastblock),
			y: block8size.y + 0.45 * blockh,
			w: blockspace(svgdata.items[6].time_diff_lastblock),
			h: blockh / 5
		}
		var chain87 = main.append('g').attr('class', 'chain87');
		drawChain(chain87, chain87size,
			svgdata.items[6].previousblockhash, svgdata.items[6].time_diff_lastblock);

			
		var chain76size = {
			x: block7size.x - blockspace(svgdata.items[5].time_diff_lastblock),
			y: block7size.y + 0.45 * blockh,
			w: blockspace(svgdata.items[5].time_diff_lastblock),
			h: blockh / 5
		}
		var chain76 = main.append('g').attr('class', 'chain76');
		drawChain(chain76, chain76size,
			svgdata.items[5].previousblockhash, svgdata.items[5].time_diff_lastblock);

		var chain65size = {
			x: block6size.x +0.502* blockw,
			y: block6size.y - 0.42*blockspace(svgdata.items[4].time_diff_lastblock),
			w: 0.5*blockw,
			h: blockh / 5
		}
		var chain65 = main.append('g').attr('class', 'chain65');
		drawChain(chain65, chain65size,
			svgdata.items[4].previousblockhash, svgdata.items[4].time_diff_lastblock);// 65之间

		var chain54size = {
			x: block5size.x + blockw,
			y: block5size.y + 0.45 * blockh,
			w: blockspace(svgdata.items[3].time_diff_lastblock),
			h: blockh / 6
		}
		var chain54 = main.append('g').attr('class', 'chain54');
		drawChain(chain54, chain54size,
			svgdata.items[3].previousblockhash, svgdata.items[3].time_diff_lastblock);// 54之间

		var chain43size = {
			x: block4size.x + blockw,
			y: block4size.y + 0.45 * blockh,
			w: blockspace(svgdata.items[2].time_diff_lastblock),
			h: blockh / 5
		}
		var chain43 = main.append('g').attr('class', 'chain43');
		drawChain(chain43, chain43size,
			svgdata.items[2].previousblockhash, svgdata.items[2].time_diff_lastblock);

		var chain32size = {
			x: block3size.x + blockw,
			y: block3size.y + 0.45 * blockh,
			w: blockspace(svgdata.items[1].time_diff_lastblock),
			h: blockh / 5
		}
		var chain32 = main.append('g').attr('class', 'chain32');
		drawChain(chain32, chain32size,
			svgdata.items[1].previousblockhash, svgdata.items[1].time_diff_lastblock);

		var chain21size = {
			x: block2size.x + blockw,
			y: block2size.y + 0.45 * blockh,
			w: blockspace(svgdata.items[0].time_diff_lastblock),
			h: blockh / 5
		}
		var chain21 = main.append('g').attr('class', 'chain21');
		var chain21Link = drawChain(chain21, chain21size,
			svgdata.items[0].previousblockhash, svgdata.items[0].time_diff_lastblock);

		// 21链动画展示
		var chain21BouncePos = {
			x0: chain21size.x,
			y0: chain21size.y,
			x1: 0,// 相对距离
			y1: 0
		}
		chain21Link.attr(
			'transform',
			"translate(" + chain21BouncePos.x0 + ',' + chain21BouncePos.y0
			+ ')').transition().duration(2000).ease(d3.easeElasticInOut).attr(
				'transform',
				"translate(" + chain21BouncePos.x1 + ',' + chain21BouncePos.y1
				+ ')');


	}

	// 画区块方框
	function drawRect(svbobj, blockSize) {
		return svbobj.append('image').attr("opacity", blockSize.opacity).attr(
			'xlink:href', "/images/block6.png").attr('x', blockSize.x).attr('y',
				blockSize.y).attr('width', blockSize.width).attr('height',
					blockSize.height);
	}
	function drawRect0(svbobj, blockSize) {
		return svbobj.append('image').attr("opacity", blockSize.opacity).attr(
			'xlink:href', "/images/block0.png").attr('x', blockSize.x).attr('y',
				blockSize.y).attr('height',blockSize.height);
	}

	// 画区块头部
	function drawBlockHead(group, blockNo, blockSize, data) {
		// console.log(data);
		// var heightbgsize = group.append("g").append('rect').attr('class', 'barbgclass').attr('x',
		// blockSize.x + 0.1 * blockw).attr('y',
		// 	blockSize.y + 0.08 * blockh).attr('width', sizebarwidth).attr(
		// 		'height', 0.88*sizebarheight).attr('fill-opacity', 0.2);// 占比背景

		var t1 = appendLineText(group, $.i18n.prop("svgHeight")+":"+ data.items[blockNo - 1].height, blockSize.x + 0.126
			* blockw, blockSize.y + 0.45 * blockh, 0.88 * blockw, 0.051 * blockh);

		// var t11 = appendLineText(group, data.items[blockNo - 1].height, blockSize.x + 0.15
		// 	* blockw, blockSize.y + 0.36 * blockh, sizebarwidth, 0.3*sizebarheight);

		//区块确认数		
		// var confirmbgsize = group.append("g").append('rect').attr('class', 'barbgclass').attr('x',
		// blockSize.x + 0.52 * blockw).attr('y',
		// 	blockSize.y + 0.08 * blockh).attr('width', sizebarwidth).attr(
		// 		'height', 0.88*sizebarheight).attr('fill-opacity', 0.2);
		// var t1c = appendLineText(group, $.i18n.prop("bi-Confirmations"), blockSize.x + 0.535
		// 	* blockw, blockSize.y + 0.07 * blockh, sizebarwidth,0.2 * blockh);
		var confirms_t11c=(maxblockHeight-data.items[blockNo - 1].height+1)+"";//确认数，转字符
		
		var t11c = appendLineText(group, confirms_t11c, blockSize.x + 0.69
			* blockw, blockSize.y + 0.14 * blockh, sizebarwidth,0.3*sizebarheight);

		var blockhash = data.items[blockNo - 1].hash;
		var t2 = appendLineText(group, $.i18n.prop("svgBlockHash") + ': '
			+ blockhash.substring(0, 5) + '...'
			+ blockhash.substring(blockhash.length - 5, blockhash.length),
			blockSize.x + 0.126 * blockw, blockSize.y + 0.51 * blockh,
			0.88 * blockw, 0.051 * blockh);
		t2.append('title').text($.i18n.prop("svgBlockHash") + ': ' + blockhash);

		var preblockhash = data.items[blockNo - 1].previousblockhash;
		var t3 = appendLineText(group, $.i18n.prop("svgPreviousBlockHash")
			+ ': '
			+ preblockhash.substring(0, 3)
			+ '...'
			+ preblockhash.substring(preblockhash.length - 3,
				preblockhash.length), blockSize.x + 0.126 * blockw,
			blockSize.y + 0.58 * blockh, 0.88 * blockw, 0.051 * blockh);
		t3.append('title').text($.i18n.prop("svgPreviousBlockHash") + ': ' + preblockhash);

		var roothast = data.items[blockNo - 1].merkleroot;
		var t4 = appendLineText(group, $.i18n.prop("svgMerkleRoot") + ': '
			+ roothast.substring(0, 4) + '...'
			+ roothast.substring(roothast.length - 5, roothast.length),
			blockSize.x + 0.126 * blockw, blockSize.y + 0.65 * blockh, 0.88 * blockw, 0.051 * blockh);
		t4.append('title').text($.i18n.prop("svgMerkleRoot") + ': ' + roothast);

		var agetime = cnen_timeformater(data.items[blockNo - 1].time);
		// console.log(agetime);
		//new Date(1000 * data.items[blockNo - 1].time).format($.i18n.prop("svgTimeFormat"));
		var t5 = appendLineText(group, $.i18n.prop("svgAge") + ': ' + agetime,
			blockSize.x + 0.126 * blockw, blockSize.y + 0.72 * blockh,
			0.88 * blockw, 0.051 * blockh);
		t5.append('title').text($.i18n.prop("svgAge") + ': ' + agetime);

		//区块大小组
		var groupsize = group.append("g");
		var gbarbgsize = groupsize.append('rect').attr('class', 'barbgclass').attr('x',
			blockSize.x + 0.1 * blockw).attr('y',
				blockSize.y + 0.88 * blockh).attr('width', barwidth).attr(
					'height', barheight).attr('fill-opacity', 0.2);// 占比背景
		// 区块使用占比，最大为8M，分为10段
		var blocksizeshow = data.items[blockNo - 1].size;
		// console.log(blocksizeshow)
		blocksizeshow = blocksizeshow.toFixed(0);
		var gper =  data.items[blockNo - 1].size / 8000000;//实际比例
		// gper = Math.ceil(gper);//按高进位
		// if (gper < 1) {// 实际 数据太小看不出效果
		// 	gper = 1;
		// }

		var gbarfgsize = groupsize.append('rect').attr('class', 'barfgclass').attr('x',
			blockSize.x + 0.1 * blockw).attr('y',
				blockSize.y + 0.88 * blockh).attr('width', gper * barwidth).attr(
					'height', barheight).attr('fill-opacity', blockSize.opacity);// 区块尺寸占比前景

		var gbartextsize = appendLineText(groupsize, $.i18n.prop("svgSize") + ': ' +blocksizeshow+' Bytes',
			blockSize.x + 0.12 * blockw, blockSize.y + 0.88 * blockh + 0.7 * barheight,
			barwidth, 0.6 * barheight);

		// var gbartextsize2=appendLineText(groupsize, 'KB',
		// 	blockSize.x + 0.13 * blockw, blockSize.y + 0.27 * blockh,
		// 	0.9 * sizebarwidth, 0.3 * sizebarheight);
		gbartextsize.attr("class", "blocktext");//改变显示的颜色
		// gbartextsize2.attr("class", "blocktextblack")
		groupsize.append('title').text($.i18n.prop("svgSize") + ': ' + blocksizeshow + " Bytes");

		//交易数量
		var grouptxs = group.append("g");
		// grouptxs.append('rect').attr('class', 'barbgclass').attr('x',
		// 	blockSize.x + 0.1 * blockw).attr('y',
		// 		blockSize.y + 0.69 * blockh).attr('width', barwidth).attr(
		// 			'height', barheight).attr('fill-opacity', 0.2);// 交易数量占比背景
		// // 交易数占比，分为5段
		// var gpertx = data.items[blockNo - 1].transaction_count / data.max_transaction_count;//实际比例
		// console.log(gpertx);
		// gpertx = Math.ceil(gpertx);//按高进位
		// if (gpertx < 1) {// 实际 数据太小看不出效果
		// 	gpertx = 1;
		// }
		// grouptxs.append('rect').attr('class', 'barfgclass').attr('x',
		// 	blockSize.x + 0.1 * blockw).attr('y',
		// 		blockSize.y + 0.69 * blockh).attr('width', gpertx * barwidth).attr(
		// 			'height', barheight).attr('fill-opacity', blockSize.opacity);// 交易数量占比前景
		var gbartexttxs = appendLineText(grouptxs, $.i18n.prop("svgTrans") + ': ' + data.items[blockNo - 1].transaction_count,
			blockSize.x + 0.12 * blockw, blockSize.y + 0.765 * blockh + 0.7 * barheight,
			barwidth, 0.8 * barheight);
		gbartexttxs.attr("class", "blocktextblack");//改变显示的颜色
		grouptxs.append('title').text($.i18n.prop("svgTrans") + ': ' + data.items[blockNo - 1].transaction_count);

		//费用
		// var groupfee = group.append("g");
		// groupfee.append('rect').attr('class', 'barbgclass').attr('x',
		// 	blockSize.x + 0.1 * blockw).attr('y',
		// 		blockSize.y + 0.85 * blockh).attr('width', barwidth).attr(
		// 			'height', barheight).attr('fill-opacity', 0.2);// 占比背景
		// // 区块奖励+交易手续费占比，分为5段
		// var fees = data.items[blockNo - 1].txfee_sum + data.items[blockNo - 1].reward;
		// var gperfee =  fees / (data.max_txfee_sum + data.items[blockNo - 1].reward);//实际比例
		// gperfee = Math.ceil(gperfee);//按高进位
		// if (gperfee < 1) {// 实际 数据太小看不出效果
		// 	gperfee = 1;
		// }
		// groupfee.append('rect').attr('class', 'barfgclass').attr('x',
		// 	blockSize.x + 0.1 * blockw).attr('y',
		// 		blockSize.y + 0.85 * blockh).attr('width', gperfee * barwidth).attr(
		// 			'height', barheight).attr('fill-opacity', blockSize.opacity);// 费用占比前景
		// var gbartextfee = appendLineText(groupfee, $.i18n.prop("svgFee") + ': ' + fees.toFixed(3) + " SLU",
		// 	blockSize.x + 0.12 * blockw, blockSize.y + 0.85 * blockh + 0.7 * barheight,
		// 	barwidth + 0.14 * blockw, 0.6 * barheight);
		// gbartextfee.attr("class", "blocktextblack");//改变显示的颜色
		// groupfee.append('title').text($.i18n.prop("svgFee") + ': ' + fees.toFixed(3) + " SLU");

		return group;
	}

	function drawBlockHead0(group, blockNo, blockSize, data) {
		var t1 = appendLineText(group, $.i18n.prop("svgHeight")+":1", blockSize.x + 0.126
			* blockw, blockSize.y + 0.48 * blockh, 0.88 * blockw, 0.1 * blockh);
			
		var t2 = appendLineText(group, $.i18n.prop("svgGenesisBlock"), blockSize.x + 0.126
		* blockw, blockSize.y + 0.7 * blockh, 0.88 * blockw, 0.1 * blockh);

		return group;
	}

	// 画链条上的文字
	function drawChain(chainG, chainSize, previousblockhash, timediff) {
		var chainText = appendChainText(chainG,
			timediff + $.i18n.prop("svgSecond"), chainSize.x+0.01*blockw,
			chainSize.y - 0.01 * blockh, 0.8*chainSize.w, 0.8*chainSize.h).append(
				'title').text(
					$.i18n.prop("svgTimeDiff") + '：' + timediff
					+ $.i18n.prop("svgSecond") + '; '
					+ $.i18n.prop("svgPreviousBlockHash") + ':'
					+ previousblockhash);// 链条上的文字
		return chainG;
	}

	//画点画线链条
	function dwawChainDash(blockchaing, blocksizeNo, no, svgdata) {
		// blockchaing.append('image').attr('xlink:href', "/images/left.png").attr('x', blocksizeNo.x + blockw).attr('y',
		// 	blocksizeNo.y + 0.52 * blockh - 0.02896 * blockh).attr('width', 0.05 * blockw).attr('height', 0.05792 * blockh);
		blockchaing.append("path").attr("stroke-dasharray", chaindashsizestr).attr("d", function () {
			var tempx = blocksizeNo.x + blockw + 0.01 * blockw;
			var tempy = blocksizeNo.y + 0.52 * blockh;
			var temph = blockspace(svgdata.items[no].time_diff_lastblock) - 0.02 * blockw;
			var tempd = "M" + tempx + " " + tempy + " l" + temph + " 0";
			return tempd;
		});
		return blockchaing;
	}

	//竖画点画线链条
	function dwawChainDashV(blockchaing, blocksizeNo, no, svgdata) {
		blockchaing.append("path").attr("stroke-dasharray", chaindashsizestr).attr("d", function () {
			var tempx = blocksizeNo.x + 0.5*blockw;
			var tempy = blocksizeNo.y;
			var temph = blockspace(svgdata.items[no].time_diff_lastblock) - 0.02 * blockw;
			var tempy1=tempy-temph;
			var tempd = "M" + tempx + " " + tempy + " L" + tempx + " "+tempy1;
			return tempd;
		});
		return blockchaing;
	}

	//反向画点画线链条
	function dwawChainDashR(blockchaing, blocksizeNo, no, svgdata) {
		blockchaing.append("path").attr("stroke-dasharray", chaindashsizestr).attr("d", function () {
			var tempx = blocksizeNo.x;
			var tempy = blocksizeNo.y + 0.52 * blockh;
			var temph = blockspace(svgdata.items[no].time_diff_lastblock) - 0.02 * blockw;
			var tempx1=tempx-temph;
			var tempd = "M" + tempx + " " + tempy + " L" + tempx1 + " "+tempy;
			return tempd;
		});
		return blockchaing;
	}
	//************************************** */
	// function ajaxtjs30() {// ajax最近30天数据
	// 	$("#d3tjb").mask();
	// 	$.ajax({
	// 		type: "get",
	// 		async: true, // 异步请求
	// 		url: datasourcedetail.ajaxtjs30,// 
	// 		success: function (result) {
	// 			createtjbsvg(result);
	// 			// console.log(result);
	// 			// createdragsele(resu/lt);//显示拖选区
	// 			$("#d3tjb").unmask();
	// 		},
	// 		error: function (err) {
	// 			console.error(err.statusText);
	// 		}
	// 	});
	// }

	function createtjbsvg(tjbdata) {
		d3.select('.tjbClass').remove();// 清空原图
		tjbmain = tjbmainsvg.append('g').attr('class', 'tjbClass');

		// 显示图例
		var tjbsign = tjbmain.append("g");
		tjbsign.append("rect").attr("x", tjbmainsvgpos.left + 3.9 * blockw).attr("y", 0.035 * blockh)
			.attr("class", "line3-text").attr('width',0.2*blockw).attr('height',0.01*blockw);
		tjbsign.append("circle").attr("cx", tjbmainsvgpos.left + 4.0 * blockw).attr("cy", 0.04 * blockh)
			.attr('r',0.02*blockw).attr("class", "line3-text");
		tjbsign.append("text").attr("x", tjbmainsvgpos.left + 4.2 * blockw).attr("y", 0.05 * blockh)
			.attr("class", "legend").text($.i18n.prop("g-transaction_count")).style("font-size", autofontsize + "px");

		// tjbsign.append("text").attr("x", tjbmainsvgpos.left + 3.3 * blockw).attr("y", 0.05 * blockh)
		// 	.attr("class", "bar2-rect").text("■").style("font-size", autofontsize + "px");
		// tjbsign.append("text").attr("x", tjbmainsvgpos.left + 3.4 * blockw).attr("y", 0.05 * blockh)
		// 	.attr("class", "legend").text($.i18n.prop("g-txfee_sum")).style("font-size", autofontsize + "px");

		//x，原来为 5.1 * blockw  5.25 * blockw
		tjbsign.append("text").attr("x", tjbmainsvgpos.left + 2.7 * blockw).attr("y", 0.05 * blockh)
		.attr("class", "bar1-rect").text("■").style("font-size", autofontsize + "px");// reward_sum
		tjbsign.append("text").attr("x", tjbmainsvgpos.left + 2.8 * blockw).attr("y", 0.05 * blockh)
			.attr("class", "legend").text($.i18n.prop("g-reward_sum"))
			.style("font-size", autofontsize + "px");
		//d3.select("#tjblegend").style("display","block");

		var parseDateShow = d3.timeFormat("%b"+" "+"%d");

		// var tjbx = d3.scaleTime()  //时间比例尺，ticks不准确，有误差，弃用
		// 	.range([0, tjbxpos.width])
		// 	.domain(d3.extent(tjbdata, function (d) {
		// 		return new Date(d.date);
		// 	}))
		// 	.nice();//找了很久，默认第1个刻度只有一半，加上后正常;
		var newtjbdata_date = [];//x轴，日期
		var newtjdata_y1bar = [];//y1轴，奖励、交易费和利息
		var newtjdata_y2line = [];//y2轴，区块数
		var newtjdata_y3line = [];//y3轴，交易数
		for (let index = tjbdata.length - 1; index >= 0; index--) {
			newtjbdata_date.push(tjbdata[index].date);
			// newtjdata_y1bar.push(tjbdata[index].reward_sum + tjbdata[index].txfee_sum + tjbdata[index].interest_sum);
			newtjdata_y1bar.push(tjbdata[index].reward_sum + tjbdata[index].txfee_sum);//不要利息
			newtjdata_y2line.push(tjbdata[index].block_count);
			newtjdata_y3line.push(tjbdata[index].transaction_count);
		}
		var tjbx = d3.scaleBand()
			.domain(newtjbdata_date)
			.range([0, tjbxpos.width]);

		var tjbxAxis = d3.axisBottom(tjbx)       //新建一个默认的坐标轴
			.tickFormat(function (d, i) {    //自定义刻度文字格式
				var txtnums=20; //显示多少个刻度的文字
				if (tjbdata.length > txtnums){
					var step = Math.floor(tjbdata.length / txtnums); //只显示20个刻度的值
					if (i % step == 0) {
						var tempd = new Date(d);
						return parseDateShow(tempd);
					} else {
						return "";
					}
				}else{
					var tempd = new Date(d);
					return parseDateShow(tempd);
				}
			});
		tjbmain.append("g")
			.attr("class", "axis tjbx")
			.attr("transform", "translate(" + tjbxpos.x + "," + tjbxpos.y + ")")
			.call(tjbxAxis)
			.selectAll("text")
			.attr("transform", "rotate(-30)")
			.style("text-anchor", "end")
			.style("font-size", 0.7*autofontsize + "px");

		//y1坐标轴:费用，柱形
		var tjby1pos = {
			"height": blockh,
			"chartheight": 0.5 * (tjbmainheight - 0.4 * blockh),//暂未启用
			"x": tjbmainsvgpos.left + 0.14 * blockw, //定位x
			"y": 0.22 * blockh //定位y
		}
		var tjby1 = d3.scaleLinear()
			.range([0, tjby1pos.height])
			.domain([d3.max(newtjdata_y1bar), 0]);
		var tjby1Axis = d3.axisLeft(tjby1)       //新建一个默认的坐标轴
			.ticks(5)
			.tickFormat(function (d) {    //自定义刻度文字格式
				if (d >= 1000) {
					return (d / 1000).toFixed(1) + "K";
				} else {
					return d;
				}
			});
		tjbmain.append("g")
			.attr("class", "axis tjby1")
			.attr("transform", "translate(" + tjby1pos.x + "," + tjby1pos.y + ")")
			.call(tjby1Axis)
			.selectAll("text")
			.style("font-size", 0.7 * autofontsize + "px");

		tjbmain.append("text")
			.attr("transform", "translate(" + (tjby1pos.x - 2 * autofontsize) + "," + 0.15*blockh + ")")
			.text($.i18n.prop("axis-values"))
			.style("font-size", autofontsize + "px");

		var tjbchart = tjbmain.append("g").on("mousemove", mousemove)
			.on("mouseout", function () {
				d3.select(".tips").style("display", "none");
			});//监听用

		//堆叠柱形
		var tjbbarwidth = tjbx.bandwidth() / 2; 
		var y1bars = tjbchart.selectAll(".barRect")
			.data(tjbdata)    //绑定数据
			.enter().append("g")    //创建缺少的页面元素
			.attr('class', 'barRect');

		y1bars.append("rect")
			.attr('class', 'bar1-rect')
			.attr("width", tjbbarwidth)   //长方形的宽度,要计算todo
			.attr("y", function (d) {
				return tjby1pos.y + tjby1(d.reward_sum);      //使用比例尺确定坐标Y值
			})
			.attr("x", function (d) {
				return tjby1pos.x + tjbx(d.date) + 0.5 * tjbbarwidth;   //使用比例尺确定坐标X值，让tick与柱对齐，偏移一定量
			})
			.attr("height", function (d) {   //条形的高度
				return tjby1pos.height - tjby1(d.reward_sum);
			});
		//2019.5.24改为折线

			
		//y3坐标轴:交易数量，折线
		var tjby3pos = {
			"height": tjby1pos.height,
			"x": svgw - 0.4 * blockw, //定位x tjbmainsvgpos.left + 0.12 * blockw
			"y": 0.22 * blockh //定位y
		}
		var tjby3 = d3.scaleLinear()
			.range([0, tjby3pos.height])
			.domain([d3.max(newtjdata_y3line), 0]);
		var tjby3Axis = d3.axisRight(tjby3)       //新建一个默认的坐标轴
			.ticks(5)
			.tickFormat(function (d) {    //自定义刻度文字格式
				if (d >= 1000) {
					return (d / 1000).toFixed(1) + "K";
				} else {
					return d;
				}
			});
		tjbmain.append("g")
			.attr("class", "axis tjby3")
			.attr("transform", "translate(" + tjby3pos.x + "," + tjby3pos.y + ")")
			.call(tjby3Axis).selectAll("text")
			.style("font-size", 0.7 * autofontsize + "px");

		tjbmain.append("text")
			.attr("transform", "translate(" + (tjby3pos.x-0.36*blockw) + "," + 0.15 * blockh + ")")
			.text($.i18n.prop("axis-txs"))
			.style("font-size", autofontsize + "px");

		var line3 = d3.line()
			.x(function (d) { return tjby1pos.x + tjbx(d.date) + 1 * tjbbarwidth; })
			.y(function (d) { return tjby1pos.y + tjby3(d.transaction_count); });
		// //添加折线
		var y3line = tjbchart.append("g").append("path").attr("d", line3(tjbdata)).attr("class", "line3-rect").style("stroke-width", 0.01*blockw);
		// console.log(0.01*blockw);
		var y3circle = tjbchart.selectAll("circle .tjby3-line").data(tjbdata).enter().append("circle").attr("class", "tjby3-line").attr("cx", function (d) {
			return tjby1pos.x + tjbx(d.date) + 1 * tjbbarwidth;
		}).attr("cy", function (d) {
			return tjby1pos.y + tjby3(d.transaction_count);
		}).attr("r", 0.018*blockw).attr("class", "line3-text");


		//tips显示组合
		var tips = tjbchart.append('g').attr('class', 'tips').style("display", "none");

		tips.append('rect')
			.attr('class', 'tips-border')
			.attr('width', 1.16 * blockw)
			.attr('height', 0.325 * blockh)
			.attr('rx', 10)
			.attr('ry', 10);

		var tipswording0 = tips.append('text')//date
			.attr('class', 'tips-text blocktextblack')
			.attr('x', autofontsize)
			.attr('y', 0.06 * blockh)
			.text('')
			.style("font-size", autofontsize + "px");

		// tips.append('text')
		// 	.attr('class', 'tips-text bar1-rect')
		// 	.attr('x', 0.7 * autofontsize)
		// 	.attr('y', 0.13 * blockh)
		// 	.text('■')
		// 	.style("font-size", autofontsize + "px");

		var tipswording11 = tips.append('text') //
			.attr('class', 'tips-text blocktextblack')
			.attr('x', autofontsize)
			.attr('y', 0.13 * blockh)
			.text('')
			.style("font-size", autofontsize + "px");

		// tips.append('text')
		// 	.attr('class', 'tips-text bar2-rect')
		// 	.attr('x', 0.7 * autofontsize)
		// 	.attr('y', 0.21 * blockh)
		// 	.text('■')
		// 	.style("font-size", autofontsize + "px");
		var tipswording22 = tips.append('text')//
			.attr('class', 'tips-text blocktextblack')
			.attr('x', autofontsize)
			.attr('y', 0.21 * blockh)
			.text('')
			.style("font-size", autofontsize + "px");

	// var tipswording33 = tips.append('text')//
	// 		.attr('class', 'tips-text blocktextblack')
	// 		.attr('x', autofontsize)
	// 		.attr('y', 0.29 * blockh)
	// 		.text('')
	// 		.style("font-size", autofontsize + "px");

		// tips.append('text')
		// 	.attr('class', 'tips-text line3-text')
		// 	.attr('x', 0.7 * autofontsize)
		// 	.attr('y', 0.29 * blockh)
		// 	.text('━')
		// 	.style("font-size", autofontsize + "px");

		var tipswording44 = tips.append('text')//
			.attr('class', 'tips-text blocktextblack')
			.attr('x', autofontsize)
			.attr('y', 0.29 * blockh)
			.text('')
			.style("font-size", autofontsize + "px");

		//鼠标移入，移动，移出 监听，出现虚线、提示框
		/* 当鼠标在图形内滑动时调用 */
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
			var index = Math.round((mouseX - tjby1pos.x - tjbbarwidth) / tjbx.step());
			var index1=tjbdata.length - index-1;
			index1=Math.max(0,index1);
			index1=Math.min(tjbdata.length-1,index1);

			var mouseData = tjbdata[index1];//日期反转

			tipswording0.text($.i18n.prop("axis-date") + ": " + cnen_timeformaterShort(mouseData.dateTime))
				.style("font-size", autofontsize + "px");
			tipswording11.text($.i18n.prop("g-reward") + ": " + mouseData.reward_sum + " SLU")
				.style("font-size", autofontsize + "px");
			tipswording22.text($.i18n.prop("g-block") + ": " + mouseData.reward_sum)
				.style("font-size", autofontsize + "px");	
			// tipswording33.text($.i18n.prop("g-txfee_sum") + ": " + mouseData.txfee_sum + " SLU")
			// 	.style("font-size", autofontsize + "px");
			tipswording44.text($.i18n.prop("g-transaction_count") + ": " + mouseData.transaction_count)
				.style("font-size", autofontsize + "px");

			// if (mouseX < 2 * svgw / 3) {
			// 	d3.select(".tips")
			// 		.attr('transform', 'translate(' + mouseX + ',' + mouseY + ')')
			// 		.style('display', 'block');
			// } else {
			// 	d3.select(".tips")
			// 		.attr('transform', 'translate(' + (mouseX - 1.7 * blockw) + ',' + mouseY + ')')
			// 		.style('display', 'block');
			// }
			//显示框不要被遮住
            if (mouseX > 0.8 * svgw && mouseY > 0.85 * svgh){
                d3.select(".tips")
                    .attr('transform', 'translate(' + (mouseX-0.18 * svgw) + ',' + (mouseY-0.2 * svgh) + ')')
                    .style('display', 'block');
            } else if(mouseX > 0.8 * svgw){
                d3.select(".tips")
                    .attr('transform', 'translate(' + (mouseX-0.18 * svgw) + ',' + mouseY + ')')
                    .style('display', 'block');
            }else if(mouseY > 0.85 * svgh) {
                d3.select(".tips")
                    .attr('transform', 'translate(' + (mouseX+0.01 * svgw)+ ',' + (mouseY-0.2 * svgh) + ')')
                    .style('display', 'block');
            }else{
                d3.select(".tips")
                    .attr('transform', 'translate(' + (mouseX+0.01 * svgw) + ',' + (mouseY+0.01*svgh) + ')')
                    .style('display', 'block');
            }
		}

	}

	var frontRectPos = {  //拖选区前景位置
		x: tjbxpos.x,
		y: tjbxpos.y + 0.2 * blockh,
		width: tjbxpos.width,
		height: 0.05 * blockh,
		leftbtnOffset: 0,  //左边拖选位置，拖选结束后更新，下次拖选时应去掉
		rightbtnOffset: 0  //右边拖选位置
	}
	var dragdata = {
		startDate: "",
		endDate: "",
		maxcount: 0
	}
	function createdragsele(tjbdata) {
		dragdata.maxcount = tjbdata.length;
		dragdata.endDate = tjbdata[0].date;
		dragdata.startDate = tjbdata[tjbdata.length - 1].date;
		//这个标尺用于所有数据
		var dragAlldata_date = [];//x轴，日期
		for (let index = tjbdata.length - 1; index >= 0; index--) {
			dragAlldata_date.push(tjbdata[index].date);
		}
		var dragScalBand = d3.scaleBand()
			.domain(dragAlldata_date)
			.range([0, tjbxpos.width]);

		//拖选区底色
		tjbmainsvg.append("g").append("rect")
			.attr('class', 'drag-rect-bg')
			.attr("width", frontRectPos.width)
			.attr("height", frontRectPos.height/2)
			.attr("y", frontRectPos.y+ 0.0125 * blockh)
			.attr("x", frontRectPos.x);
		//拖选区前景色
		var dragsele = tjbmainsvg.append("g").append("rect")
			.attr('class', 'drag-rect-fg')
			.attr("width", frontRectPos.width)
			.attr("height", frontRectPos.height/2)
			.attr("y", frontRectPos.y+ 0.0125 * blockh)
			.attr("x", frontRectPos.x);
		//拖选区左按钮
		var dragseleleft = tjbmainsvg.append("g").attr("class", "drag-rect-btn-cursor");
		dragseleleft.append("rect")
			.attr('class', 'drag-rect-btn')
			.attr("width", 0.05 * blockw) 
			.attr("height", 0.05 * blockh)
			.attr("y", tjbxpos.y + 0.2 * blockh)
			.attr("x", tjbxpos.x);
		dragseleleft.append("line")
			.attr('class', 'drag-rect-btn-line')
			.attr("stroke-width", 0.005 * blockh)
			.attr("x1", tjbxpos.x)
			.attr("y1", tjbxpos.y + (0.2 + 0.015) * blockh)
			.attr("x2", tjbxpos.x + 0.05 * blockw)
			.attr("y2", tjbxpos.y + (0.2 + 0.015) * blockh);
		dragseleleft.append("line")
			.attr('class', 'drag-rect-btn-line')
			.attr("stroke-width", 0.005 * blockh)
			.attr("x1", tjbxpos.x)
			.attr("y1", tjbxpos.y + (0.2 + 0.03) * blockh)
			.attr("x2", tjbxpos.x + 0.05 * blockw)
			.attr("y2", tjbxpos.y + (0.2 + 0.03) * blockh);
		dragseleleft.call(d3.drag().on("drag", dragleft).on("end", dragleftend));

		function dragleft(d) {
			var offsetX = d3.event.x - tjbxpos.x;
			offsetX = Math.max(0, offsetX); //不能拖出左边
			offsetX = Math.min(tjbxpos.width - 0.1 * blockw, offsetX);//不能拖出最右边
			d3.select(this).attr('transform', "translate(" + offsetX + ',0)');
			//改变前景色的x位置
			dragsele.attr("x", tjbxpos.x + offsetX)
				.attr("width", frontRectPos.width + frontRectPos.leftbtnOffset - offsetX);

			dragtipstext.text(databymousex(d3.event.x));
			d3.select(".dragtips")
				.attr('transform', 'translate(' + d3.event.x + ',' + d3.event.y + ')')
				.style('display', 'block');
		}
		function dragleftend(d) {
			var offsetX = d3.event.x - tjbxpos.x;
			// console.log(d3.event.x );
			// console.log(tjbxpos.x );

			offsetX = Math.max(0, offsetX); //不能拖出左边
			offsetX = Math.min(tjbxpos.width - 0.1 * blockw, offsetX);//不能拖出最右边

			var oldleftbtnOffset = frontRectPos.leftbtnOffset;
			frontRectPos.leftbtnOffset = offsetX;
			frontRectPos.width = frontRectPos.width + oldleftbtnOffset - frontRectPos.leftbtnOffset;
			// console.log(frontRectPos);
			dragdata.startDate = databymousex(d3.event.x);
			// console.log(dragdata);
			d3.select(".dragtips")
			.style('display', 'none');
			
			refreshtjbsvg();//重画统计图
		}

		//拖选区右按钮
		var dragseleright = tjbmainsvg.append("g").attr("class", "drag-rect-btn-cursor");
		dragseleright.append("rect")
			.attr('class', 'drag-rect-btn')
			.attr("width", 0.05 * blockw)
			.attr("height", 0.05 * blockh)
			.attr("y", tjbxpos.y + 0.2 * blockh)
			.attr("x", tjbxpos.x + tjbxpos.width - 0.05 * blockw);
		dragseleright.append("line")
			.attr('class', 'drag-rect-btn-line')
			.attr("stroke-width", 0.005 * blockh)
			.attr("x1", tjbxpos.x + tjbxpos.width - 0.05 * blockw)
			.attr("y1", tjbxpos.y + (0.2 + 0.015) * blockh)
			.attr("x2", tjbxpos.x + 0.05 * blockw + tjbxpos.width - 0.05 * blockw)
			.attr("y2", tjbxpos.y + (0.2 + 0.015) * blockh);
		dragseleright.append("line")
			.attr('class', 'drag-rect-btn-line')
			.attr("stroke-width", 0.005 * blockh)
			.attr("x1", tjbxpos.x + tjbxpos.width - 0.05 * blockw)
			.attr("y1", tjbxpos.y + (0.2 + 0.03) * blockh)
			.attr("x2", tjbxpos.x + 0.05 * blockw + tjbxpos.width - 0.05 * blockw)
			.attr("y2", tjbxpos.y + (0.2 + 0.03) * blockh);
		dragseleright.call(d3.drag().on("drag", dragright).on("end", dragrightend));

		function dragright(d) {
			var offsetX = d3.event.x - tjbxpos.width - tjbxpos.x;
			offsetX = Math.min(0, offsetX); //不能拖出右边
			offsetX = Math.max(0 - tjbxpos.width + 0.1 * blockw, offsetX);//不能拖出最左边
			d3.select(this).attr('transform', "translate(" + offsetX + ',0)');
			//改变前景色的x位置
			dragsele.attr("width", frontRectPos.width - frontRectPos.rightbtnOffset + offsetX);

			dragtipstext.text(databymousex(d3.event.x));
			d3.select(".dragtips")
				.attr('transform', 'translate(' + (d3.event.x-blockw) + ',' + d3.event.y + ')')
				.style('display', 'block');
		}
		function dragrightend(d) {
			var offsetX = d3.event.x - tjbxpos.width - tjbxpos.x;
			offsetX = Math.min(0, offsetX); //不能拖出右边
			offsetX = Math.max(0 - tjbxpos.width + 0.1 * blockw, offsetX);//不能拖出最左边

			var oldrightbtnOffset = frontRectPos.rightbtnOffset;
			frontRectPos.rightbtnOffset = offsetX;
			frontRectPos.width = frontRectPos.width - oldrightbtnOffset + frontRectPos.rightbtnOffset;
			// console.log(frontRectPos);
			dragdata.endDate = databymousex(d3.event.x);
			// console.log(dragdata);

			d3.select(".dragtips")
				.style('display', 'none');

			refreshtjbsvg();//重画统计图
		}

		//tips显示组合
		var dragtips = tjbmainsvg.append('g').attr('class', 'dragtips').style("display", "none");
		dragtips.append('rect')
			.attr('class', 'tips-border')
			.attr('width', 0.65 * blockw)
			.attr('height', 0.1 * blockh)
			.attr('x', 2 * autofontsize)
			.attr('y', -0.11 * blockh)
			.attr('rx', 10)
			.attr('ry', 10);
		var dragtipstext = dragtips.append('text')
			.attr('class', 'tips-text blocktextblack')
			.attr('x', 3 * autofontsize)
			.attr('y', -0.05 * blockh)
			.text('')
			.style("font-size", autofontsize + "px");


		//通过鼠标位置，返回日期
		function databymousex(mousex) {
			//计算停留位置的日期
			var index = Math.round((mousex + padding.left + 0.05 * blockw - frontRectPos.x) / dragScalBand.step());
			index = Math.max(0, index);
			index = Math.min(index, dragdata.maxcount - 1);
			var mouseData = tjbdata[tjbdata.length - index - 1];//日期反转
			// console.log(mouseData);
			return mouseData.date;
		}

		function refreshtjbsvg(){
			// console.log(dragdata);
			//dragAlldata_date日期从旧到新，tjbdata从新到旧
			var iLeftindex = d3.bisectLeft(dragAlldata_date,dragdata.startDate);//返回索引值
			iLeftindex=dragAlldata_date.length-iLeftindex-1;//索引反转一下
			var iRightindex = d3.bisectLeft(dragAlldata_date,dragdata.endDate);
			iRightindex=dragAlldata_date.length-iRightindex-1;
			//生成新的数据
			var newdata=tjbdata.filter(function(d,i){
				if (i>=iRightindex && i<=iLeftindex){
					return true;
				}else{
					return false;
				}
			});
			
			// console.log(newdata);
			createtjbsvg(newdata);
		}
	}
});