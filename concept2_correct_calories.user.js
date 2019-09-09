// ==UserScript==
// @name concept2.com: Correct calories on log
// @namespace Violentmonkey Scripts
// @match https://log.concept2.com/profile/*/log/*
// @grant none
// ==/UserScript==

// Change this to your weight in pounds
const WEIGHT = 135;

const SMALL_COLOR = "#bbb";

// Find the duration in hours.
const durationStr = document.querySelector(".icon-time + span").textContent;
const hourConversionFactors = [3600, 60, 1];
const durationParts = durationStr.split(":", 3).reverse().map(
  function(partStr, index) {
    return Number(partStr) / hourConversionFactors[index];
  }
);
const durationHours = durationParts.reduce((accum, cur) => accum + cur, 0);

// Find the div that holds the "more-stats" table,
// which in turn contains kcal/h as reported by the PM.
const moreStatsContainer = document.querySelectorAll("table.workout__more-stats")[1].parentNode;
// Phew, this ugly.
const CAL_PER_HOUR_XPATH = "//table/tbody/tr/th[text()='Calories Per Hour']/following-sibling::td";
const calsPerHourElem = document.evaluate(CAL_PER_HOUR_XPATH, moreStatsContainer).iterateNext();
const calsPerHour = Number(calsPerHourElem.textContent);

// Calculate "true" kcal using the the numbers from above
// and the formulas from
// <http://www.concept2.com/indoor-rowers/training/calculators/calorie-calculator>.
const trueCalsPerHour = calsPerHour - 300 + (1.714 * WEIGHT);
const trueCals = Math.round(trueCalsPerHour * durationHours);

// Update kcal/h to "true" kcal/h.
calsPerHourElem.innerHTML = `
  <small style="color: ${SMALL_COLOR};">
    (was ${calsPerHour})
  </small>
  ${Math.round(trueCalsPerHour)}
`;
// This is unfortunately brittle.
calsPerHourElem.style.width = "50%";
// Why doesn't moreStatsContainer.previousElementSibling work?
const moreStatsPrevSibling = moreStatsContainer.parentNode.children[0];
moreStatsPrevSibling.className = moreStatsPrevSibling.className.replace("col-md-6", "col-md-4");
moreStatsContainer.className = moreStatsContainer.className.replace("col-md-6", "col-md-8");

// Update total kcal burned to "true" kcal burned.
const calsValueElem = document.querySelector(".workout__stats i.icon-calories + span");
const pmCalsElem = document.createElement("small");
pmCalsElem.style.color = SMALL_COLOR;
pmCalsElem.textContent = `(was ${calsValueElem.textContent})`;
calsValueElem.textContent = trueCals;
calsValueElem.parentNode.appendChild(pmCalsElem);
