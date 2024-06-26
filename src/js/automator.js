/* eslint-disable */

export const getFixedAndStickySelectors = () => {
  // get all stylesheets
  var stylesheets = document.styleSheets;

  // create empty objects to store selectors for fixed and sticky elements
  var fixedSelectors = {};
  var stickySelectors = {};
  var stickySelectorsOverZero = {};

  // loop through all stylesheets
  for (var i = 0; i < stylesheets.length; i++) {
    try {
      // check if the stylesheet is from another domain
      if (stylesheets[i].href) {
        var sheetOrigin = new URL(stylesheets[i].href).origin;
        var currentOrigin = window.location.origin;
        // if the origin of the stylesheet doesn't match the current origin, skip it
        if (sheetOrigin !== currentOrigin) {
          console.error(
            "stylesheet(s) from " +
              sheetOrigin +
              " could not be pulled. Same-origin policy.",
          );
          continue;
        }
      }
      // get all rules in the stylesheet
      var rules = stylesheets[i].rules || stylesheets[i].cssRules;
      // loop through all rules
      for (var j = 0; j < rules.length; j++) {
        // check if the rule is a media query rule
        if (rules[j].type === CSSRule.MEDIA_RULE) {
          // get all the rules inside media query
          var mediaRules = rules[j].cssRules;
          // loop through all media query rules
          for (var k = 0; k < mediaRules.length; k++) {
            // check if the rule is a style rule
            if (mediaRules[k].type === CSSRule.STYLE_RULE) {
              // get the selector for the rule
              var selector = mediaRules[k].selectorText;
              // get the style for the rule
              var style = mediaRules[k].style;
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
                      { selector: selector, top: style.top },
                    ];
                  } else {
                    stickySelectorsOverZero[rules[j].conditionText].push({
                      selector: selector,
                      top: style.top,
                    });
                  }
                }
              }
            }
          }
        } else if (rules[j].type === CSSRule.STYLE_RULE) {
          // get the selector for the rule
          var selector = rules[j].selectorText;
          // get the style for the rule
          var style = rules[j].style;
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
                  default: [{ top: style.top, selector: selector }],
                };
              } else {
                stickySelectorsOverZero["default"].default.push({
                  top: style.top,
                  selector: selector,
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

  var fixedCSS = "";
  var stickyCSS = "";
  var stickyOverZeroCSS = "";

  //helper function to add the styles to the above variables.
  function addStickyOverZeroCSS(array, type) {
    array.forEach(function (item, i) {
      if (type === "default") {
        return (stickyOverZeroCSS +=
          item.selector +
          " { top: calc(" +
          "pushAmount + " +
          item.top +
          ")}" +
          "\n");
      } else {
        return (stickyOverZeroCSS +=
          "@media " +
          tempKey +
          " { " +
          item.selector +
          " { top:  calc (pushAmount + " +
          item.top +
          ")} " +
          "}" +
          "\n");
      }
    });
  }
  //Elements that need margin-top
  for (let key in fixedSelectors) {
    if (key === "default") {
      fixedCSS += fixedSelectors[key] + " { margin-top: pushAmount } " + "\n";
    } else {
      fixedCSS +=
        "@media " +
        key +
        " { " +
        fixedSelectors[key] +
        " { margin-top: pushAmount } }" +
        "\n";
    }
  }

  //Elements with top 0, that need top of pushAmount
  for (let key in stickySelectors) {
    if (key === "default") {
      stickyCSS += stickySelectors[key] + " { top: pushAmount }" + "\n";
    } else if (key !== "default" && parseFloat(style.top) === 0) {
      stickyCSS +=
        "@media " +
        key +
        "{ " +
        stickySelectors[key] +
        "{ top: pushAmount }}" +
        "\n";
    }
  }

  //Elements with top > or < 0, that need top of pushAmount and current top value.
  for (let key in stickySelectorsOverZero) {
    if (key === "default") {
      var regular = stickySelectorsOverZero[key].default;
      addStickyOverZeroCSS(regular, key);
    } else {
      //temporarily store the media query rule (key).
      var tempKey = key;
      var media = stickySelectorsOverZero[key];
      addStickyOverZeroCSS(media, key);
    }
  }

  // console.log("%c" + 'FIXED' + '\n' + fixedCSS, "color: #030303; background: #e9c46a; padding: 5px;")
  // console.log("%c" + 'STICKY-TOP=0' + '\n' + stickyCSS, "color: #030303; background: #f4a261; padding: 5px;")
  // console.log("%c" + 'STICKY-TOP>0' + '\n' + stickyOverZeroCSS, "color: white; background: #264653; padding: 5px;")

  // return the combined CSS for fixed and sticky elements
  return {
    fixedCSS: fixedCSS,
    stickyCSS: stickyCSS,
    stickyOverZeroCSS: stickyOverZeroCSS,
  };
};
