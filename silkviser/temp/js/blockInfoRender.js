'use strict'

//单个block页面的详细信息展示
function addblockDetail(blockHash,blockHeight,blockData,transData){
        var bdata = [];
        var tdata = [];
    var identifier = ''; 
    if(blockHeight && blockHash == ""){
        $('thead>tr .b-height').text('#'+blockHeight);
        // 找相应高度对应的那条数据，然后读其他值
        bdata = getTransforBlock(blockHeight,blockData);
        // console.log(bdata);

        $('tbody>tr .b-hash').text(bdata[0].hash);
        identifier = blockHeight;

    }else if(blockHash && blockHeight == 0){
        // console.log(blockHash);
        // 说明传入的不是高度，而是哈希值
        $('tbody>tr .b-hash').text(blockHash);

        // 找相应哈希值对应的那条数据，然后读其他值
        bdata = getTransforBlock(blockHash,blockData);
        
        // console.log(bdata);

        $('thead>tr .b-height').text('#'+bdata[0].height);
        identifier = blockHash;
    }  
    
    // 获取当前block包含的交易数据,填充大表格
    tdata = getTransforBlock(identifier,transData);
    console.log(tdata);
    $('tbody>tr .r-hash').text(bdata[0].merkleroot);
    $('tbody>tr .p-hash').text(bdata[0].previousblockhash);
    $('tbody>tr .version').text('0x'+parseInt(bdata[0].version).toString(16));
    $('tbody>tr .b-size').text(bdata[0].size/1000+" kB");
    // var main_chain = bdata[0].main_chain.substring(0,1).toUpperCase()+bdata[0].main_chain.substring(1);
    $('tbody>tr .b-p').text(bdata[0].main_chain);
    $('tbody>tr .b-time').text(unifyTime(bdata[0].time));
    $('tbody>tr .b-difficult').text(bdata[0].difficulty);
    $('tbody>tr .b-nonce').text(bdata[0].nonce);
    $('tbody>tr .b-confir').text(bdata[0].bits);//
    $('h5.t-num').text("交易数： " + bdata[0].transactions);
    $('tbody>tr .t-fee').text('0.'+bdata[0].fee +' BTC');//交易费格式
    //  var blockTFee = 0;
    // var length = tdata.length;
    // // console.log(tdata);
    // while(length--){
    //     addTrans();
    // }

    $(".panel-heading").each(function(i){
        var inRow = '<div class="row"><a href="#"><div class="col-xs-8 wordwrap"></div>' +
                 '</a><div class="col-xs-4"></div></div>';
        
        var length = tdata.length;
        console.log(length)
        for(var j=0;j<length;j++){
             $(this).append(inRow)
             // $(this).find('.col-xs-8').text(tdata[j].hash)
             // $(this).find('.col-xs-4').text(unifyTime(tdata[j].time));
         }
    });
    $('.col-xs-8').each(function(j){
            $(this).text((j+1)+'.'+tdata[j].hash);
        });
    $('.col-xs-4').each(function(j){
        $(this).text(unifyTime(tdata[j].time));
    });
    // $('.row').each(function(j){
    //     $(this).find('.col-xs-8').text(tdata[j].hash)
    //     $('.col-xs-4').text(unifyTime(tdata[j].time));
    // });
    // $(".panel-heading .col-xs-4").each(function(i){
    //     $(this).text(unifyTime(tdata[i].time));
    // });

// 分割线-----------铜钱glyph的代码---------------------------------------
    //目前这些部件的size和实际数值间的映射关系都是我随便定的
        for(var i=0;i<transData.length;i++){
            var aa=[],cc=[],dd=[],ee=[],special_num;
            var s1=(transData[i].size/2048.0).toFixed(3)
            aa.push(parseFloat(s1))
            var s2=1-s1
            aa.push(parseFloat(s2))
            // console.log(aa)
            var s3=(transData[i].fee*100).toFixed(2);
            var s4=transData[i].input_addrs.length;
            var s5=transData[i].output_addrs.length;
            cc.push(parseFloat(s3));
        var  gg=parseFloat(s3)+parseFloat(s4);//输入地址数必须考虑中间fee的大小，否则因为数量小将会被遮盖
            dd.push(gg);
        var  gg_1=parseFloat(s3)+parseFloat(s5);//输入地址数必须考虑中间fee的大小，否则因为数量小将会被遮盖
            ee.push(gg_1);
        special_num=transData[i].hash;
        // console.log(special_num);
        coin_glyph(aa,cc,dd,ee, (i).toString(),special_num);
        //debugger
        }
        // console.log(cc);
};

