var svgw = document.body.clientWidth;
var autofontsize = 0.01 * svgw;
var footer_temp_1=0.015*svgw;
var tempstr="<div class='footer footerpadding' style='margin-top:"+footer_temp_1+"px'>";
tempstr=tempstr+"	<div class='col-xs-12' style='font-size:"+0.75*autofontsize+"px;";
var footer_temp_2=0.002*svgw;
tempstr=tempstr+"padding-top:"+footer_temp_2+"px;"+'padding-bottom:'+footer_temp_2+"px'>CSUVis Team</div></div>";
document.writeln(tempstr);