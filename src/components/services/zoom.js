import { zoom } from "d3-zoom";
import { event } from "d3-selection";

export const addVolZoom = ([leftVolOpts, rightVolOpts], volumeBars_g) => {
  return zoom()
    .scaleExtent([1, 2])
    .translateExtent([[0, -100], [600 + 90, 600 + 100]])
    .on("zoom", zoomed);
  function zoomed() {
    /* left vol */
    let leftVolY_g = leftVolOpts.axis_group;
    let leftVolAxis = leftVolOpts.Axis;
    /* right vol */
    let rightVolY_g = rightVolOpts.axis_group;
    let rightVolAxis = rightVolOpts.Axis;
    if (volumeBars_g)
      volumeBars_g.attr(
        "transform",
        `translate(${event.transform.x},${0}) scale(${event.transform.k})`
      );
    // volumeBars_g.attr("transform", event.transform);
    if (rightVolY_g)
      rightVolY_g.call(
        rightVolAxis.scale(event.transform.rescaleY(leftVolOpts.scale))
      );
    if (leftVolY_g)
      leftVolY_g.call(
        leftVolAxis.scale(event.transform.rescaleY(leftVolOpts.scale))
      );
  }
};

export const addMainZoom = (
  [leftOpts, rightOpts, topOpts, bottomOpts],
  candleSticks_g
) => {
  return zoom()
    .scaleExtent([1, 2])
    .translateExtent([[0, -100], [600 + 90, 600 + 100]])
    .on("zoom", zoomed);

  function zoomed() {
    /* left price */
    let leftY_g = leftOpts.axis_group;
    let leftAxis = leftOpts.Axis;
    /* right price */
    let rightY_g = rightOpts.axis_group;
    let rightAxis = rightOpts.Axis;

    /* top time */
    let topX_g = topOpts.axis_group;
    let topAxis = topOpts.Axis;
    /* bottom time */
    let bottomX_g = bottomOpts.axis_group;
    let bottomAxis = bottomOpts.Axis;

    if (candleSticks_g) candleSticks_g.attr("transform", event.transform);

    if (bottomX_g)
      bottomX_g.call(
        bottomAxis.scale(event.transform.rescaleX(bottomOpts.scale))
      );
    if (topX_g)
      topX_g.call(topAxis.scale(event.transform.rescaleX(bottomOpts.scale)));
    if (rightY_g)
      rightY_g.call(rightAxis.scale(event.transform.rescaleY(leftOpts.scale)));
    if (leftY_g)
      leftY_g.call(leftAxis.scale(event.transform.rescaleY(leftOpts.scale)));
  }
};
