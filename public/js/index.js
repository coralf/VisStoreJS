$(function () {
    // 创建地图实例
    var map;
    //所有店
    var pointCollect;
    //火锅店
    var pointHotCollect;
    //川菜店
    var pointScCollect;
    //小吃
    var pointSnackCollect;
    //面包甜点
    var pointDessertCollect;
    //快餐
    var pointFFCollect;
    //其他
    var pointOthCollect;
    //热力图
    var heatMap;
    //地图点的文字提示
    var pointLabel;
    //所有店的信息
    var data;


    /*用于控制圆圈是否被点击的状态*/
    var all_storeTag = false;
    var hot_tag = false;
    var scTag = false;
    var snackTag = false;
    var desertTag = false;
    var fastTag = false;
    var otherTag = false;


    !function () {
        requestStores();
    }();

    function init() {
        map = new BMap.Map("map");
        var point = new BMap.Point(104.75517, 31.46758);//定位绵阳的坐标
        map.centerAndZoom(point, 15);             // 初始化地图，设置中心点坐标和地图级别
        map.enableScrollWheelZoom(); // 允许滚轮缩放
        map.setMapStyle({ style: 'grayscale' });
        reqeustChartData();
    }


    /**
     * 请求所有的门店数据
     */
    function requestStores() {
        if (!stores) {
            $.ajax({
                url: 'index.php/index/index/getStores',
                type: 'GET',
                dataType: 'json',
                success: function (rep) {
                    data = rep;
                    init();
                },
                error: function (err) {
                    console.log(err);
                }
            });
        } else {
            data = stores;
            init();
        }
    }

    function drawHeat() {
        return drawCatHeat(null);
    }

    /**
     * 根据店的类型绘制热力图
     * @param catName
     */
    function drawCatHeat(catName) {
        var count = 50;
        var radius = 15;
        var max = 200;
        if (catName) {
            count = 100;
            radius = 15;
            max = 100;
        }
        if (document.createElement('canvas').getContext) {
            var heatPoints = [];
            for (var i in data) {
                //count=Math.floor(Math.random()*100+1);
                //console.log(count);
                var item = data[i];
                if (catName) {
                    if (item.cat_name == catName) {
                        heatPoints.push({ 'lng': item.x, 'lat': item.y, 'count': count });
                    }
                } else {
                    heatPoints.push({ 'lng': item.x, 'lat': item.y, 'count': count });
                }
            }
            var heatmapOverlay = new BMapLib.HeatmapOverlay({ "radius": radius });
            map.addOverlay(heatmapOverlay);
            heatmapOverlay.setDataSet({ data: heatPoints, max: max });
            heatMap = heatmapOverlay;
        }
    }


    function drawPoints() {
        return drawCatPoints(null, null);
    }

    /**
     * 根据店的类型绘制店的数据点
     * @param color
     * @param catName
     * @returns {BMap.PointCollection}
     */
    function drawCatPoints(color, catName) {
        if (!color) {
            color = '#ff534db2';
        }
        if (document.createElement("canvas").getContext) {
            var options = {
                size: BMAP_POINT_SIZE_NORMAL,
                shape: BMAP_POINT_SHAPE_CIRCLE,
                color: color
            };
            var points = [];
            for (var i in data) {
                var item = data[i];
                if (catName) {
                    if (catName == '其他') {
                        if (item.cat_name != '火锅' &&
                            item.cat_name != '川菜' &&
                            item.cat_name != '小吃面食' &&
                            item.cat_name != '面包甜点' &&
                            item.cat_name != '快餐简餐'
                        ) {
                            points.push(new BMap.Point(item.x, item.y));
                            continue;
                        }
                    }
                    if (item.cat_name == catName) {
                        points.push(new BMap.Point(item.x, item.y));
                    }
                } else {
                    points.push(new BMap.Point(item.x, item.y));
                }
            }
            var pointCollection = new BMap.PointCollection(points, options);

            pointCollection.addEventListener('mouseover', function (e) {
                if (pointLabel) {
                    map.removeOverlay(pointLabel);
                }
                var text = '';
                for (i in data) {
                    var item = data[i];
                    if (item.x == e.point.lng &&
                        item.y == e.point.lat
                    ) {
                        text = item.name;
                        break;
                    }
                }
                pointLabel = addLabel(e.point, text);
            });
            pointCollection.addEventListener('mouseout', function (e) {
                map.removeOverlay(pointLabel);
            });
            map.addOverlay(pointCollection);
            return pointCollection;
        }
    }


    /**
     * 请求图表的数据
     */
    function reqeustChartData() {
        if (!chartsData) {
            $.ajax({
                url: 'index.php/index/index/getBestMarkStoreMd',
                type: 'get',
                dataType: 'json',
                success: function (result) {
                    drawCharts(result);
                }
            });
        } else {
            drawCharts(chartsData);
        }
    }

    function drawCharts(result) {
        var storeTypeCount = result.storeTypeCount;
        var selected = {};
        var legendData = [];
        var seriesData = [];
        for (i in storeTypeCount) {
            var item = storeTypeCount[i];
            legendData.push(item.cat_name);
            seriesData.push({
                name: item.cat_name,
                value: item.count
            });
            if (i < 6) {
                selected[item.cat_name] = true;
            } else {
                selected[item.cat_name] = false;
            }
        }

        showPie(legendData, seriesData, selected);
        showLitterCir(storeTypeCount);
        var storeTop10 = result.storeTop10;
        var ydata = {};
        ydata.data = [];
        ydata.ids = [];
        var tstar = [];
        var ttast = [];
        var tenv = [];
        var tservice = [];
        for (i in storeTop10) {
            var item = storeTop10[storeTop10.length - 1 - i];
            ydata.data.push(item.name);
            ydata.ids.push(item.item_id);
            tstar.push(item.star);
            ttast.push(item.tast);
            tenv.push(item.environment);
            tservice.push(item.service)
        }
        showHit(ydata, tstar, ttast, tenv, tservice);
    }


    /**
     * 向圆圈里面渲染数据
     * @param storeTypeCount
     */
    function showLitterCir(storeTypeCount) {
        var other = 0;
        var all = 0;
        var hot = storeTypeCount[0].count;
        var sccuisine = storeTypeCount[1].count;
        var snack = storeTypeCount[2].count;
        var dessert = storeTypeCount[3].count;
        var fastFood = storeTypeCount[4].count;
        for (i in storeTypeCount) {
            var item = storeTypeCount[i];
            all += item.count;
        }
        other = all - hot - sccuisine - snack - dessert - fastFood;
        $("#all_store .circ div").text(all);
        $("#hot_plot_count .circ div").text(hot);
        $("#sccuisine .circ div").text(sccuisine);
        $("#snack .circ div").text(snack);
        $("#dessert .circ div").text(dessert);
        $("#fast_food .circ div").text(fastFood);
        $("#other .circ div").text(other);
    }

    /**
     * 饼图
     * @param legendData
     * @param seriesData
     * @param selected
     */
    function showPie(legendData, seriesData, selected) {
        var option = {
            title: {
                text: '绵阳各类饭店占比',
                x: 'center'
            },
            tooltip: {
                trigger: 'item',
                formatter: "{a} <br/>{b} : {c} ({d}%)"
            },
            legend: {
                type: 'scroll',
                orient: 'vertical',
                right: 10,
                top: 20,
                bottom: 20,
                data: legendData,
                selected: selected
            },
            series: [
                {
                    name: '店名',
                    type: 'pie',
                    radius: '55%',
                    center: ['40%', '50%'],
                    data: seriesData,
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }
            ]
        };
        var pie = echarts.init(document.getElementById('pie'));
        pie.setOption(option);
    }

    /**
     * 柱状图
     * @param ydata
     * @param tstar
     * @param ttast
     * @param tenv
     * @param tservice
     */
    function showHit(ydata, tstar, ttast, tenv, tservice) {
        var option = {
            title: {
                text: 'TOP 10'
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: {            // 坐标轴指示器，坐标轴触发有效
                    type: 'shadow'        // 默认为直线，可选为：'line' | 'shadow'
                }
            },
            legend: {
                data: ['店铺星级', '口味评分', '环境评分', '服务评分']
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '3%',
                containLabel: true
            },
            xAxis: {
                type: 'value'
            },
            yAxis: {
                type: 'category',
                data: ydata.data,
                ids: ydata.ids
            },
            series: [
                {
                    name: '店铺星级',
                    type: 'bar',
                    stack: '总量',
                    label: {
                        normal: {
                            show: true,
                            position: 'insideRight'
                        }
                    },
                    data: tstar
                },
                {
                    name: '口味评分',
                    type: 'bar',
                    stack: '总量',
                    label: {
                        normal: {
                            show: true,
                            position: 'insideRight'
                        }
                    },
                    data: ttast
                },
                {
                    name: '环境评分',
                    type: 'bar',
                    stack: '总量',
                    label: {
                        normal: {
                            show: true,
                            position: 'insideRight'
                        }
                    },
                    data: tenv
                },
                {
                    name: '服务评分',
                    type: 'bar',
                    stack: '总量',
                    label: {
                        normal: {
                            show: true,
                            position: 'insideRight'
                        }
                    },
                    data: tservice
                }
            ]
        };
        var ecmTime = echarts.init(document.getElementById("hit"));
        ecmTime.setOption(option);
        ecmTime.on('click', function (param) {
            var id = ydata.ids[param.dataIndex];
            var point;
            for (i in data) {
                var item = data[i];
                if (item.item_id == id) {
                    point = item;
                    break;
                }
            }
            var pt = new BMap.Point(point.x, point.y)
            map.centerAndZoom(pt, 17);
            var marker = new BMap.Marker(pt);  // 创建标注
            marker.setLabel(addLabel(pt, point.name));
            map.addOverlay(marker);
        });
    }

    /**
     * 改变圆圈被点击的状态
     * @param tag
     * @param ele
     * @returns {*}
     */
    function changeState(tag, ele) {
        if (!tag) {
            tag = true;
            $(ele).find('.circ').css('color', 'red');
        } else {
            tag = false;
            $(ele).find('.circ').css('color', 'black');
        }
        return tag;
    }

    /**
     * 设置文本标注
     * @param point
     * @param text
     * @returns {BMap.Label}
     */
    function addLabel(point, text) {
        var opts = {
            position: point,    // 指定文本标注所在的地理位置
            offset: new BMap.Size(30, -30)    //设置文本偏移量
        };
        var label = new BMap.Label(text, opts);  // 创建文本标注对象
        label.setStyle({
            color: "#333333",
            fontSize: "14px",
            fontFamily: "微软雅黑",
            padding: "5px",
            border: "1px solid #f2f2f2"
        });
        map.addOverlay(label);
        return label;
    }


    /**
     * 移除热力图
     */
    function removeAllHeat() {
        if (heatMap) {
            map.removeOverlay(heatMap);
        }
    }


    /**
     * 移除地图上面所有的点
     */
    function removeAllPoint() {
        if (pointCollect) {
            map.removeOverlay(pointCollect);
        }
        if (pointHotCollect) {
            map.removeOverlay(pointHotCollect);
        }
        if (pointScCollect) {
            map.removeOverlay(pointScCollect);
        }
        if (pointSnackCollect) {
            map.removeOverlay(pointSnackCollect);
        }
        if (pointDessertCollect) {
            map.removeOverlay(pointDessertCollect);
        }
        if (pointFFCollect) {
            map.removeOverlay(pointFFCollect);
        }
    }

    function showAll() {
        all_storeTag = changeState(all_storeTag,  $("#all_store").get(0));
        if (all_storeTag) {
            pointCollect = drawPoints();
        } else {
            map.removeOverlay(pointCollect);
        }
    }
    showAll();
    /****点击事件**/
    $("#all_store").click(function (e) {
        showAll();
    });


    $("#hot_plot_count").click(function (e) {
        removeAllHeat();
        hot_tag = changeState(hot_tag, this);
        if (pointCollect) {
            $('#all_store').find('.circ').css('color', 'black');
            all_storeTag = false;
            map.removeOverlay(pointCollect);
        }
        if (hot_tag) {
            pointHotCollect = drawCatPoints('#d53a35', '火锅');
        } else {
            map.removeOverlay(pointHotCollect);
        }
    });


    $("#sccuisine").click(function (e) {
        scTag = changeState(scTag, this);
        if (pointCollect) {
            $('#all_store').find('.circ').css('color', 'black');
            all_storeTag = false;
            map.removeOverlay(pointCollect);
        }
        if (scTag) {
            pointScCollect = drawCatPoints('#334b5c', '川菜');
        } else {
            map.removeOverlay(pointScCollect);
        }
    });


    $("#snack").click(function (e) {
        snackTag = changeState(snackTag, this);
        if (pointCollect) {
            $('#all_store').find('.circ').css('color', 'black');
            all_storeTag = false;
            map.removeOverlay(pointCollect);
        }
        if (snackTag) {
            pointSnackCollect = drawCatPoints('#6ab0bb', '小吃面食');
        } else {
            map.removeOverlay(pointSnackCollect);
        }
    });


    $("#dessert").click(function (e) {
        desertTag = changeState(desertTag, this);
        if (pointCollect) {
            $('#all_store').find('.circ').css('color', 'black');
            all_storeTag = false;
            map.removeOverlay(pointCollect);
        }
        if (desertTag) {
            pointDessertCollect = drawCatPoints('#e98f6f', '面包甜点');
        } else {
            map.removeOverlay(pointDessertCollect);
        }
    });


    $("#fast_food").click(function (e) {
        fastTag = changeState(fastTag, this);
        if (pointCollect) {
            $('#all_store').find('.circ').css('color', 'black');
            all_storeTag = false;
            map.removeOverlay(pointCollect);
        }
        if (fastTag) {
            pointFFCollect = drawCatPoints('#9fdabf', '快餐简餐');
        } else {
            map.removeOverlay(pointFFCollect);
        }
    });


    $("#other").click(function (e) {
        otherTag = changeState(otherTag, this);
        if (pointCollect) {
            $('#all_store').find('.circ').css('color', 'black');
            all_storeTag = false;
            map.removeOverlay(pointCollect);
        }
        if (otherTag) {
            pointOthCollect = drawCatPoints('#7fae90', '其他');
        } else {
            map.removeOverlay(pointOthCollect);
        }
    });

    //为地图获取鼠标滚轮事件
    $("#map").bind('mousewheel', function (e, dl) {
        var curZoom = map.getZoom();
        console.log('curZoom', curZoom);
        removeAllHeat();
        removeAllPoint();
        if (curZoom <= 15) {
            if (all_storeTag) {
                drawHeat();
            }
            if (hot_tag) {
                drawCatHeat('火锅');
            }
            if (scTag) {
                drawCatHeat('川菜');
            }
            if (snackTag) {
                drawCatHeat('小吃面食');
            }
            if (desertTag) {
                drawCatHeat('面包甜点');
            }
            if (fastTag) {
                drawCatHeat('快餐简餐');
            }
        } else {
            if (all_storeTag) {
                pointCollect = drawPoints();
            }
            if (hot_tag) {
                pointHotCollect = drawCatPoints('#d53a35', '火锅');
            }
            if (scTag) {
                pointScCollect = drawCatPoints('#334b5c', '川菜');
            }
            if (snackTag) {
                pointSnackCollect = drawCatPoints('#6ab0bb', '小吃面食');
            }
            if (desertTag) {
                pointDessertCollect = drawCatPoints('#e98f6f', '面包甜点');
            }
            if (fastTag) {
                pointFFCollect = drawCatPoints('#9fdabf', '快餐简餐');
            }
        }
    });

});