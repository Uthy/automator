/* eslint-disable */

export const injectAutomTestEle = (
  styleContent,
  addClone,
  addResizeListener,
  zIndexValue = 1000,
) => {
  // Function to generate automBaseStyles dynamically
  const generateAutomBaseStyles = (zIndex) => `
    .bx-automator-test .bx-slab {
      position: fixed;
      top: 0;
      background-color: rgba(165, 165, 255, 0.85);
      height: 40px;
      width: 100vw;
      z-index: ${zIndex};
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
    .bx-automator-test p {
      font-size: 16px;
      color: black;
      font-weight: bold;
    }
    .bx-automator-test-clone p {
        visibility: hidden;
        margin: 0;
        padding: 0;
    }
    @media (max-width: 768px) {
      .bx-automator-test .bx-slab, .bx-automator-test-clone .bx-slab {
        height: 50px;
      }
    }
  `;

  // Generate styles with the current zIndexValue
  const automBaseStyles = generateAutomBaseStyles(zIndexValue);

  // Get the current height of the .bx-automator-test .bx-slab
  function getCurrentHeight() {
    const slabElement = document.querySelector(".bx-automator-test .bx-slab");
    if (slabElement) {
      const computedStyle = getComputedStyle(slabElement);
      return parseFloat(computedStyle.height);
    }
    return 40; // Default height
  }

  const heightValue = getCurrentHeight();

  // Replace '+pushAmount+' in styleContent with the height value, including the enclosing '
  const updatedStyleContent =
    typeof styleContent === "string"
      ? styleContent.replace(/'\+pushAmount\+'/g, heightValue.toString())
      : "";

  // Function to create and inject the element
  function createAndInjectElement(className, styleContent, injectStyles) {
    // Create the automator test element
    const div = document.createElement("div");
    div.classList.add("bxc", className);

    // Create the slab div
    const childDiv = document.createElement("div");
    childDiv.classList.add("bx-slab");

    // Create the text element and center it
    const textElement = document.createElement("p");
    textElement.textContent = "Automator testing element";
    textElement.style.textAlign = "center";
    childDiv.appendChild(textElement); // Append the text element to the child div

    div.appendChild(childDiv);

    if (injectStyles) {
      // Create the base stylesheet and set its content
      const baseStyle = document.createElement("style");
      baseStyle.classList.add("bx-automator-test-base-style");
      baseStyle.textContent = automBaseStyles;
      div.appendChild(baseStyle);

      // Create the bx-automator-test stylesheet
      const style = document.createElement("style");
      style.classList.add("bx-automator-test-style");
      style.textContent = styleContent;
      div.appendChild(style);
    }

    // Prepend the topbar to the body
    document.body.prepend(div);
  }

  // Check if the topbar already exists
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
    // Create and inject the original element
    createAndInjectElement("bx-automator-test", updatedStyleContent, true);
  }

  // Create and inject the clone element if addClone is true and clone does not already exist
  // const existingClone = document.querySelector(".bx-automator-test-clone");

  // If no clone, add. Display can be controlled separately for an easier interface - DS 3/15/2025
  if (document.querySelectorAll(".bx-automator-test-clone").length === 0) {
    console.log("Creating clone");
    createAndInjectElement(
      "bx-automator-test-clone",
      updatedStyleContent,
      false,
    );
  } else {
    console.log("Clone already exists.");
  }

  if (addClone) {
    document.querySelector(".bx-automator-test-clone").style.display = "block";
  } else {
    document.querySelector(".bx-automator-test-clone").style.display = "none";
  }

  // inlcuding a return object to help control state - DS 3/15/2025
  var $campaign = document.querySelectorAll(".bx-automator-test").length > 0,
    $clone = document.querySelectorAll(".bx-automator-test-clone").length > 0,
    $styleElement =
      document.querySelectorAll(".bx-automator-test-style").length > 0;

  return {
    $campaign,
    $clone,
    $styleElement,
  };

  /* Add resize event listener to invoke injectAutomTestEle if addResizeListener is true
  //Not working scoping issue from running getting height to update the style
  if (addResizeListener) {
    // Remove any existing resize.bx-automator event listener
    window.removeEventListener('resize.automator', handleResize);

    // Define the resize event handler
    function handleResize() {
      const slabEle = document.querySelector('.bx-automator-test .bx-slab');
      const slabHeightValue = 40;
      if (slabEle) {
        const computedSlabStyle = getComputedStyle(slabEle);
        slabHeightValue = parseFloat(computedSlabStyle.height);
      }
      const updatedStyleContent = typeof styleContent === 'string' ? styleContent.replace(/'\+pushAmount\+'/g, slabHeightValue.toString()) : '';
      const existingDiv = document.querySelector('.bx-automator-test');
      injectAutomTestEle(updatedStyleContent, existingDiv ? false : addClone, addResizeListener);
    }

    // Add the new resize event listener
    window.addEventListener('resize.automator', handleResize);
  }*/
};
