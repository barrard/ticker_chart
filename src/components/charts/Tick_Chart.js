import React, { useState, useEffect, useRef, useCallback } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { max, min, extent } from "d3-array";
import { axisBottom, axisLeft, axisRight, axisTop } from "d3-axis";
import { timeParse, timeFormat } from "d3-time-format";
import { select, mouse } from "d3-selection";

function Tick_Chart({ data }) {
  console.log('Tick_Chart');
  const chartRef = useRef();
  const [dataVis, setdataVis] = useState(600);
  const [margins, setmargins] = useState({
    top: 20,
    right: 40,
    bottom: 20,
    left: 40,
    width: 600,
    height: 600
  });
  let MOUSE_OVER;
  const VOL_HEIGHT = 0.15; //15%
  let innerWidth = margins.width - margins.right - margins.left;
  let innerHeight = margins.height - margins.top - margins.bottom;
  var formatTime = timeFormat("%X"); // "11:12:56 PM"
  var parseTime = timeParse("%-I:%M:%S %p");
  const candleStickWindowHeight = innerHeight - VOL_HEIGHT * innerHeight; //add others? make dynamic
  const volumeWindowHeight = innerHeight * VOL_HEIGHT;
  const draw = useCallback(() => {
    let svg = select(chartRef.current);

    console.log("DRAW");
    if (!data) return;
    var _data = data.slice(-dataVis);
    // format the data / clean the data
    _data.forEach(function(d) {
      // d.date = /* parseTime */(new Date(+d.end_timestamp).toISOString());
      d.date = parseTime(formatTime(new Date(d.start_timestamp)));
      d.close = +d.close;
      d.open = +d.open;
      d.high = +d.high;
      d.low = +d.low;
      d.volume = +d.volume;
    });
    console.log(_data);
    const priceMax = max(_data, d => d.high);
    const priceMin = min(_data, d => d.low);
    const priceRange = priceMax - priceMin
    const volMax = max(_data, d => d.volume);
    console.log({ priceMax, priceMin, volMax });
    const priceScale = scaleLinear()
      .range([candleStickWindowHeight, 0])
      .domain([priceMin-addPadding(priceMin, .005), priceMax+addPadding(priceMax, .001)]);
    const volumeScale = scaleLinear()
      .range([volumeWindowHeight, 0])
      .domain([0, volMax]);
    console.log("max is " + volumeScale(volMax));
    console.log("min is " + volumeScale(0));
    const candleHeightScale = scaleLinear()
      .domain([0, priceRange])
      .range([0, candleStickWindowHeight]);
    const volumeHeightScale = scaleLinear()
      .domain([0, volMax+addPadding(volMax, .05)])
      .range([0, volumeWindowHeight]);
    // console.log('max height is '+candleHeightScale(priceMax-priceMin))
    // console.log('min height is '+candleHeightScale(0))
    const xDomain = extent(data, d => d.date);
    const xScale = scaleTime()
      .range([0, innerWidth])
      .domain(xDomain);

    let chartWindow = svg
      .append("g")
      .attr("transform", `translate(${margins.left},${margins.top})`);
      let volPriceDivder = chartWindow.append('line').attr('class', 'volPriceDividerLine')
      .attr("x1", xScale(xDomain[0]))
      .attr("y1", candleStickWindowHeight)
      .attr("x2", xScale(xDomain[1]))
      .attr("y2", candleStickWindowHeight);
    let chandleStickWindow = chartWindow.append("g")
      .on('mouseover', ()=>setMouseHover('price'));
    let volumeWindow = chartWindow
      .append("g")
      .on('mouseover', ()=> setMouseHover('volume'))
      .attr("transform", `translate(${0},${candleStickWindowHeight})`);

    let leftPriceAxis = chandleStickWindow
      .append("g")
      .call(axisLeft(priceScale));
    let rightPriceAxis = chandleStickWindow
      .append("g")
      .call(axisRight(priceScale))
      .attr("transform", `translate(${innerWidth},${0})`);
    let bottomTimeAxis = chandleStickWindow
      .append("g")
      .call(axisBottom(xScale))
      .attr("transform", `translate(${0},${innerHeight})`);
    let topTimeAxis = chandleStickWindow.append("g").call(axisTop(xScale));
    let leftVolumeAxis = volumeWindow
      .append("g")
      .call(axisLeft(volumeScale).ticks(3));
    let rightVolumeAxis = volumeWindow
      .append("g")
      .attr("transform", `translate(${innerWidth},${0})`)
      .call(axisRight(volumeScale).ticks(3));

      /* CANDLES STICKS */
    let candleSticks = chandleStickWindow.selectAll("rect").data(_data);
    candleSticks.exit().remove();
    candleSticks
      .enter()
      .append("rect")
      .merge(candleSticks)
      .attr("x", (_, i) => i * (innerWidth / _data.length))
      .attr("y", d => priceScale(yCandleAccessor(d)))
      .attr("height", d => {
        const h = candleHeightScale(heightCandleAccessor(d));
        if (h === 0) return 1;
        else return h;
      })
      .attr("width", innerWidth / _data.length - margins.left + margins.right)
      .attr("fill", d => candleFillAccessor(d));

      /* VOLUME BARS */
    let volumeBars = volumeWindow.selectAll("rect").data(_data);
    volumeBars.exit().remove();
    volumeBars
      .enter()
      .append("rect")
      .merge(volumeBars)
      .attr("x", (_, i) => i * (innerWidth / _data.length))
      .attr("y", d => volumeScale(d.volume))
      .attr("height", d => volumeHeightScale(d.volume))
      .attr("width", innerWidth / _data.length - margins.left + margins.right)
      .attr("fill", d => candleFillAccessor(d));

    /* CrossHair */
    // create crosshairs
    var crosshair = chartWindow.append("g").attr("class", "line");
    // create horizontal line
    crosshair
      .append("line")
      .attr("id", "crosshairX")
      .attr("class", "crosshair");

    // create vertical line
    crosshair
      .append("line")
      .attr("id", "crosshairY")
      .attr("class", "crosshair");

    let candlesCrosshairWindow = chartWindow
      .append("rect")
      .attr("class", "overlay")

      .attr("height", innerHeight)
      .attr("width", innerWidth)
      .on("mouseover", function() {
        crosshair.style("display", null);
      })
      .on("mouseout", function() {
        crosshair.style("display", "none");
      })
      .on("mousemove", mousemove);

      function appendCrosshairPrice(){
        let _mouse = mouse(this);
        var x = _mouse[0];
        var y = _mouse[1];
        console.log({x, y})
        console.log(`price is ${priceScale(x)}`)
      }

    function mousemove() {
      let _mouse = mouse(this);
      var x = _mouse[0];
      var y = _mouse[1];
      let mouseDate = xScale.invert(_mouse[0]);
      crosshair.select("#crosshairX")
          .attr("x1", _mouse[0])
          .attr("y1", 0)
          .attr("x2", _mouse[0])
          .attr("y2", innerHeight);

        crosshair.select("#crosshairY")
          .attr("x1", xScale(xDomain[0]))
          .attr("y1", _mouse[1])
          .attr("x2", xScale(xDomain[1]))
          .attr("y2", _mouse[1]);

      // console.log({ x, y, mouseDate });
    }
    function setMouseHover(window){
      console.log(`Hovering over ${window}`)
      MOUSE_OVER = window
    }
  }, [
    candleStickWindowHeight,
    data,
    dataVis,
    formatTime,
    innerHeight,
    innerWidth,
    margins.left,
    margins.right,
    margins.top,
    parseTime,
    volumeWindowHeight
  ]);
  useEffect(() => {console.log('first?')}, []);

  useEffect(() => {
    console.log("user effect");
    draw();
  });

  const Chart = () => (
    <svg
      className="chart"
      width={margins.width}
      height={margins.height}
      ref={chartRef}
    ></svg>
  );

  return <Chart data={data} />;
}

export default Tick_Chart;

function candleFillAccessor(d) {
  return d.close === d.open ? "black" : d.open > d.close ? "green" : "red";
}

function heightCandleAccessor(d) {
  const val = Math.abs(d.open - d.close);
  return val;
}

function yCandleAccessor(d) {
  if (d.open > d.close) return d.open;
  if (d.open < d.close) return d.close;
  return d.close;
}

function addPadding(val, padding){
  let num;
  if(val*padding !== 0) num =  val*padding
  else num = 20
  console.log({num, val, padding})
  return num
}