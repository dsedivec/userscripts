// ==UserScript==
// @name amazon.com: Goodreads links
// @namespace Violentmonkey Scripts
// @match *://www.amazon.com/*
// @match *://smile.amazon.com/*
// @grant none
// ==/UserScript==

console.log("DALE script starting");
let match = window.location.pathname.match(/\/dp\/([A-Z0-9]+)/i);
if (match) {
  let asin = match[1];
  console.log("asin=", asin);
  let goodreadsLink = document.createElement("template");
  goodreadsLink.innerHTML = `
    <div style="float: right;">
      <img src="https://www.goodreads.com/favicon.ico" style="height: 1em; vertical-align: middle;">
      <a href="https://www.goodreads.com/book/isbn?isbn=${asin}" style="vertical-align: middle;">Goodreads</a>
    </div>
  `.trim();
  for (let id of ['booksTitle', 'title_feature_div', 'title']) {
    const insertionPoint = document.getElementById(id);
    if (insertionPoint) {
      insertionPoint.parentNode.insertBefore(goodreadsLink.content.firstChild, 
                                             insertionPoint.nextSibling);
      console.log("Goodreads link added");
      break;
    }
  }
}
console.log("DALE script ending");
