import React from "react";
import { axisBottom, axisLeft, axisRight, axisTop } from "d3-axis";
import { select } from "d3-selection";
import { line, curveLinear } from "d3-shape";
import { timeParse, timeFormat } from "d3-time-format";

var formatTime = timeFormat("%X"); // "11:12:56 PM"
var parseTime = timeParse("%-I:%M:%S %p");

export const addAxes = (chartWindow, options) => {
  let { innerWidth, name, position, scale, innerHeight, ticks } = options;
  ticks = ticks ? ticks : name === "Volume" ? 3 : 10;
  console.log({ ticks });
  let axis_group = chartWindow.append("g").attr("id", `${position}${name}Axis`);
  switch (position) {
    case "left":
      options.Axis = axisLeft(scale).ticks(ticks)
      axis_group.call(options.Axis);
      break;
    case "right":
      options.Axis = axisRight(scale).ticks(ticks)
      axis_group.attr("transform", `translate(${innerWidth},${0})`);
      axis_group.call(options.Axis);
      break;
    case "top":
      options.Axis = axisTop(scale).ticks(ticks)
      axis_group.call(options.Axis);
      break;
    case "bottom":
      options.Axis = axisBottom(scale).ticks(ticks)
      axis_group.attr("transform", `translate(${0},${innerHeight})`);
      axis_group.call(options.Axis);
      break;

    default:
      break;
  }
  axis_group
    .append("path")
    .attr("id", `${position}${name}Tag`)
    // .attr("stroke", "blue")
    .attr("stroke-width", 2);
  axis_group.append("text").attr("id", `${position}${name}TagText`);
  options.axis_group = axis_group
  return options;
};

export const drawAxisAnnotation = (options, xy) => {
  let { position, name, scale } = options;

  let value = scale.invert(xy);

  if (name !== "Time") {
    value = value.toFixed(3);
    if (String(value).length > 6) value = parseFloat(value).toFixed(2);
  } else {
    /* need to have time formatting */
    value = formatTime(value);
  }
  // console.log(String(value).length);
  // console.log({ value: value });
  // console.log(`place a marker at ${xy} with value ${value}`);
  select(`#${position}${name}Tag`)
    .attr("d", getAccessorPathData(options, xy))
    .style("display", "block")
    .attr("fill", "green");
  setTagText(value, xy, options);
};

function setTagText(value, xy, options) {
  let { position, name, innerHeight } = options;
  let tagText = select(`#${position}${name}TagText`);

  tagText
    .text(value)
    .attr("font-size", "1.3em")
    .style("display", "block");
  switch (position) {
    case "left":
      tagText.attr("y", xy + 4).attr("x", -15);

      break;
    case "right":
      tagText.attr("y", xy + 4).attr("x", 15);

      break;
    case "top":
      tagText.attr("y", 0 - 6).attr("x", xy);

      break;
    case "bottom":
      tagText.attr("y", +15).attr("x", xy);

      break;

    default:
      break;
  }
}

function getAccessorPathData(options, xy) {
  const { position, innerWidth, innerHeight } = options;
  switch (position) {
    case "left":
      return axisMarkerTagAccessor(leftAxisMarkerTagLine(xy));
      break;
    case "right":
      return axisMarkerTagAccessor(rightAxisMarkerTagLine(xy, innerWidth));
      break;

    case "top":
      return axisMarkerTagAccessor(topAxisMarkerTagLine(xy));
      break;

    case "bottom":
      return axisMarkerTagAccessor(bottomAxisMarkerTagLine(xy, innerHeight));
      break;

    default:
      break;
  }
}

const axisMarkerTagAccessor = line()
  .x(d => d.x)
  .y(d => d.y)
  .curve(curveLinear);

const leftAxisMarkerTagLine = y => [
  { x: 0, y: 0 + y },
  { x: -20, y: -10 + y },
  { x: -60, y: -10 + y },
  { x: -60, y: 10 + y },
  { x: -20, y: 10 + y },
  { x: 0, y: 0 + y }
];

const rightAxisMarkerTagLine = y => [
  { x: 0, y: 0 + y },
  { x: 20, y: -10 + y },
  { x: 60, y: -10 + y },
  { x: 60, y: 10 + y },
  { x: 20, y: 10 + y },
  { x: 0, y: 0 + y }
];


const topAxisMarkerTagLine = x => [
  { x: x + 0, y: 0 },
  { x: x - 40, y: -4 },
  { x: x - 40, y: -20 },
  { x: x- 40, y: -20 },
  { x: x + 40, y: -20 },
  { x: x + 40, y: -20 },
  { x: x + 40, y: -4 },
  { x: x + 0, y: -0 },
];


const bottomAxisMarkerTagLine = x => [
  { x: x + 0, y: 0 },
  { x: x - 40, y: 4 },
  { x: x - 40, y: 20 },
  { x: x- 40, y: 20 },
  { x: x + 40, y: 20 },
  { x: x + 40, y: 20 },
  { x: x + 40, y: 4 },
  { x: x + 0, y: 0 },
];

