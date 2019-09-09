// ==UserScript==
// @name doordash.com: Yelp ratings links
// @namespace Violentmonkey Scripts
// @match *://www.doordash.com/*
// @grant none
// ==/UserScript==

const YELP_LINK_CLASS = "yelp-link";

const observer = new MutationObserver(() => {
  if (document.querySelector(`.${YELP_LINK_CLASS}`)) {
    return;
  }

  const titleElem = document.querySelector("*[data-test-id='store-name']");
  if (!titleElem) {
    //console.log("no titleElem found");
    return;
  }
  //console.log("titleElem=", titleElem);
  const storeName = titleElem.textContent;

  const yelpURL = `https://www.yelp.com/search?find_desc=${encodeURIComponent(storeName)}`;
  //console.log("yelpURL=", yelpURL);
  const yelpLinkElem = document.createElement("a");
  yelpLinkElem.href = yelpURL;
  yelpLinkElem.style.paddingLeft = "10px";
  yelpLinkElem.className = YELP_LINK_CLASS;
  yelpLinkElem.textContent = "Search Yelp";

  //console.log("appending now");
  const ddRatingsElem = document.querySelector("*[class*='StoreDetails_ratings__']");
  ddRatingsElem.parentNode.appendChild(yelpLinkElem);
});

observer.observe(document.body, {childList: true, subtree: true});
//console.log("GM observer installed");
