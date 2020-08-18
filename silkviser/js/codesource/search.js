$(function () {
	$('#searchkeys').bind('keypress', function (event) {
		if (event.keyCode == 13) {
			$("#searchbtn").click();
		}
	});
	$("#searchbtn").click(function () {
		var keys = $("#searchkeys").val();
		keys = $.trim(keys);
		if ("" != keys) {// keys不为空
			//先判断是否区块高度，特征：整数
			if (keys.length < 10) {
				try {
					var height = parseInt(keys);
					if (height) {
						var heighturl = weburl + "/block-index/" + height;
						$.ajax({
							type: "get",
							async: false, // 同步请求
							url: heighturl,
							success: function (result) {
								if (result.blockHash) {//判断通过高度取回了hash
									top.location.href = "/block/blockhash.html?hash=" + result.blockHash;
								} else {
									showerror();
								}
							},
							error: function (err) {
								showerror();
							}
						});
					} else {
						showerror();
					}
				} catch (err) {
					showerror();
				}
			} else {
				searchStep2(keys);//判断是否地址，SL开头，36位
			}
		} else {
			$("#searchkeys").tips({
				side: 1,
				msg: "Can not be empty / 不能为空",
				bg: '#FF5080',
				time: 5
			});
		}
	});

	//address 判断是否地址，SL开头，36位
	function searchStep2(data) {
		console.log("step2");
		try {
			if (data.length == 36 && data.substr(0, 2) == "SL") {
				var addrurl = weburl + "/addr/" + data + "?noTxList=1";
				$.ajax({
					type: "get",
					async: false, // 同步请求
					url: addrurl,
					success: function (result) {
						if (result.addrStr) {//判断通过地址取回了数据
							top.location.href = "/address/addr.html?addr=" + result.addrStr;
						} else {
							searchStep3(data);
						}
					},
					error: function (err) {
						searchStep3(data);
					}
				});
			} else {
				searchStep3(data);//区块哈希或交易编号，查询后才知
			}
		} catch (err) {
			searchStep3(data);//区块哈希或交易编号，查询后才知
		}

	}

	//blockhash
	function searchStep3(data) {
		console.log("step3");
		try {
			if (data.length == 64) {
				//先试是否区块
				var blockurl = weburl + "/block/" + data;
				$.ajax({
					type: "get",
					async: false, // 同步请求
					url: blockurl,
					success: function (result) {
						if (result.hash) {//判断通过地址取回了数据
							top.location.href = "/block/blockhash.html?hash=" + result.hash;
						} else {
							searchStep4(data);//Txid
						}
					},
					error: function (err) {
						searchStep4(data);//Txid
					}
				});
			} else {
				searchStep5(data);//Token
			}
		} catch (err) {
			searchStep4(data);//Txid
		}
	}

	//txid
	function searchStep4(data) {
		console.log("step4");
		try {
			if (data.length == 64) {
				var txidurl = weburl + "/tx/" + data;
				$.ajax({
					type: "get",
					async: false, // 同步请求
					url: txidurl,
					success: function (result) {
						if (result.txid) {//判断通过地址取回了数据
							top.location.href = "/transaction/txid.html?txid=" + result.txid;
						} else {
							searchStep5(data);//Token
						}
					},
					error: function (err) {
						searchStep5(data);//Token
					}
				});
			} else {
				searchStep5(data);//Token
			}
		} catch (err) {
			searchStep5(data);//Token
		}
	}

	//token 合约是40位
	function searchStep5(data) {
		console.log("step5");
		try {
			if (data.length == 40) {
				var tokenurl = weburl + "/src20/" + data;
				$.ajax({
					type: "get",
					async: false, // 同步请求
					url: tokenurl,
					success: function (result) {
						if (result.contract_address) {//判断通过地址取回了数据
							top.location.href = "/token/token.html?contract_address=" + result.contract_address;
						} else {
							showerror();
						}
					},
					error: function (err) {
						showerror();
					}
				});
			} else {
				showerror();
			}
		} catch (err) {
			showerror();
		}
	}

	function showerror(){
		//出错显示
		var message = 'No result.';
		// console.log(encodeURIComponent(info));
		top.location.href = "/info.html?message=" + encodeURIComponent(message);
	}

	//	$("#Tokensearchkeys").bsSuggest({
	//        emptyTip: '未检索到匹配的数据',
	//        allowNoKeyword: false,   //是否允许无关键字时请求数据。为 false 则无输入时不执行过滤请求
	//        multiWord: true,         //以分隔符号分割的多关键字支持
	//        separator: ",",          //多关键字支持时的分隔符，默认为空格
	//        getDataMethod: "url",    //获取数据的方式，总是从 URL 获取
	//        url: 'http://unionsug.baidu.com/su?p=3&wd=', //优先从url ajax 请求 json 帮助数据，注意最后一个参数为关键字请求参数
	//        jsonp: 'cb',                        //如果从 url 获取数据，并且需要跨域，则该参数必须设置
	//        fnProcessData: function (json) {    // url 获取数据时，对数据的处理，作为 fnGetData 的回调函数
	//            var index, len, data = {value: []};
	//            if (!json || !json.s || json.s.length === 0) {
	//                return false;
	//            }
	//
	//            len = json.s.length;
	//
	//            for (index = 0; index < len; index++) {
	//                data.value.push({
	//                    word: json.s[index]
	//                });
	//            }
	//            data.defaults = 'baidu';
	//
	//            //字符串转化为 js 对象
	//            return data;
	//        }
	//    }).on('onDataRequestSuccess', function (e, result) {
	//        console.log('onDataRequestSuccess: ', result);
	//    }).on('onSetSelectValue', function (e, keyword, data) {
	//        console.log('onSetSelectValue: ', keyword, data);
	//    }).on('onUnsetSelectValue', function () {
	//        console.log("onUnsetSelectValue");
	//    });

	$('#Tokensearchkeys').bind('keypress', function (event) {
		if (event.keyCode == 13) {
			$("#Tokensearchbtn").click();
		}
	});
	$("#Tokensearchbtn").click(function () {
		var keys = $("#Tokensearchkeys").val();
		keys = $.trim(keys);
		if ("" != keys) {// keys不为空
			$.ajax({
				type: "post",
				async: true, // 异步请求
				url: webrootPath + "/tokensearch",
				data: {
					"keys": keys
				},
				success: function (result) {
					if ("errors" == result.url) {
						$("#Tokensearchkeys").tips({
							side: 1,
							msg: "No results / 没有查询结果",
							bg: '#FF5080',
							time: 5
						});
					} else if (result.url !== null && result.url !== undefined && result.url !== '') {//导航
						window.location.href = webrootPath + "/" + result.url;
					} else {//展现查询列表
						var allshowstr = "<div class=\"row\"><div class=\"col-xs-12\">Search results:</div></div>";
						result.tokens.forEach(function (v, i, a) {
							var j = i + 1;
							var showstr = j + ". <a href=\"" + webrootPath + "/contract/" + v.contract_address +
								"\">" + v.symbol + ": " + v.name + " , Contract address:" + v.contract_address + "</div>";
							allshowstr = allshowstr + "<div class=\"row\"><div class=\"col-xs-offset-1 col-xs-10\">" +
								showstr + "</div></div>";
						});
						$("#serachresult").html(allshowstr);
					}
				},
				error: function (err) {
				}
			});
		} else {
			$("#Tokensearchkeys").tips({
				side: 1,
				msg: "Can not be empty  / 不能为空",
				bg: '#FF5080',
				time: 5
			});
		}
	});
});
