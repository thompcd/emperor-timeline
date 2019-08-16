
let x;
let y;
let dimensions;
const time = d => d.start;
const deathCause = d => d.cause;
const dynastyRule = d => d.dynasty;
let defaultFilter = time;

const title = d3.select("#title")
.append("text")
.text("LIFE OF THE EMPIRE")

const subtitle = d3.select("#subtitle")
.append("text")
.text("A visualization of the reign of the Roman Emperors")

var w = window,
d = document,
e = d.documentElement,
b = d.getElementsByTagName('body')[0],
width = w.innerWidth || e.clientWidth || b.clientWidth,
yHeight = w.innerHeight|| e.clientHeight|| b.clientHeight;

dimensions = {
  width: width,
  height: yHeight,
  margin: {
    top: 50,
    right: 10,
    bottom: 30,
    left: 30,
  },
}

dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

const svg = d3.select("#wrapper")
.append("div")
// Container class to make it responsive.
.classed("svg-container", true) 
.append("svg")
   // Responsive SVG needs these 2 attributes and no width and height attr.
.attr("preserveAspectRatio", "xMinYMin meet")
.attr("viewBox", `0 0 ${dimensions.width} ${dimensions.boundedHeight}`);

// d3.select("svg")
// .append("g")
// .attr("class", "annotation-group")
// .call(makeAnnotations)

const g = svg
.append("g")
  .attr("transform", (d,i)=>`translate(${dimensions.margin.left} ${dimensions.margin.top})`);

const line = svg.append("line")
.attr("y1", dimensions.margin.top-10)
.attr("y2", dimensions.boundedHeight-dimensions.margin.bottom)
.attr("stroke", "rgba(0,0,0,0.5)")
  .style("pointer-events","none");

drawChart(defaultFilter);

// handle on click event
d3.select('#opts')
  .on('change', function() {
    var filterType = eval(d3.select(this).property('value'));
    console.log(filterType);
    drawChart(filterType);
});

async function drawChart(sorting){
  const csv = await d3.csv("./emperors.csv")

  data = csv.map(d=>{
    return {
      ...d,
      start: new Date(d.start),
      end: new Date(d.end),
      birth: new Date(d.birth),
      death: new Date(d.death),
    }
    }).sort((a,b)=>  a.start-b.start);

  const dynasties = d3.nest().key(d=>d.dynasty).entries(data).map(d=>d.key)
  const dataByDeathCause = d3.nest().key(d=>d.deathcause).entries(data);
  const deathCauses = dataByDeathCause.map(d=>d.key)

  const namesAccessor = d => d.name

//Test font measurement
// var exampleFamilies = ["Helvetica", "Verdana", "Times New Roman", "Courier New"];
// var exampleSizes = [8, 10, 12, 16, 24, 36, 48, 96];
// for(var i = 0; i < exampleFamilies.length; i++) {
//   var family = exampleFamilies[i];
//   for(var j = 0; j < exampleSizes.length; j++) {
//     var size = exampleSizes[j] + "pt";
//     var style = "font-family: " + family + "; font-size: " + size + ";";
//     var pixelHeight = determineFontHeight(style);
//     console.log(family + " " + size + " ==> " + pixelHeight + " pixels high.");
//   }
// }

  x = d3.scaleTime()
    .domain([d3.min(data, d => d.start), d3.max(data, d => d.end)])
    .range([0, dimensions.boundedWidth])

  y= d3.scaleBand()
    .domain(d3.range(data.length))
    .range([0,dimensions.boundedHeight - dimensions.margin.bottom - dimensions.margin.top])
    .padding(0.2)

  const axisBottom = d3.axisBottom(x)
    .tickPadding(2)
    .ticks(d3.timeYear.every(15))

  const axisTop = d3.axisTop(x)
    .tickPadding(2)
    .ticks(d3.timeYear.every(15))

  const color = d3.scaleOrdinal(d3.schemeSet2).domain(dynasties)

  const exitTransition = d3.transition()
    .duration(600)

  const updateTransition = exitTransition.transition()
    .duration(600)

  let filteredData;

  if(sorting != "time") {
    filteredData = [].concat.apply([], dataByDeathCause.map(d=>d.values));
  } else { 
    filteredData = data.sort((a,b) => a.start-b.start);
  }

//   const type = d3.annotationLabel

// const annotations = data.map((d,i) => {
//   return {
//     note: {
//       label: d.annotation,
//     },
//     dx: x(d.end),
//     dy: y(i),
//     x: x(d.end),
//     y: y(i),
//     className: d.annotation == "" ? "hidden" : "",
//   }
// })

//   const makeAnnotations = d3.annotation()
//   .editMode(true)
//   .annotations(annotations)

  filteredData.forEach(d=> d.color = d3.color(color(d.name)))
  //console.table(filteredData)

  //   const WindowIsLargeEnoughForLabels = (dimensions.height > 600 ? true : false);
  // if (!WindowIsLargeEnoughForLabels){
  //   d3.select("#instructions")
  //     .append("text")
  //       .text("Hover to discover more.")
  // }

  const tooltip = d3.select("#wrapper")
  .append("div")
    .call(createTooltip)

  const groups = g.selectAll("g")
    .data(filteredData)
    .enter()
    .append("g")
      .attr("class", "name");

  groups.attr("transform", (d,i)=>`translate(0 ${y(i)})`)

  groups
  .each(getRect)
  .on("mouseover", function(d) {
    d3.select(this)
      .select("rect")
        .attr("fill", d.color.darker())

    let [x,y] = d3.mouse(this);
    //y -= 20;
    if(x>dimensions.width/2) x-= 100;

    tooltip
      .style("left", x + "px")
      .style("top", y + "px")

    tooltip
      .style("opacity", 1)
      .html(getTooltipContent(d))
  })
  .on("mouseleave", function(d) {
    d3.select(this).select("rect").attr("fill", d.color)
    tooltip
      .style("opacity", 0)
  })

  svg
    .append("g")
    .attr("transform", (d,i)=>`translate(${dimensions.margin.left} ${dimensions.margin.top-10})`)
    .call(axisTop)

  svg
    .append("g")
    .attr("transform", (d,i)=>`translate(${dimensions.margin.left} ${dimensions.boundedHeight-dimensions.margin.bottom})`)
    .call(axisBottom)

  svg
    .on("mousemove", function(d) {
    let [x,y] = d3.mouse(this);
    line.attr("transform", `translate(${x} 0)`);
  })


  const wrapper = d3.select("#wrapper")
  wrapper.append(svg.node());
  wrapper.groups = groups;

  // wrapper
  // .on("resize", function(d) {
  //   var tempRect = d3.select(".emperor-rect")

  //   console.log("on resize test")
  //   console.log(tempRect);
  // })

  const names = d3.selectAll(".name")

  names.data(filteredData, d=>d.name)
    .enter()
    .transition()
    .delay((d,i)=>i*10)
    .ease(d3.easeCubic)
    .attr("transform", (d,i)=>`translate(0 ${y(i)})`)
  }

