import { select } from "d3-selection";

export const hideElements = elements => {
  elements.map(el => select(el).style("display", "none"));
};
