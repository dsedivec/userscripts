// ==UserScript==
// @name Remove fixed headers
// @namespace org.codefu
// @match *://*/*
// @exclude /^https?://[^/]*\bgithub\.com(/|$)/
// @exclude /^https?://www.google.com/maps//
// @grant none
// ==/UserScript==

// Sites this should fix:
// * https://thewirecutter.com
// * https://www.wired.com
// * https://blog.hubspot.com/marketing/medium-publications-to-follow

// Sites this shouldn't break:
// * https://www.github.com
// * https://www.google.com/search?q=foo
// * https://www.mailinator.com/v3/#/#faq_pane
// * https://www.ebay.com
// * https://www.enterprise.com/
// * https://2game.com/
// * https://www.eventbrite.com/
// * https://repl.it/
// * https://www.amazon.com/
// * https://primenow.amazon.com/
// * https://www.youtube.com/ (check no white bar atop full screen video)
// * https://benbernardblog.com/web-scraping-and-crawling-are-perfectly-legal-right/

let instrument = (message, f) => {
  return (...args) => {
    const start = performance.now();
    try {
      return f(...args);
    } finally {
      const end = performance.now();
      console.log('Remove fixed header:', message, 'took', end - start, 'ms');
    }
  };
};
// Comment this line when you want to trace how often observers fire
// and how long they take.
instrument = (message, f) => f;

const MAX_OBSERVER_CALLS = 100;

function limitObserver(observerName, wrapped) {
  let numCalls = 0;
  return (mutations, observer) => {
    try {
      return wrapped(mutations, observer);
    } finally {
      if (++numCalls > MAX_OBSERVER_CALLS) {
        observer.disconnect();
        console.log(`${observerName} disconnected after ${numCalls} call(s)`);
      }
    }
  };
}

// Maybe remove position=fixed from element el.
function removePositionFixed(el, source) {
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
      console.log(`${source} removed position=fixed from`, el);
    } else {
      console.log(`${source} not removing position=fixed from`, el);
    }
  }
}

// Maybe remove position=fixed from element el and all descendents.
function removePositionFixedAll(el, source) {
  const nodeIter = document.createNodeIterator(el, NodeFilter.SHOW_ELEMENT);
  let node;
  while ((node = nodeIter.nextNode())) {
    removePositionFixed(node, source);
  }
}

const styleAttrObserver = new MutationObserver(
  instrument(
    'In-line style observer',
    limitObserver('In-line style observer', mutations => {
      for (const mutation of mutations) {
        // We know "style" attribute just changed, do this before
        // delegating to removePositionFixed, which will call
        // getComputedStyle, which is probably much slower than this
        // check.  (I'm guessing.  Oh god, this is actually slower, isn't it.)
        if (mutation.target.style.position === 'fixed') {
          removePositionFixed(mutation.target, 'Inline style change');
        }
      }
    })
  )
);
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
const classAttrObserver = new MutationObserver(
  instrument(
    'Class observer',
    limitObserver('Class observer', mutations => {
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
          removePositionFixedAll(mutation.target, 'Class change');
        }
      }
    })
  )
);
classAttrObserver.observe(document.body, {
  attributes: true,
  attributeFilter: ['class'],
  subtree: true
});

const newNodeObserver = new MutationObserver(
  instrument(
    'Node creation observer',
    limitObserver('Node creation observer', mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          removePositionFixedAll(node, 'Node change');
        }
      }
    })
  )
);
newNodeObserver.observe(document.body, {
  childList: true,
  subtree: true
});

document
  .querySelectorAll('body *')
  .forEach(el => removePositionFixed(el, 'Startup'));

console.log('Fixed header removal has been installed');
