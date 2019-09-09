// ==UserScript==
// @name google.com: Add "View image" button to image search
// @namespace Violentmonkey Scripts
// @include http*://*.google.tld/search*tbm=isch*
// @grant none
// ==/UserScript==

const VIEW_IMAGE_CLASS = "view_image_button";

function addViewImageButton(container) {
  const image = container.querySelector("img.irc_mi");
  if (!image) {
    console.log("could not find img.irc_mi under ", container);
    return;
  } else if (!image.src) {
    //console.log("img.irc_mi has no src, ignoring");
    return;
  }
  const existingImageLink = container.querySelector(`a.${VIEW_IMAGE_CLASS}`);
  if (existingImageLink) {
    existingImageLink.href = image.src;
  } else {
    const buttonsRow = container.querySelector(".irc_but_r tbody tr");
    if (!buttonsRow) {
      console.log("could not find buttons row under ", container);
    } else {
      const imageLink = document.createElement("a");
      imageLink.classList.add(VIEW_IMAGE_CLASS);
      imageLink.href = image.src;
      // Need to put the link text in a span to get nice styling.
      const imageText = document.createElement("span");
      imageText.textContent = "View image";
      imageLink.appendChild(imageText);
      const viewColumn = document.createElement("td");
      viewColumn.appendChild(imageLink);
      buttonsRow.insertBefore(viewColumn, buttonsRow.firstChild);
    }
  }
}

const resultsContainer = document.querySelector("#res");

function observerCallback(_records, _observer) {
  //console.log("vib observer firing");
  resultsContainer.querySelectorAll(".irc_c").forEach(addViewImageButton);
}

if (resultsContainer) {
  const viewImageObserver = new MutationObserver(observerCallback);
  viewImageObserver.observe(resultsContainer, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"],
  });
  console.log("Observer installed to add view image links");
  // Probably need to handle any already-existing ones?
  observerCallback();
} else {
  console.log("could not find results container #res");
}

