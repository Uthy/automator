/* eslint-disable */

export const updateZindex = (zIndex: string) => {
  const getBaseStyles = (zIndex: string): string => `
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
  const $campaign = document.querySelector(".bx-automator-test");
  const $styleElment = $campaign?.querySelector(
    "style.bx-automator-test-base-style",
  );
  const updatedStyles = getBaseStyles(zIndex);

  console.log("Base styles update: ", updatedStyles);

  if (!$campaign) {
    console.log("No campaign found");
    return new Error("No campaign found");
  }
  if ($styleElment) {
    $styleElment.innerHTML = updatedStyles;
  } else {
    console.log("No style element found");
  }
  return true;
};

export default updateZindex;
