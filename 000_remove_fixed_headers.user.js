// ==UserScript==
// @name Remove fixed headers
// @namespace Violentmonkey Scripts
// @match *://*/*
// @grant none
// ==/UserScript==
//console.log("beginning to remove fixed headers");
document.querySelectorAll('body *').forEach(function (el) {
  const style = window.getComputedStyle(el);
  if (
    style.position == 'fixed'
    && style.display != 'none'
    // Ex: https://benbernardblog.com/web-scraping-and-crawling-are-perfectly-legal-right/
    // uses opacity=0 for its nav bar.  I'm being sloppy
    // about str → int conversion here, I think.
    && style.opacity > 0
  ) {
    // Has to be stuck to the top of the viewport.
    // Ignore fixed rectangles that are off screen.  Presumably
    // these hide/show as part of navigation.  Not sure what site
    // first necessitated this, could have been Amazon.
    //
    // https://www.mailinator.com/v3/#/#faq_pane finally caused me
    // to only look for full-width boxes.
    rect = el.getBoundingClientRect();
    if (rect.top == 0
        && rect.left >= 0
        && rect.left < window.innerWidth
        && rect.width >= window.innerWidth) {
      el.style.position = "inherit";
      console.log("Removed position=fixed from", el);
    }
  }
});
//console.log("removed fixed headers");
