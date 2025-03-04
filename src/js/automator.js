/* eslint-disable */

export const getFixedAndStickySelectors = () => {
  // get all stylesheets
  const stylesheets = document.styleSheets;

  // create empty objects to store selectors for fixed and sticky elements
  const fixedSelectors = {};
  const stickySelectors = {};
  const stickySelectorsOverZero = {};

  // loop through all stylesheets
  for (let i = 0; i < stylesheets.length; i++) {
    try {
      // check if the stylesheet is from another domain
      if (stylesheets[i].href) {
        const sheetOrigin = new URL(stylesheets[i].href).origin;
        const currentOrigin = window.location.origin;
        // if the origin of the stylesheet doesn't match the current origin, skip it
        if (sheetOrigin !== currentOrigin) {
          console.error(
            `stylesheet(s) from ${sheetOrigin} could not be pulled. Same-origin policy.`,
          );
          continue;
        }
      }
      // get all rules in the stylesheet
      const rules = stylesheets[i].rules || stylesheets[i].cssRules;
      // loop through all rules
      for (let j = 0; j < rules.length; j++) {
        // check if the rule is a media query rule
        if (rules[j].type === CSSRule.MEDIA_RULE) {
          // get all the rules inside media query
          const mediaRules = rules[j].cssRules;
          // loop through all media query rules
          for (let k = 0; k < mediaRules.length; k++) {
            // check if the rule is a style rule
            if (mediaRules[k].type === CSSRule.STYLE_RULE) {
              // get the selector for the rule
              const selector = mediaRules[k].selectorText;
              // get the style for the rule
              const style = mediaRules[k].style;
              // check if the element is fixed and has a top value set
              if (
                style.position === "fixed" &&
                style.top &&
                style.height !== "100%" &&
                style.height !== "100vh"
              ) {
                // add the selector and media query rule to the fixedSelectors object
                if (!fixedSelectors[rules[j].conditionText]) {
                  fixedSelectors[rules[j].conditionText] = selector;
                } else {
                  fixedSelectors[rules[j].conditionText] += ", " + selector;
                }
              }
              // check if the element is sticky and has a top value set
              if (
                style.position === "sticky" &&
                style.top &&
                style.height !== "100%" &&
                style.height !== "100vh"
              ) {
                // check if top value is 0
                if (parseFloat(style.top) === 0) {
                  // add the selector and media query rule to the stickySelectorsOverZero object
                  if (!stickySelectors[rules[j].conditionText]) {
                    stickySelectors[rules[j].conditionText] = selector;
                  } else {
                    stickySelectors[rules[j].conditionText] += ", " + selector;
                  }
                } else {
                  if (!stickySelectorsOverZero[rules[j].conditionText]) {
                    stickySelectorsOverZero[rules[j].conditionText] = [
                      { selector, top: style.top },
                    ];
                  } else {
                    stickySelectorsOverZero[rules[j].conditionText].push({
                      selector,
                      top: style.top,
                    });
                  }
                }
              }
            }
          }
        } else if (rules[j].type === CSSRule.STYLE_RULE) {
          // get the selector for the rule
          const selector = rules[j].selectorText;
          // get the style for the rule
          const style = rules[j].style;
          // check if the element is fixed and has a top value set
          if (
            style.position === "fixed" &&
            style.top &&
            style.height !== "100%" &&
            style.height !== "100vh"
          ) {
            // add the selector to the fixedSelectors object
            if (!fixedSelectors["default"]) {
              fixedSelectors["default"] = selector;
            } else {
              fixedSelectors["default"] += ", " + selector;
            }
          }
          // check if the element is sticky and has a top value set
          if (
            style.position === "sticky" &&
            style.top &&
            style.height !== "100%" &&
            style.height !== "100vh"
          ) {
            // check if top value is 0
            if (parseFloat(style.top) === 0) {
              // add the selector to the stickySelectors object
              if (!stickySelectors["default"]) {
                stickySelectors["default"] = selector;
              } else {
                stickySelectors["default"] += ", " + selector;
              }
            } else {
              // if top value is greater than 0 or less than 0
              // add the selector to the stickySelectorsOverZero object
              if (!stickySelectorsOverZero["default"]) {
                stickySelectorsOverZero["default"] = {
                  default: [{ top: style.top, selector }],
                };
              } else {
                stickySelectorsOverZero["default"].default.push({
                  top: style.top,
                  selector,
                });
              }
            }
          }
        }
      }
    } catch (error) {
      // if there is an error accessing the stylesheet, skip it
      continue;
    }
  }

  let fixedCSS = "";
  let stickyCSS = "";
  let stickyOverZeroCSS = "";
  let tempKey;

  //helper function to add the styles to the above variables.
  const addStickyOverZeroCSS = (array, type) => {
    array.forEach((item) => {
      if (type === "default") {
        return (stickyOverZeroCSS += `${item.selector} { top: calc('+pushAmount+'px + ${item.top})}\n`);
      } else {
        return (stickyOverZeroCSS += `@media ${tempKey} { ${item.selector} { top: calc('+pushAmount+'px + ${item.top})} }\n`);
      }
    });
  };

  //Elements that need margin-top
  for (const key in fixedSelectors) {
    if (key === "default") {
      fixedCSS += `${fixedSelectors[key]} { margin-top: '+pushAmount+'px }\n`;
    } else {
      fixedCSS += `@media ${key} { ${fixedSelectors[key]} { margin-top: '+pushAmount+'px } }\n`;
    }
  }

  //Elements with top 0, that need top of pushAmount
  for (const key in stickySelectors) {
    if (key === "default") {
      stickyCSS += `${stickySelectors[key]} { top: '+pushAmount+'px }\n`;
    } else if (key !== "default") {
      stickyCSS += `@media ${key} { ${stickySelectors[key]} { top: '+pushAmount+'px }}\n`;
    }
  }

  //Elements with top > or < 0, that need top of '+pushAmount+'px and current top value.
  for (const key in stickySelectorsOverZero) {
    if (key === "default") {
      const regular = stickySelectorsOverZero[key].default;
      addStickyOverZeroCSS(regular, key);
    } else {
      //temporarily store the media query rule (key).
      tempKey = key;
      const media = stickySelectorsOverZero[key];
      addStickyOverZeroCSS(media, key);
    }
  }

  // combine all the CSS into one string
  const combinedCSS = fixedCSS + stickyCSS + stickyOverZeroCSS;

  // return the combined CSS for fixed and sticky elements
  return combinedCSS;
};
