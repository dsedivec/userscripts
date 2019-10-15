// ==UserScript==
// @name Remove fixed headers
// @namespace org.codefu
// @match *://*/*
// @exclude /^https?://[^/]*\bgithub\.com(/|$)/
// @grant none
// ==/UserScript==

// Sites to test this with:
// * https://thewirecutter.com
// * Pretty much anything on Medium
// * Google search results
// * Maybe Mailinator?  (See comment below.)

// Maybe remove position=fixed from element el.
function removePositionFixed(el) {
  const style = window.getComputedStyle(el);
  if (
    style.position === 'fixed' &&
    style.display !== 'none' &&
    // Ex:
    // https://benbernardblog.com/web-scraping-and-crawling-are-perfectly-legal-right/
    // uses opacity=0 for its nav bar.  I'm being sloppy about str →
    // int conversion here, I think.
    style.opacity > 0
  ) {
    // Has to be stuck to the top of the viewport.
    // Ignore fixed rectangles that are off screen.  Presumably
    // these hide/show as part of navigation.  Not sure what site
    // first necessitated this, could have been Amazon.
    //
    // https://www.mailinator.com/v3/#/#faq_pane finally caused me
    // to only look for full-width boxes.
    const rect = el.getBoundingClientRect();
    if (
      rect.left >= 0 &&
      rect.left < window.innerWidth &&
      rect.width >= window.innerWidth
    ) {
      el.style.position = 'inherit';
      console.log('Removed position=fixed from', el);
    } else {
      console.log('Not removing position=fixed from', el);
    }
  }
}

// Maybe remove position=fixed from element el and all descendents.
function removePositionFixedAll(el) {
  const nodeIter = document.createNodeIterator(el, NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = nodeIter.nextNode())) {
    removePositionFixed(node);
  }
}

const styleAttrObserver = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    // We know "style" attribute just changed, do this before
    // delegating to removePositionFixed, which will call
    // getComputedStyle, which is probably much slower than this
    // check.  (I'm guessing.  Oh god, this is actually slower, isn't it.)
    if (mutation.target.style.position === 'fixed') {
      removePositionFixed(mutation.target);
    }
  }
});
styleAttrObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['style'],
  subtree: true
});

// This observer avoids traversing a whole tree when classes are just
// being added/removed, and we've seen the particular combination of
// classes before.  This was motivated by thewirecutter.com, where
// scrolling the header in/out of the viewport removes/adds a class to
// the body element.  Before this, that meant every time you scrolled
// around the top of the page, we would traverse the whole document:
// sloooow.
const seenClassChanges = new WeakMap();
const classAttrObserver = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    const classListKey = Array.from(mutation.target.classList)
      .sort()
      .toString();
    let classLists = seenClassChanges.get(mutation.target);
    if (!classLists) {
      classLists = seenClassChanges.set(mutation.target, new Set());
    }
    if (!classLists.has(classListKey)) {
      classLists.add(classListKey);
      removePositionFixedAll(mutation.target);
    }
  }
});
classAttrObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['class'],
  subtree: true
});

const newNodeObserver = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      removePositionFixedAll(node);
    }
  }
});
newNodeObserver.observe(document.body, {
  childList: true,
  subtree: true
});

document.querySelectorAll('body *').forEach(removePositionFixed);

console.log('Fixed header removal has been installed');
