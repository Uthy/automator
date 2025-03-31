/* eslint-disable */

export function updateAnchorPlacement(
  targetElement: HTMLElement,
  automatorElement: HTMLElement,
  placement: "prepend" | "append" | "before" | "after",
): boolean {
  if (!targetElement || !automatorElement) {
    console.error("Target element or .bx-automator-test element not found");
    return false;
  }

  if (targetElement === automatorElement) {
    console.error("Target element and .bx-automator-test element are the same");
    return false;
  }

  try {
    switch (placement) {
      case "prepend":
        targetElement.prepend(automatorElement);
        break;
      case "append":
        targetElement.append(automatorElement);
        break;
      case "before":
        targetElement.parentNode?.insertBefore(automatorElement, targetElement);
        break;
      case "after":
        targetElement.parentNode?.insertBefore(
          automatorElement,
          targetElement.nextSibling,
        );
        break;
      default:
        console.error("Invalid placement option");
        return false;
    }
    return true; // Indicate success
  } catch (error) {
    console.error("Error updating anchor placement:", error);
    return false; // Indicate failure
  }
}
