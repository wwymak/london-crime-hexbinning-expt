Basically trying to display london crime data as a hexbinned map, the color of each dot represents the most common crime in that area. Currently the data shows june2015

It makes use of the d3.hexbin plugin (https://github.com/d3/d3-plugins/tree/master/hexbin)
to bin the data into hexagons. The most predominanat crime in each hexagon then 
determines the color of that

Crime data from police.uk

Potential other Things to try: 

* hover over a point and it shows a (piechart?) pf the breakdown of distribution of crime in that area

* use a longer time interval

* overlay the hexbin on top of leaflet (?) allow zooming and panning

* show more time intervals/ try to use node(?) or something to hexbin the data server side (?) 
 currently it's massive just for 1 month...
 
 Caveats: it is an _experiment_ so there's lots of optimisations that I didn't do, e.g. window resize 
 handlers, a `reset projection` function so that the map scales with svg size, mouseover events etc
 
 

