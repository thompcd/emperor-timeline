
let x;
let y;
let dimensions;

drawChart();

async function drawChart(){
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
    
  const sorting = "time";
  //console.table(data)

  const dynasties = d3.nest().key(d=>d.dynasty).entries(data).map(d=>d.key)
  const dataByDeathCause = d3.nest().key(d=>d.deathcause).entries(data);
  const deathCauses = dataByDeathCause.map(d=>d.key)

  const namesAccessor = d => d.name
  const width = 1000

    dimensions = {
      width: width,
      height: width * 0.8,
      margin: {
        top: 30,
        right: 10,
        bottom: 30,
        left: 30,
      },
  }

  dimensions.boundedWidth = dimensions.width - dimensions.margin.left - dimensions.margin.right
  dimensions.boundedHeight = dimensions.height - dimensions.margin.top - dimensions.margin.bottom

  x = d3.scaleTime()
    .domain([d3.min(data, d => d.start), d3.max(data, d => d.end)])
    .range([0, dimensions.width - dimensions.margin.left - dimensions.margin.right])

  y= d3.scaleBand()
    .domain(d3.range(data.length))
    .range([0,dimensions.height - dimensions.margin.bottom - dimensions.margin.top])
    .padding(0.2)

  const axisBottom = d3.axisBottom(x)
    .tickPadding(2)
    .ticks(d3.timeYear.every(15))

  const axisTop = d3.axisTop(x)
    .tickPadding(5)
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

  filteredData.forEach(d=> d.color = d3.color(color(d.name)))
  console.table(filteredData)

  let parent =  this;
  parent = document.createElement("div");

  const svg = d3.select("#wrapper")
    .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height)

  const g = svg
    .append("g")
      .attr("transform", (d,i)=>`translate(${dimensions.margin.left} ${dimensions.margin.top})`);

  //const tooltip = d3.select(document.createElement("div")).call(createTooltip);
  const groups = g.selectAll("g")
    .data(filteredData)
    .enter()
    .append("g")
      .attr("class", "name")

  const line = svg.append("line")
    .attr("y1", dimensions.margin.top-10)
    .attr("y2", dimensions.height-dimensions.margin.bottom)
    .attr("stroke", "rgba(0,0,0,0.5)")
      .style("pointer-events","none");

  groups.attr("transform", (d,i)=>`translate(0 ${y(i)})`)

   groups
    .each(getRect)
  //   .on("mouseover", function(d) {
  //     d3.select(this).select("rect").attr("fill", d.color.darker())
  //     tooltip
  //       .style("opacity", 1)
  //       .html(getTooltipContent(d))
  // })
  //   .on("mouseleave", function(d) {
  //     d3.select(this).select("rect").attr("fill", d.color)
  //     tooltip.style("opacity", 0)
  // })

  svg
    .append("g")
    .attr("transform", (d,i)=>`translate(${dimensions.margin.left} ${dimensions.margin.top-10})`)
    .call(axisTop)

  svg
    .append("g")
    .attr("transform", (d,i)=>`translate(${dimensions.margin.left} ${dimensions.height-dimensions.margin.bottom})`)
    .call(axisBottom)

  // svg.on("mousemove", function(d) {
  //   let [x,y] = d3.mouse(this);
  //   line.attr("transform", `translate(${x} 0)`);
  //   y +=20;
  //   if(x>dimensions.width/2) x-= 100;

  //   tooltip
  //     .style("left", x + "px")
  //     .style("top", y + "px")
  // })
  // const wrapper = d3.select("#wrapper")
  // wrapper.append(svg.node());
  // //wrapper.append(tooltip.node());
  // wrapper.groups = groups;

  const names = d3.selectAll(".name")

  names.data(filteredData, d=>d.name)
    .enter()
    .transition()
    // .delay((d,i)=>i*10)
    .ease(d3.easeCubic)
    .attr("transform", (d,i)=>`translate(0 ${y(i)})`)


    // let parent = this; 
    // console.log(parent)
    // if (!parent) {
    //   parent = document.createElement("div");
    // } else {
    // }
    // return parent

  }

getRect = function(d){
  const el = d3.select(this);

  const sx = x(d.start);
  console.log("sx")
  console.log(sx)
  const w = x(d.end) - x(d.start);
  const isLabelRight =(sx > dimensions.width/2 ? sx+w < dimensions.width : sx-w>0);

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
    .style("font-family", "Playfair Display")
    .style("font-size", "11px")
    .style("dominant-baseline", "hanging");
}