//绘制铜钱glyph的函数       
function coin_glyph(d_size,d_fee,d_in_addres,d_out_addres, num,special_num){
           
            var svg=d3.select('.coin_glyph')
                      .append("svg")
                      .attr('class','ring')
                      .attr('id', 'id' + num)
                      .attr('width','90px')
                      .attr('height','90px')
                      .attr('transform',function(d){
                            var s=Math.floor(Math.random()*100)+10
                            var b=Math.floor(Math.random()*200)+10
                            return "translate("+s+","+b+")";
                            //众多铜钱的位置为了使不重叠，用的随机分布位置
                        });
        
        //设置弧度生成器
            var arc=d3.svg.arc()
                    .innerRadius(30)
                    .outerRadius(40);
            // console.log(transData[0].fee);
            var pie=d3.layout.pie()
                        .value(function(d){return d;});
        //
var ring_1 = d3.select("#id" + num).append("g").attr('transform','translate('+42+','+42+')');
           
            ring_1.selectAll('path')
                .data(pie(d_size))
                .enter()
                .append("path")
                .attr("d",arc)
                .style("fill",function(d,i){return color(i);})
                .style('stroke','#d1ac78')
                .attr('stroke-width','1.5px');

                // console.log(d_size);
//输入输出地址数beijing圈
            var ring_2_data={
                x:['出','入'],
                y:[0.5,0.5]
            };
            var arc_2=d3.svg.arc()//innerRadius=fee
                    .innerRadius(d_fee)//由于fee太小，所以数值上放大100倍,不好处理
                    .outerRadius(30);
            var ring_2=ring_1.append('g')
                    .attr('class','ring_2');

             ring_2.append('circle')
                    .attr('r',30)
                    // .style('fill',function(d){
                    //    var defs = ring_2.append("defs");
                    //     var catpattern = defs.append("pattern")
                    //      .attr("id", "catpattern")
                    //                         .attr("height", 1)
                    //                         .attr("width", 1);
                    //     catpattern.append("image")
                    //                 .attr("x", 0)
                    //                 .attr("y", 0)
                    //                 .attr("width", 60)
                    //                 .attr("height", 60)
                    //                 .attr("xlink:href",'./images/2.png');

                    //     return 'url(#catpattern)';
                    // })
                    .style('fill','#dfbe91'); 

            ring_2.append('rect')
                    .attr('x',-1.5)
                    .attr('y',-30)
                    .attr('height',60)
                    .attr('width',3)
                    .style('fill','#d1ac78');

            // ring_2.selectAll("path")
            //         .data(pie(ring_2_data.y))
            //         .enter()
            //         .append('path')
            //         .attr('d',function(d){
            //         return arc_2(d);
            // })
            //         .style('fill','white')
            //         .style('stroke','#f5dc8a')
            //         .attr('stroke-width','2px');
               
            
//输入地址数
            var input_addrs=d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(d_in_addres)
                    .startAngle(0)
                    .endAngle(-Math.PI);
            var input_ring=ring_2.append('g')
                    .attr('class','input_ring');
            
            input_ring.selectAll("path")
                    .data(pie(d_in_addres))
                    .enter()
                    .append('path')
                    .attr('d',function(d){
                    return input_addrs(d);
            })
                    .style('fill','#d1ac78');
            input_ring.attr('transform','translate('+(-1.5)+','+'0)');
//输出地址数
            var out_addrs=d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(d_out_addres)
                    .startAngle(0)
                    .endAngle(Math.PI);
            var out_ring=ring_2.append('g')
                    .attr('class','out_ring')
                    .attr('transform','translate('+(1.5)+','+'0)');
            
            out_ring.selectAll("path")
                    .data(pie(d_out_addres))
                    .enter()
                    .append('path')
                    .attr('d',function(d){
                    return out_addrs(d);
            })
                    .style('fill','#d1ac78');
                    //中间的fee圈
                var fee=ring_2.append('g')
                        .attr('class','fee');

                fee.append('circle')
                            .attr('r',d_fee)
                            .style('fill','white')
                            .attr('class','fee');
            ring_2.selectAll("text")
                    .data(ring_2_data.x)
                    .enter()
                    .append("text")
                    .attr('class','text_')
                    .attr("dy", function() {
                    return 4;
                })
                    .text(function(d){
                        return d;
                    });
            ring_2.selectAll('text')
                    .data(pie(ring_2_data.y))
                    .attr("transform",function(d){return "translate("+arc_2.centroid(d)+")";})
                    .attr("text-anchor","middle")
                    .style("fill","white");

            svg.on('click',function(){
                 window.location.href="input_output.html?valus="+special_num;  

            });              
};
//-------------------绘制铜钱的函数ending，铜钱图代码结束-------------
function color(i) {
    var colornum = ['#d2ac77', '#FFFFFF'];
    return colornum[i % colornum.length];
};
// 从数据文件中获取某个block的具体数据，或其包含的交易数据
function getTransforBlock(identifier,data){
    var dtdata = [];
     for(var i=0; i<data.length;i++){
        // console.log(identifier)
            // 从trans数据提取某个block对应的几条交易信息，以高度为标识
            if(data[0].blockheight && data[i].blockheight == identifier){
                dtdata.push(data[i]);
            }else if(data[0].blockhash && data[i].blockhash == identifier){
            // 从trans数据提取某个block对应的几条交易信息，以hash为标识
                dtdata.push(data[i]);
            }else if(data[0].height && data[i].height== identifier){
                // 从block数据提取某条block信息，以高度为标识
                dtdata.push(data[i]);
            }else if(data[0].hash && data[i].hash == identifier){
                // 从block数据提取某条block信息，以hash为标识
                dtdata.push(data[i]);
            }
        
    }
    return dtdata;
};
function unifyTime(seconds){
    Date.prototype.toLocaleString = function() {
            var month = this.getMonth() + 1;
            month = month < 10 ? '0' + month : '' + month;
            var seconds = this.getSeconds();
            var minutes = this.getMinutes();
            seconds = seconds < 10 ? '0' + seconds : '' + seconds;
            minutes = minutes < 10 ? '0' + minutes : '' + minutes;
          return this.getFullYear() + "-" + month + "-" + this.getDate() + " " + this.getHours() + ":" + minutes + ":" + seconds;
    };
    var unixTimestamp = new Date(seconds * 1000);
    var commonTime = unixTimestamp.toLocaleString();
    return commonTime;
};
function argsTrans(blockheight,blockhash){
     if(window.localStorage){
            localStorage.bh = blockheight;
            localStorage.hash = blockhash;
            location.href = 'block-coin.html';
    }else{
            alert("not support");
    }
};
function addTrans(){
    var panel = '<div class="panel panel-default">' +
        '<div class="panel-heading">' +
            '<div class="row">' +
                '<div class="col-xs-8 wordwrap"><a href="#"></a></div>' +
                '<div class="col-xs-4"></div>' +
            '</div>' +
        '</div>' +
    '</div>';

    $('.container').append(panel);
};
