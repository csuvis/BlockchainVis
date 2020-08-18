// 指定某行宽度，文本自动缩小
/*
 * appendMultiText( container, //文本的容器，可以是<svg>或<g> str, //字符串 posX,
 * //文本的x坐标 posY, //文本的y坐标 width, //每一行的宽度，单位为像素 height,
 * //高度，自动居中，若不为0，则自动计算字体 fontsize align:left，center居左，居中 fontfamily
 * //文字的字体（可省略），默认为 simsun, arial )
 */
function appendLineText(container, str, posX, posY, width, height, fontsize,
		align, fontfamily) {

	if (arguments.length < 6) {
		height = 0;
	}
	if (arguments.length < 7) {
		fontsize = 0;
	}
	if (arguments.length < 8) {
		align = "left";
	}
	if (arguments.length < 9) {
		fontfamily = "simsun, arial";
	}

	var fontsizecal = 1.7 * width / getByteLen(str);// 计算

	if (fontsize > 0) {// 默认按指定，但如果超宽，就减小
		if (fontsize > fontsizecal) {
			fontsize = fontsizecal;
		}
	} else {
		fontsize = fontsizecal;// 求字体大小
	}

	if (height > 0) {
		if (height < fontsize) {
			fontsize = height;// 如果高度不够，减少字体
		} else {// 如果高度很高，文字居中
			var wordhfree = (height - fontsize) / 2;
			posY = posY + wordhfree;// 上下居中
		}
	}

	var lineText = container.append("text").attr("x", posX).attr("y", posY).attr("class","blocktext")
			.attr(
					"style",
					"font-family:" + fontfamily + "; font-size:" + fontsize
							+ "px;").text(str);
	if ('center' == align) {// 居中
		var centerx = width - (fontsize * getByteLen(str));
		lineText
				.attr('transform', "translate(" + 0.6 * centerx + ',' + 0 + ')')
	}

	return lineText;
}

// 根据宽、高最小的来计算，根据宽居中
function appendChainText(container, str, posX, posY, width, height) {
	var fontsize = 0;
	var fontfamily = "simsun, arial";

	var calwh = 0;// 计算标准
	if (width > height) {
		calwh = height;
	} else {
		calwh = width;
	}

	var fontsize = 1.6 * calwh / getByteLen(str);// 计算

//	var wordhfreey = 0.45*(height - fontsize);
//	posY = posY + wordhfreey;// 上下居中
	var wordhfreex = 0.32*(width - fontsize);
	posX = posX + wordhfreex;// 左右居中

	var lineText = container.append("text").attr("x", posX).attr("y", posY)
			.attr(
					"style",
					"font-family:" + fontfamily + "; font-size:" + fontsize
							+ "px;").text(str);
	return lineText;
}

// 计算宽度
function getByteLen(val) {// 汉字算2个
	var len = 0;
	for (var i = 0; i < val.length; i++) {
		var a = val.charAt(i);
		if (a.match(/[^\x00-\xff]/ig) != null) {
			len += 2;
		} else {
			len += 1;
		}
	}
	return len;
}
