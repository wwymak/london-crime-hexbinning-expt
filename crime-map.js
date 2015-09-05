var width = 960,
    height = 500;

var svg = d3.select("#hexmap").append("svg").attr("width", width).attr("height", height);

var hexbin = d3.hexbin()
    .size([width, height])
    .radius(3)
    .x(function(d){return d.p0}).y(function(d){return d.p1});

var colorScale = d3.scale.linear()
    .range(['#FFFFB2', '#B10026'])
    .interpolate(d3.interpolateLab);

var categoryColors = d3.scale.category20c();

var hexBinnedData;
queue().defer(d3.json, "outer-london-topojson.json")
    .defer(d3.csv, "2015-06-crime-filtered.csv")
    .defer(d3.json, "crime-categories.json")
    .await(makeMyMap);

function groupByType(array){
    var newArr = [], categories = {};
    for(var i = 0; i< array.length; i++){
        var cur = array[i];
        var type = cur["Crime type"];
        if (!(type in categories)) {
            categories[type] = {type: type, count: 1};
        }
        categories[type].count += 1;
    }
    var keys =  Object.keys(categories);
    keys.forEach(function(d){
        newArr.push(categories[d])
    })
    return newArr;
}

function makeMyMap(err, topojsonData, crimeData, crimeCategories){

    var geoData = topojson.feature(topojsonData, topojsonData.objects["outer-london.geo"])//.features



    var projection = d3.geo.albers()
        .center([4.5, 51.5])
        .rotate([4.4, 0])
        .parallels([50, 60])
        .scale(50000)
        .translate([width / 2, height / 2]);

    var geopath = d3.geo.path().projection(projection);

    var boundary = topojson.mesh(topojsonData, topojsonData.objects["outer-london.geo"])

    svg.append("path").datum(boundary)
        .attr("class", "boundary")
        .attr("d", geopath);

    crimeData.forEach(function(d){
        var p = projection([d.Longitude, d.Latitude]);
        d.p0 = p[0];
        d.p1 = p[1];
    });

    var hexbinned = hexbin(crimeData);
    hexBinnedData = hexbinned;
    var crimeCatList = [];
    for (var i = 0; i< crimeCategories.length; i++){
        var item = crimeCategories[i]
        var temp = {};
        temp.name = item.name;
        temp.color = categoryColors(i)
            crimeCatList.push(temp);
    }
    crimeCategories.forEach(function(item){
        var temp = {};
        temp.name = item.name;
        temp.color =
        crimeCatList.push(item.name)
    });

    console.log(crimeCatList)

    var lengthArr = []
    hexbinned.forEach(function(d){
        lengthArr.push(d.length)
    });
    var maxNumber = d3.max(lengthArr);

    hexbinned.forEach(function(bin){
        bin.groupedData = groupByType(bin);
        var sorted = bin.groupedData.sort(function(a, b){
            return b.count - a.count;
        });
        bin.maxType = sorted[0].type;
        bin.maxCount = sorted[0].count;

    });

    console.log(hexbinned,  maxNumber)

    colorScale.domain([0, Math.sqrt(maxNumber)])

    svg.append("g")
        .attr("class", "hexagons")
        .selectAll("path")
        .data(hexbinned)
        .enter().append("path")
        .attr("d", function(d) { return hexbin.hexagon(); })
        .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
        //.style("fill", function(d) { return colorScale(Math.sqrt(d.length)); })
        .style("fill", function(d) {
            var crime = d.maxType;
            return crimeCatList.filter(function(a){
                return a.name == crime
            })[0].color; });
        //.style("opacity" ,0.8);


}