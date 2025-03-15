export const injectFunctionTest = (styles: string) => {
  const $campaign = document.querySelector(".bx-automator-test");
    const $slab = $campaign?.querySelector(".bx-slab");
    const $styleElment = $campaign?.querySelector("style.bx-automator-test-style");
  const pushAmount = $slab?.clientHeight || 0;
    const styleString = styles.replaceAll(`'+pushAmount+'`, pushAmount.toString());
  if (!$campaign) {
    console.log("No campaign found");
    return new Error("No campaign found");
  }
  if ($styleElment) {
    $styleElment.innerHTML = styleString;
  } else {
    console.log("No style element found");
  }
  return true;
};

export default injectFunctionTest;
