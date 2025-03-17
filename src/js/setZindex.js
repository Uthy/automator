/* eslint-disable */

export const setZindex = (zIndexValue) => {
  if (!zIndexValue) {
    console.error("z-index value is required");
    return false; // Return false if no z-index value is provided
  }

  // Find the .bx-automator-test element
  const automatorTestElement = document.querySelector(".bx-automator-test");

  if (!automatorTestElement) {
    console.error(".bx-automator-test element not found");
    return false; // Return false if the target element doesn't exist
  }

  // Check if the z-index fix style already exists
  const existingStyle = document.querySelector(
    ".bx-automation-zindex-fix-style",
  );
  if (existingStyle) {
    // Update the existing style content
    existingStyle.textContent = `.bxc.bx-automator-test .bx-slab { z-index: ${zIndexValue}; }`;
    return true; // Return true if the style was updated
  } else {
    // Create a new style element for the z-index fix
    const style = document.createElement("style");
    style.classList.add("bx-automation-zindex-fix-style");
    style.textContent = `.bxc.bx-automator-test .bx-slab { z-index: ${zIndexValue}; }`;

    // Append the style element to the .bx-automator-test element
    automatorTestElement.appendChild(style);
    return true; // Return true if the style was added
  }
};
