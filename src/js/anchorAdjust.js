/* eslint-disable */

export function updateAnchorPlacement(selector, placement) {
  const targetElement = document.querySelector(selector);
  const automatorElement = document.querySelector(".bx-automator-test");

  if (!targetElement || !automatorElement) {
    console.error("Target element or .bx-automator-test element not found");
    return;
  }

  automatorElement.remove();

  switch (placement) {
    case "prepend":
      targetElement.prepend(automatorElement);
      break;
    case "append":
      targetElement.append(automatorElement);
      break;
    case "before":
      targetElement.parentNode.insertBefore(automatorElement, targetElement);
      break;
    case "after":
      targetElement.parentNode.insertBefore(
        automatorElement,
        targetElement.nextSibling,
      );
      break;
    default:
      console.error("Invalid placement option");
  }
}
