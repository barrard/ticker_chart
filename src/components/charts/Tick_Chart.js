import React, { useState, useEffect, useRef, useCallback } from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import { max, min, extent } from "d3-array";
import { axisBottom, axisLeft, axisRight, axisTop } from "d3-axis";
import { timeParse, timeFormat } from "d3-time-format";
import { select, mouse } from "d3-selection";
import { addAxes, drawAxisAnnotation } from "../services/axis.js";
import { hideElements } from "../utils.js";
import {addMainZoom, addVolZoom} from '../services/zoom.js'

function Tick_Chart({ data }) {
  console.log("Tick_Chart");
  const chartRef = useRef();
  const [dataVis, setdataVis] = useState(600);
  const [margins, setmargins] = useState({
    top: 20,
    right: 60,
    bottom: 20,
    left: 60,
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
    const priceRange = priceMax - priceMin;
    const volMax = max(_data, d => d.volume);
    console.log({ priceMax, priceMin, volMax });
    const priceScale = scaleLinear()
      .range([candleStickWindowHeight, 0])
      .domain([
        priceMin - addPadding(priceMin, 0.005),
        priceMax + addPadding(priceMax, 0.001)
      ]);
    const volumeScale = scaleLinear()
      .range([volumeWindowHeight, 0])
      .domain([0, volMax]);
    console.log("max is " + volumeScale(volMax));
    console.log("min is " + volumeScale(0));
    const candleHeightScale = scaleLinear()
      .domain([0, priceRange])
      .range([0, candleStickWindowHeight]);
    const volumeHeightScale = scaleLinear()
      .domain([0, volMax + addPadding(volMax, 0.05)])
      .range([0, volumeWindowHeight]);
    // console.log('max height is '+candleHeightScale(priceMax-priceMin))
    // console.log('min height is '+candleHeightScale(0))
    const xDomain = extent(data, d => d.date);
    const xScale = scaleTime()
      .range([0, innerWidth])
      .domain(xDomain);

    /* Main chart window */
    let chartWindow = svg
      .append("g")
      .attr("transform", `translate(${margins.left},${margins.top})`);

    /* study divider */
    let volPriceDivder = chartWindow
      .append("line")
      .attr("class", "volPriceDividerLine")
      .attr("x1", xScale(xDomain[0]))
      .attr("y1", candleStickWindowHeight)
      .attr("x2", xScale(xDomain[1]))
      .attr("y2", candleStickWindowHeight);

    /* Candlestick window */
    let candleStickWindow = chartWindow.append("g");
    let volumeWindow = chartWindow
      .append("g")
      .attr("transform", `translate(${0},${candleStickWindowHeight})`);

    /* Axis config  */
    let leftOpts = {
      position: "left",
      scale: priceScale,
      name: "Price"
    };
    let bottomOpts = {
      position: "bottom",
      scale: xScale,
      name: "Time",
      innerHeight
    };
    let rightOpts = {
      position: "right",
      scale: priceScale,
      name: "Price",
      innerWidth
    };
    let topOpts = {
      position: "top",
      scale: xScale,
      name: "Time"
    };
    let leftVolOpts = {
      position: "left",
      scale: volumeScale,
      name: "Volume"
    };
    let rightVolOpts = {
      position: "right",
      scale: volumeScale,
      name: "Volume",
      innerWidth
    };

    leftOpts = addAxes(candleStickWindow, leftOpts);
    rightOpts = addAxes(candleStickWindow, rightOpts);
    bottomOpts = addAxes(candleStickWindow, bottomOpts);
    topOpts = addAxes(candleStickWindow, topOpts);

    leftVolOpts = addAxes(volumeWindow, leftVolOpts);
    rightVolOpts = addAxes(volumeWindow, rightVolOpts);

    let candleSticks_g = candleStickWindow.append("g");
    let volumeBars_g = volumeWindow.append("g");

    let zoomMainFn = addMainZoom([leftOpts, rightOpts, topOpts, bottomOpts], candleSticks_g)
    let zoomVolFn = addVolZoom([leftVolOpts, rightVolOpts], volumeBars_g)
    svg.call(zoomMainFn);
    volumeWindow.call(zoomVolFn);


    /* CANDLES STICKS */
    let candleSticks = candleSticks_g.selectAll("rect").data(_data);
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
    let volumeBars = volumeBars_g.selectAll("rect").data(_data);
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
        removeAllAxisAnnotations();
      })
      .on("mousemove", mousemove);

    function appendCrosshairPrice(y) {}
    function appendCrosshairVolume(y) {
      console.log(`place a marker at ${y} with value ${volumeScale.invert(y)}`);
    }

    function mousemove() {
      let _mouse = mouse(this);
      var x = _mouse[0];
      var y = _mouse[1];
      appendAxisAnnotations(x, y);
      let mouseDate = xScale.invert(_mouse[0]);
      crosshair
        .select("#crosshairX")
        .attr("x1", _mouse[0])
        .attr("y1", 0)
        .attr("x2", _mouse[0])
        .attr("y2", innerHeight);

      crosshair
        .select("#crosshairY")
        .attr("x1", xScale(xDomain[0]))
        .attr("y1", _mouse[1])
        .attr("x2", xScale(xDomain[1]))
        .attr("y2", _mouse[1]);

      // console.log({ x, y, mouseDate });
    }
    function appendAxisAnnotations(x, y) {
      /* Candle stick is the top candleStickWindowHeight */
      drawAxisAnnotation(topOpts, x);
      drawAxisAnnotation(bottomOpts, x);
      if (y < candleStickWindowHeight) {
        drawAxisAnnotation(leftOpts, y);
        drawAxisAnnotation(rightOpts, y);
        removeVolumeAxisAnnotations();
      } else if (y > candleStickWindowHeight) {
        y = y - candleStickWindowHeight;
        drawAxisAnnotation(leftVolOpts, y);
        drawAxisAnnotation(rightVolOpts, y);
        removePriceAxisAnnotations();
      }
    }
  }, [candleStickWindowHeight, data, dataVis, formatTime, innerHeight, innerWidth, margins.left, margins.right, margins.top, parseTime, volumeWindowHeight]);
  useEffect(() => {
    console.log("first?");
  }, []);

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

function addPadding(val, padding) {
  let num;
  if (val * padding !== 0) num = val * padding;
  else num = 20;
  console.log({ num, val, padding });
  return num;
}

function removeAllAxisAnnotations() {
  hideElements([
    "#leftPriceTag",
    "#leftPriceTagText",
    "#rightPriceTag",
    "#rightPriceTagText",
    "#rightVolumeTag",
    "#rightVolumeTagText",
    "#leftVolumeTag",
    "#leftVolumeTagText",
    "#topTimeTag",
    "#topTimeTagText",
    "#bottomTimeTag",
    "#bottomTimeTagText"
  ]);
}

function removePriceAxisAnnotations() {
  hideElements([
    "#leftPriceTag",
    "#leftPriceTagText",
    "#rightPriceTag",
    "#rightPriceTagText"
  ]);
}

function removeVolumeAxisAnnotations() {
  hideElements([
    "#rightVolumeTag",
    "#rightVolumeTagText",
    "#leftVolumeTag",
    "#leftVolumeTagText"
  ]);
}
