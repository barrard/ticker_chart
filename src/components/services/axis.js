import React from "react";
import { axisBottom, axisLeft, axisRight, axisTop } from "d3-axis";
import { select } from "d3-selection";
import { line, curveLinear } from "d3-shape";

export const addAxes = (chartWindow, options) => {
  let { innerWidth, name, position, scale,innerHeight } = options;
  let axis = chartWindow.append("g").attr("id", `${position}${name}Axis`);
  switch (position) {
    case "left":
      axis.call(axisLeft(scale));
      break;
    case "right":
      axis.attr("transform", `translate(${innerWidth},${0})`);
      axis.call(axisRight(scale));
      break;
    case "top":
      axis.call(axisTop(scale));
      break;
    case "bottom":
      axis.attr("transform", `translate(${0},${innerHeight})`);
      axis.call(axisBottom(scale));
      break;

    default:
      break;
  }
  axis
  .append("path")
  .attr("id", `${position}${name}Tag`)
  // .attr("stroke", "blue")
  .attr("stroke-width", 2);
  axis.append("text").attr("id", `${position}${name}TagText`);

  return axis;
};

export const drawAxisAnnotation = ( options, xy) => {
  let { position, name, scale } = options;


  let value = scale.invert(xy).toFixed(3);

  console.log(String(value).length);
  if(String(value).length>6)value = parseFloat(value).toFixed(2)
  console.log({ value: value });
  console.log(`place a marker at ${xy} with value ${value}`);
  select(`#${position}${name}Tag`).attr(
    "d", getAccessorPathData(options, xy)


  ).style("display", 'block')
  .attr('fill', 'green');
    setTagText(value, position, name, xy)


};

function setTagText(value, position, name, xy){

  let tagText = select(`#${position}${name}TagText`)

    tagText.text(value)
    switch (position) {
      case 'left':
          tagText.attr("y", xy+4)
          .attr("x",  -6)
          .attr('font-size', '1.3em')
          .style("display", 'block')

        break;
      case 'right':
          tagText.attr("y", xy+4)
          .attr("x",  6)
          .attr('font-size', '1.3em')
          .style("display", 'block')
          break;

      default:
        break;
    }

}

function getAccessorPathData(options,y){
  const {position, innerWidth} = options
  switch (position) {
    case 'left':
        return axisMarkerTagAccessor(leftAxisMarkerTagLine(y))
      break;
    case 'right':
        return axisMarkerTagAccessor(rightAxisMarkerTagLine(y, innerWidth))
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
    { x: -20, y: -20 + y },
    { x: -60, y: -20 + y },
    { x: -60, y: 20 + y },
    { x: -20, y: 20 + y },
    { x: 0, y: 0 + y }
  ];


  const rightAxisMarkerTagLine = y => [
    { x: 0, y: 0 + y },
    { x: 20, y: -20 + y },
    { x: 60, y: -20 + y },
    { x: 60, y: 20 + y },
    { x: 20, y: 20 + y },
    { x: 0, y: 0 + y }
  ];
