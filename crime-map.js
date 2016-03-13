(function(){
    //svg dimensions
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

    //for assigning a color per crime cateogory
    var categoryColors = d3.scale.category20c();

    var hexBinnedData;

    //grab the london topojson to draw as well as the crime data
    queue().defer(d3.json, "outer-london-topojson.json")
        .defer(d3.csv, "2015-06-crime-filtered.csv")
        .defer(d3.json, "crime-categories.json")
        .await(makeMyMap);

  /**
   * basically, for each hexagon area, you have a series of data corresponding to
   * each individual  crime that happened in that time period
   * this groups them by their keys and counts how many of each category there is
   * @param array
   * @returns {Array} [{type:'robbery', count: 123454}, {type: 'knife crime', count: 123}...]
   */
  function groupByType(array){
    var newArr = [], categories = {};
    for(var i = 0; i< array.length; i++){
        var cur = array[i]; //current crime data info obj
        var type = cur["Crime type"];
        if (!(type in categories)) { //add new category if not in the cateogry info obj
            categories[type] = {type: type, count: 1};
        }
        categories[type].count += 1; //or if it's there increment count by 1
    }
    var keys =  Object.keys(categories);
    keys.forEach(function(d){
        newArr.push(categories[d])
    });
    return newArr;
}

    //draw the map after all data fetched
    function makeMyMap(err, topojsonData, crimeData, crimeCategories){

        var geoData = topojson.feature(topojsonData, topojsonData.objects["outer-london.geo"])
        //set the projection to center on london
        var projection = d3.geo.albers()
            .center([4.5, 51.5])
            .rotate([4.4, 0])
            .parallels([50, 60])
            .scale(50000)
            .translate([width / 2, height / 2]);

        var geopath = d3.geo.path().projection(projection);

        //draw the london boundary with geo.albers
        //this is more a guide to the eye than anything else to be honest
        var boundary = topojson.mesh(topojsonData, topojsonData.objects["outer-london.geo"])

        svg.append("path").datum(boundary)
            .attr("class", "boundary")
            .attr("d", geopath);

        //convert the lat and lngs of the crime data to svg coords
        crimeData.forEach(function(d){
            var p = projection([d.Longitude, d.Latitude]);
            d.p0 = p[0];
            d.p1 = p[1];
        });

        //bin the crime data into geo hexagons
        var hexbinned = hexbin(crimeData);
        hexBinnedData = hexbinned;
        var crimeCatList = [];
        for (var i = 0; i< crimeCategories.length; i++){
            var item = crimeCategories[i];
            var temp = {};
            temp.name = item.name;
            temp.color = categoryColors(i);
                crimeCatList.push(temp);
        }

        //this section is for finding out the max crime per binned
        //it's not used at the moment-- still figuring out what to do with it!
        var lengthArr = [];
        hexbinned.forEach(function(d){
            lengthArr.push(d.length)
        });
        var maxNumber = d3.max(lengthArr);

        //further process the hexbinned data-- finding out which crime is most dominant in each hexagon bin
        //also how many crimes there is
        hexbinned.forEach(function(bin){
            bin.groupedData = groupByType(bin);
            //reverse sort so the first item in the array correspond to the crime
            //category wiht most occurences in that bin
            var sorted = bin.groupedData.sort(function(a, b){
                return b.count - a.count;
            });
            bin.maxType = sorted[0].type;
            bin.maxCount = sorted[0].count;

        });

        //not really used at the moment-- haven't really figured out what to do with
        //this aspect of the data yet
        colorScale.domain([0, Math.sqrt(maxNumber)]);

        //add svg group, with class hexagon
        svg.append("g")
            .attr("class", "hexagons")
            //data bind the hexagonally binned data to the hexagon path
            .selectAll("path")
            .data(hexbinned)
            //draw the path
            .enter().append("path")
            //hexbin.hexagon returns the right path variable for hexagons for you
            .attr("d", function(d) { return hexbin.hexagon(); })
            .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
            //and the fill of each is the most predominant crime
            .style("fill", function(d) {
                var crime = d.maxType;
                return crimeCatList.filter(function(a){
                    return a.name == crime
                })[0].color; });

        //draw the color legend so you can identify which crime is most dominant in an area
      /**
       * basically append a legend with a color circle and the crime name...
       * @param color {String} hexcode/rgb/ etc -- valid css color variable
       * @param dataName {String} crime cateogry name
       */
        var drawLegendItem = function(color, dataName){
            var legendList = $("#mapLegend >ul");
            legendList.append('<li><div class="circle-div colorkey" style=background-color:' + color
                + ' id="' + dataName + '" ></div><span class="data-title">'
                + dataName + '</span></li>');
        };

        //draw the color legend
        crimeCatList.forEach(function(item){
            drawLegendItem(item.color, item.name);
        });


    }
})();