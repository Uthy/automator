/* eslint-disable */

export const getFixedAndStickySelectors = () => {
  return new Promise((resolve) => {
    // get all stylesheets
    let stylesheets = document.styleSheets;
    const externalSheets = [];

    // First identify external sheets
    for (let i = 0; i < stylesheets.length; i++) {
      try {
        if (stylesheets[i].href) {
          const sheetOrigin = new URL(stylesheets[i].href).origin;
          if (
            sheetOrigin !== window.location.origin &&
            !stylesheets[i].href.includes("bounceexchange.com")
          ) {
            externalSheets.push(stylesheets[i].href);
          }
        }
      } catch (error) {
        console.error("Error checking stylesheet:", error);
      }
    }

    // If we have external sheets, fetch them first
    if (externalSheets.length > 0) {
      chrome.runtime.sendMessage(
        {
          sender: "automator",
          subject: "fetchExternalStylesheets",
          urls: externalSheets,
        },
        function (response) {
          console.log("Automator: Received response from background");

          const allSheets = Array.from(stylesheets);
          if (response) {
            console.log(
              "Processing external stylesheet response, create a style element and set the response in it.",
            );

            // Remove any existing style element added by automator.
            const existingExtStyle = document.getElementById(
              "automator-external-stylesheet",
            );
            if (existingExtStyle) {
              console.log("Remove existing external style created");
              existingExtStyle.remove();
            }

            const style = document.createElement("style");
            style.id = "automator-external-stylesheet";
            style.textContent = response;
            document.head.appendChild(style);

            if (style.sheet) {
              console.log(
                `Succesfully created stylesheet with ${style.sheet.cssRules.length || 0} rules`,
              );
              allSheets.push(style.sheet);
            } else {
              console.error("Failed to create stylesheet");
            }
          } else {
            console.warn("Background - Automator: No response received");
          }

          // Now process everything once
          processAllStylesheets(allSheets);
        },
      );
    } else {
      // No external sheets, process immediately
      processAllStylesheets(stylesheets);
    }

    // Use existing code to process all stylesheets
    function processAllStylesheets(sheets) {
      const fixedSelectors = {};
      const stickySelectors = {};
      const stickySelectorsOverZero = {};

      // First pass: collect external sheets and process local ones
      for (let i = 0; i < sheets.length; i++) {
        try {
          if (sheets[i].href) {
            const sheetOrigin = new URL(sheets[i].href).origin;
            const currentOrigin = window.location.origin;
            if (sheetOrigin !== currentOrigin) {
              console.info(`External stylesheet: ${sheets[i].href} `);
              continue;
            }
          }
          // get all rules in the stylesheet
          const rules = sheets[i].rules || sheets[i].cssRules;
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
                        stickySelectors[rules[j].conditionText] +=
                          ", " + selector;
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
          console.error("Error processing stylesheet:", error);
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

      resolve(combinedCSS);
    }
  });
};