getRect = function(d){
  const el = d3.select(this);
  const sx = x(d.start);
  const w = x(d.end) - x(d.start);
  const isLabelRight =(sx > dimensions.width/2 ? sx+w < dimensions.width : sx-w>0);
  const isLabelVisible = (y.bandwidth() > 6 ? true : false);
  
  el.style("cursor", "pointer")

  el
    .append("rect")
      .attr("x", sx)
      .attr("height", y.bandwidth())
      .attr("width", w)
      .attr("fill", d.color);

  el
    .append("text")
      .text(d.name)
      .attr("x",isLabelRight ? sx-5 : sx+w+5)
      .attr("y", -4)
      .attr("fill", "black")
      .style("text-anchor", isLabelRight ? "end" : "start")
      .style("display", isLabelVisible ? "" : "none")
      .style("font-family", "Playfair Display")
      .style("font-size", "9px")
      .style("dominant-baseline", "hanging");
}

createTooltip = function(el) {
  el
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("top", 0)
    .style("opacity", 0)
    .style("background", "white")
    .style("border-radius", "5px")
    .style("box-shadow", "0 0 10px rgba(0,0,0,.25)")
    .style("padding", "10px")
    .style("line-height", "1.3")
    .style("font", "11px AUGUSTUS")

  console.log("created tooltip")
}

getTooltipContent = function(d) {
  let startDate = d.start.getUTCFullYear();
  let startBcOrAd = startDate < 0 ? "BC" : "AD";
  let endDate = d.end.getUTCFullYear();
  let endBcOrAd = endDate < 0 ? "BC" : "AD";
  
  return `<b>${d.name}</b>
  <br/>
  <b style="color:${d.color.darker()}">${d.dynasty} dynasty</b>
  <br/>
  ${startDate} ${startBcOrAd} : ${endDate} ${endBcOrAd}
  `
  }

  /// Sample fontStyle: var style = "font-family: " + family + "; font-size: " + size + ";"; ///
  var determineFontHeight = function(fontStyle) {
    var body = document.getElementsByTagName("body")[0];
    var dummy = document.createElement("div");
    var dummyText = document.createTextNode("M");
    dummy.appendChild(dummyText);
    dummy.setAttribute("style", fontStyle);
    body.appendChild(dummy);
    var result = dummy.offsetHeight;
    body.removeChild(dummy);
    return result;
  };