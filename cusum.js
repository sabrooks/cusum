var margin = {top: 10, right: 20, bottom: 20, left: 50},
  width = 960 - margin.left - margin.right,
  height = 100 - margin.top - margin.bottom;

var y = d3.scaleLinear()
  .range([height, 0]);

var startDate = new Date(2011, 10, 0);

var colors = d3.scaleLinear()
  .range(["#d01c8b", "#f7f7f7", "#f7f7f7", "#4dac26"]);

d3.json("forecast.json", function(error, data){
  if (error) throw error;

  data.forEach(function (d){
    d.date = d3.isoParse(d.date);
    d.saved = d.energy - d.pred;
    d.yr = d3.timeYear.count(startDate,d.date);
  })

  var performance = data.filter(d => d.date > startDate);

  var ribbonData = ribbons(performance);  // nested data by year and band


  colors
    .domain([-3, 0, 0, 3]); // Hardwires domain [-3...3]

  var maxRange = d3.extent(performance, d => Math.abs(d.energy));

  var legendValues = [...d3.range(-3, 0), ...d3.range(1,4)]; //Hardwire legend values

  var xLegend = d3.scaleLinear()
      .range([-maxRange, maxRange])
      .domain([0, 24*legendValues.length]);

  var legend = d3.select(".leg")
    .append("svg")
      .attr("class", "legend")
      .attr("width", width + margin.left + margin.right)
      .attr("height", 50)
    .append("g")
      .attr("transform", `translate(${margin.left}, 10)`);

  legend.append("text")
    .attr("class", "caption")
    .attr("y", -2)
    .text("Efficiency");

  legend.selectAll("rect")
      .data(legendValues)
    .enter().append("rect")
      .attr("x", (d,i) => i * 24)
      .attr("width", 24 -3)
      .attr("height", 24 -3)
      .attr("fill", d => colors(d));

  legend.call(d3.axisBottom(xLegend));

  var svg = d3.select(".yrs").selectAll("svg")
      .data(ribbonData)
    .enter().append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

  var yrRib = svg.selectAll("g")
      .data(d => d.values)
     .enter().append("g")
     .each(yrRibPlot);

});


var yrRibPlot = function(data){

  var plot = d3.select(this);

  var x = d3.scaleTime()
  .range([0, width])
  .domain(d3.extent(data.values, d => d.date));

  var xAxis = d3.axisBottom(x);

  var area = d3.area()
      .curve(d3.curveMonotoneX)
      .x(d => x(d.date))
      .y1(d => y(d.value))
      .y0(y(0));

  plot.append("path")
      .attr("class", "area")
      .attr("fill", d => colors(d.key))
      .attr("d", d => area(d.values));

  plot.append("g")
    .attr("transform", `translate(0, ${height})`)
    .attr("class", "y axis")
    .call(xAxis)

}

var ribbons = function(df){
  // return a nest
  // energy value [0,1]
  var ribbons = d3.range(1,4);  //[1,...,3];
  var result = [];
  var scaleRibbon = d3.scaleLinear()
      .domain([0, d3.max(df, d => Math.abs(d.energy))])
      .clamp(true);
  var numBands = d3.max(ribbons, d => Math.abs(d));
  var bandOffset = d3.max(df, d => Math.abs(d.energy));



  //Calculate bandData
  df.forEach(function(row){
    ribbons.forEach(function(r){
      result.push({band:r, date: row.date, yr: row.yr, value:scaleRibbon(row.energy *numBands - bandOffset * (Math.abs(r) - 1))});//positive ribbons
      result.push({band:-1*r, date: row.date, yr: row.yr, value:scaleRibbon(-1*row.energy *numBands - bandOffset * (Math.abs(r) - 1))});//positive ribbons
    })
  });

  //
  return d3.nest()
      .key(d => d.yr)
      .key(d => d.band)
      .entries(result);
}
