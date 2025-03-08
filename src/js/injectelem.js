/* eslint-disable */

export const injectAutomTestEle = (styleContent) => {
  const automBaseStyles = `
    .bx-automator-test .bx-slab {
      position: fixed;
      top: 0;
      background-color: rgba(165, 165, 255, 0.85);
      height: 40px;
      width: 100vw;
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .bx-automator-test-clone .bx-slab {
      position: relative;
      top: 0;
      height: 40px;
      width: 100vw;
    }
  `;

  // Extract the numeric height value from automBaseStyles
  const heightMatch = automBaseStyles.match(/height:\s*(\d+(\.\d+)?)/);
  const heightValue = heightMatch ? parseFloat(heightMatch[1]) : 40;

  // Replace '+pushAmount+' with the height value in styleContent, including the enclosing '
  const updatedStyleContent =
    typeof styleContent === "string"
      ? styleContent.replace(/\'\+pushAmount\+\'/g, parseFloat(heightValue))
      : "";

  // Check if the element already exists
  const existingDiv = document.querySelector(".bx-automator-test");

  if (existingDiv) {
    // Update existing styles
    const baseStyleElement = existingDiv.querySelector(
      ".bx-automator-test-base-style",
    );
    if (baseStyleElement) {
      baseStyleElement.textContent = automBaseStyles;
    }

    const styleElement = existingDiv.querySelector(".bx-automator-test-style");
    if (styleElement) {
      styleElement.textContent = updatedStyleContent;
    }
  } else {
    // Create the automator test element
    const div = document.createElement("div");
    div.classList.add("bxc", "bx-automator-test");
    const divClone = document.createElement("div");
    divClone.classList.add("bxc", "bx-automator-test-clone");

    // Create the slab div element
    const childDiv = document.createElement("div");
    childDiv.classList.add("bx-slab");
    const childDivClone = document.createElement("div");
    childDivClone.classList.add("bx-slab");

    // Create the text element and center it
    const textElement = document.createElement("p");
    textElement.textContent = "Automator testing element";
    textElement.style.textAlign = "center";
    childDiv.appendChild(textElement); // Append the text element to the child div

    div.appendChild(childDiv);
    divClone.appendChild(childDivClone);

    // Create the base stylesheet and set its content
    const style = document.createElement("style");
    style.classList.add("bx-automator-test-base-style");
    style.textContent = automBaseStyles;
    div.appendChild(style);

    // Create the bx-automator-test stylesheet
    const style2 = document.createElement("style");
    style2.classList.add("bx-automator-test-style");
    style2.textContent = updatedStyleContent;
    div.appendChild(style2);
    divClone.appendChild(style2.cloneNode(true));

    // Prepend the div to the body
    document.body.prepend(div);
    document.body.prepend(divClone);
  }
};
