/* eslint-disable */

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Button,
  Icon,
  IconButton,
  Tooltip,
  Typography,
  fontSizes,
  spacingMap,
} from "@frontend/wknd-components";
import { getFixedAndStickySelectors } from "../js/automator";
import { injectAutomTestEle } from "../js/injectElem";
import { updateAnchorPlacement } from "../js/anchorAdjust";
import { setZindex } from "../js/setZindex";
import "../css/fonts.scss";
import "../css/styles.scss";

const extnTitle: string = chrome.runtime.getManifest().name;

interface RuleObj {
  selectors: string[];
  rule: string;
}

interface CSSRuleCollection {
  [key: string]: RuleObj[];
}

interface CSSRulesOutput {
  obj: CSSRuleCollection;
  css: string[];
}

function parseCSS(str: string): CSSRulesOutput {
  const result: CSSRuleCollection = { noQuery: [] };
  let currentRes = "";
  let currentQuery = "";
  let currentSelectors = "";
  let currentRule = "";

  for (const char of str) {
    if (char === "{") {
      currentRes = currentRes.trim();
      if (currentRes.startsWith("@media")) {
        currentQuery = currentRes.trim();
      } else {
        if (!currentSelectors) {
          currentSelectors = currentRes.trim();
        }
      }
      currentRes = "";
    } else if (char === "}") {
      currentRes = currentRes.trim();
      if (!!currentSelectors) {
        currentRule = currentRes;
        var resultToPush: RuleObj = {
          selectors: Array.from(
            new Set(currentSelectors.split(",").map((item) => item.trim())),
          ),
          rule: currentRule,
        };
        if (!!currentQuery) {
          if (!result[currentQuery]) {
            result[currentQuery] = [];
          }
          if (result[currentQuery].length > 0) {
            let found = false;
            result[currentQuery].forEach((item: RuleObj) => {
              if (item.rule === resultToPush.rule) {
                item.selectors = item.selectors.concat(resultToPush.selectors);
                found = true;
              }
            });
            if (!found) {
              result[currentQuery].push(resultToPush);
            }
          } else {
            result[currentQuery].push(resultToPush);
          }
        } else {
          if (result["noQuery"].length > 0) {
            let found = false;
            result["noQuery"].forEach((item: RuleObj) => {
              if (item.rule === resultToPush.rule) {
                item.selectors = item.selectors.concat(resultToPush.selectors);
                found = true;
              }
            });
            if (!found) {
              result["noQuery"].push(resultToPush);
            }
          } else {
            result["noQuery"].push(resultToPush);
          }
        }

        currentSelectors = "";
        currentRule = "";
        currentRes = "";
      } else {
        currentQuery = "";
      }
    } else {
      currentRes += char;
    }
  }

  var rules: string[] = [];
  Object.keys(result).forEach((key) => {
    if (key === "noQuery") {
      result[key].forEach((item: RuleObj) => {
        rules.push(item.selectors.join(", ") + " { " + item.rule + "; }");
      });
    } else {
      rules.push(key + " {");
      result[key].forEach((item: RuleObj) => {
        rules.push(item.selectors.join(", ") + " { " + item.rule + "; }");
      });
      rules.push("}");
    }
  });

  return { obj: result, css: rules };
}

function postToDevtools(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime
      .sendMessage({
        sender: "devtoolsPanel",
        subject: "connectToDevtools",
      })
      .then((response) => {
        resolve(response as string);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

function postToBackground(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime
      .sendMessage({
        sender: "devtoolsPanel",
        subject: "connectToBackground",
        tabIds: chrome.devtools.inspectedWindow.tabId,
      })
      .then((response) => {
        resolve(response as string);
      })
      .catch((e) => {
        reject(e);
      });
  });
}

function gatherResources(): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        sender: "devtoolsPanel",
        subject: "gatherResources",
        tabIds: chrome.devtools.inspectedWindow.tabId,
      },
      (response) => {
        resolve(response as string);
      },
    );
  });
}

function DevtoolsPanel() {
  const [showError, setShowError] = useState(""); // State for general errors
  const [zIndexError, setZIndexError] = useState("");
  const [backgroundMessage, setBackgroundMessage] = useState("");
  const [devToolsMessage, setDevtoolsMessage] = useState("");
  const [styles, setStyles] = useState({} as any);
  const [addClone, setAddClone] = useState(true); // set clone default checked
  const [addResizeListener, setAddResizeListener] = useState(false);
  const [buttonText, setButtonText] = useState("Inject Test Topbar");
  const [isExpanded, setIsExpanded] = useState(false);
  const [anchorError, setAnchorError] = useState("");
  const [isZIndexButtonEnabled, setIsZIndexButtonEnabled] = useState(false);
  const [zIndexButtonText, setZIndexButtonText] = useState("Inject z-index");
  const [zIndexButtonStyle, setZIndexButtonStyle] = useState({});
  const [isReloading, setIsReloading] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0);

  const checkElementStates = () => {
    // Check if the .bx-automator-test element exists
    chrome.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then((response) => {
        let tabId = response[0].id;
        chrome.scripting.executeScript(
          {
            target: { tabId: tabId },
            func: () => !!document.querySelector(".bx-automator-test"),
          },
          (results) => {
            if (results[0].result) {
              setButtonText("Injected - refresh styles");
              setIsZIndexButtonEnabled(true); // Enable z-index button if element exists
            } else {
              setButtonText("Inject Test Topbar");
              setIsZIndexButtonEnabled(false); // Disable z-index button if element doesn't exist
            }
          },
        );
      });

    // Check if the .bx-automation-zindex-fix-style element exists
    chrome.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then((response) => {
        let tabId = response[0].id;
        chrome.scripting.executeScript(
          {
            target: { tabId: tabId },
            func: () =>
              !!document.querySelector(".bx-automation-zindex-fix-style"),
          },
          (results) => {
            if (results[0].result) {
              setZIndexButtonText("Update z-index");
              setZIndexButtonStyle({ backgroundColor: "green" }); // Make the button green
            } else {
              setZIndexButtonText("Set z-index");
              setZIndexButtonStyle({}); // Reset button style
            }
          },
        );
      });
  };

  const handleReloadClick = () => {
    setIsReloading(true); // Start the animation
    checkElementStates(); // Call the function to check element states
    setTimeout(() => setIsReloading(false), 1000); // Reset animation state after 1 second
  };

  useEffect(() => {
    checkElementStates(); // Initial check when the component mounts
  }, []);

  useEffect(() => {
    console.log("Styles updated", styles);
  }, [styles]);

  useEffect(() => {
    const handleFocus = () => {
      checkElementStates(); // Re-check element states when the component regains focus
    };

    // Add event listener for window focus
    window.addEventListener("focus", handleFocus);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  return (
    <div style={{ position: "relative", padding: "30px" }}>
      <div
        style={{
          position: "absolute",
          top: "40px", // Adjust as needed
          right: "40px",
          zIndex: 1000,
        }}
      >
        <Tooltip
          dataQA="tooltip"
          position="bottom-end"
          text="Check for test topbar and z-index elements - refresh button states"
          zIndex={99}
        >
          <IconButton
            aria-label="Check for test topbar and z-index elements"
            dataQA="button-data-qa"
            icon="SearchCodeIcon"
            onClick={() => {
              setRotationAngle((prevAngle) => prevAngle + 360);
              handleReloadClick();
            }}
            variant="primary"
            style={{
              borderRadius: "50%",
              transform: `rotate(${rotationAngle}deg)`,
              transition: "transform 1s ease-in-out",
            }}
          />
        </Tooltip>
      </div>

      <Typography mb={spacingMap.md} variant="displayLarge" dataQA={""}>
        {extnTitle}
      </Typography>

      <Button
        buttonText={"Get Styles"}
        mb={spacingMap.md}
        style={{ marginRight: "5px" }}
        onClick={() => {
          let tabId = chrome.devtools.inspectedWindow.tabId;
          chrome.scripting.executeScript(
            {
              target: { tabId: tabId },
              func: getFixedAndStickySelectors,
            },
            (results: any) => {
              const resultText = results[0].result;
              setStyles(parseCSS(resultText));
              const textarea = document.getElementById(
                "styleTextarea",
              ) as HTMLTextAreaElement;
              textarea.value = resultText;
            },
          );
        }}
        variant="primary"
        dataQA={""}
      />
      <Button
        buttonText={"Clear Styles"}
        mb={spacingMap.md}
        onClick={() => {
          const textarea = document.getElementById(
            "styleTextarea",
          ) as HTMLTextAreaElement;
          textarea.value = "";
        }}
        variant="primary"
        dataQA={""}
      />

      <textarea
        id="styleTextarea"
        placeholder="Enter text"
        style={{ marginBottom: spacingMap.md, width: "100%", height: "150px" }}
      />

      <div style={{ marginBottom: spacingMap.md }}>
        <label>
          <input
            type="checkbox"
            checked={addClone}
            onChange={(e) => {
              setAddClone(e.target.checked);
              if (e.target.checked) {
                chrome.tabs
                  .query({ active: true, lastFocusedWindow: true })
                  .then((response) => {
                    let tabId = response[0].id;
                    chrome.scripting.executeScript(
                      {
                        target: { tabId: tabId },
                        func: () =>
                          !!document.querySelector(".bx-automator-test"),
                      },
                      (results) => {
                        if (results[0].result) {
                          setButtonText("Injected - refresh styles");
                          setIsZIndexButtonEnabled(true);
                        } else {
                          setButtonText("Inject Test Topbar");
                          setIsZIndexButtonEnabled(false);
                        }
                      },
                    );
                  });
              }
            }}
          />
          Add Clone - Enable Site Pushdown
        </label>
      </div>

      <Button
        buttonText={buttonText}
        onClick={() => {
          const textarea = document.getElementById(
            "styleTextarea",
          ) as HTMLTextAreaElement;
          const styleContent = textarea.value;

          chrome.tabs
            .query({ active: true, lastFocusedWindow: true })
            .then((response) => {
              let tabId = response[0].id;

              return chrome.scripting
                .executeScript({
                  target: { tabId: tabId },
                  func: injectAutomTestEle,
                  args: [styleContent, addClone, addResizeListener],
                })
                .then(() => {
                  setButtonText("Injected - refresh styles");
                  setIsZIndexButtonEnabled(true);
                })
                .catch((e) => setShowError(e.message));
            });
        }}
        variant="primary"
        style={{
          backgroundColor:
            buttonText === "Injected - refresh styles" ? "green" : "",
        }}
        dataQA={""}
      />

      {/* z-index input and button */}
      <div style={{ marginTop: spacingMap.md, marginBottom: spacingMap.md }}>
        <label style={{ marginRight: "10px" }}>Set Z-index:</label>
        <input
          type="number"
          id="zIndexInput"
          placeholder="Ex 99"
          style={{
            width: "100px",
            marginRight: "10px",
            height: "26px",
          }}
          disabled={!isZIndexButtonEnabled}
        />
        <Button
          buttonText={zIndexButtonText}
          onClick={() => {
            const zIndexInput = document.getElementById(
              "zIndexInput",
            ) as HTMLInputElement;
            const zIndexValue = zIndexInput.value;

            if (!zIndexValue || isNaN(Number(zIndexValue))) {
              setZIndexError("Please enter a valid number for z-index");
              return;
            }

            setZIndexError("");

            chrome.tabs
              .query({ active: true, lastFocusedWindow: true })
              .then((response) => {
                let tabId = response[0].id;

                return chrome.scripting.executeScript({
                  target: { tabId: tabId },
                  func: setZindex,
                  args: [zIndexValue],
                });
              })
              .then((results) => {
                if (results[0].result) {
                  setZIndexButtonText("Update z-index");
                  setZIndexButtonStyle({ backgroundColor: "green" });
                } else {
                  setZIndexError("Failed to set z-index");
                }
              })
              .catch((e) => setShowError(e.message));
          }}
          variant="primary"
          style={zIndexButtonStyle}
          disabled={!isZIndexButtonEnabled}
          dataQA={""}
        />
        {zIndexError && (
          <Typography
            variant="bodyCopy"
            style={{ color: "red", marginTop: "5px" }}
            dataQA={""}
          >
            {zIndexError}
          </Typography>
        )}
      </div>

      <Button
        buttonText={`Advanced Settings  ${isExpanded ? "  <  Collapse" : "  >  Expand"}`}
        mb={spacingMap.md}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          marginBottom: spacingMap.md,
          marginTop: spacingMap.md,
          display: "block",
        }}
        variant="primary"
        dataQA={""}
      />

      {isExpanded && (
        <>
          <Typography
            mb={spacingMap.md}
            style={{ fontSize: "18px" }}
            variant="headline"
            dataQA={""}
          >
            Advanced Settings
          </Typography>
          <div
            style={{
              border: "2px solid blue",
              padding: "10px",
              marginBottom: spacingMap.md,
            }}
          >
            <div style={{ marginBottom: spacingMap.md }}>
              <Typography
                mb={spacingMap.md}
                style={{ marginBottom: "10px", fontSize: "18px" }}
                variant="bodyCopy"
                dataQA={""}
              >
                Anchor Placement Adjustment
              </Typography>
              <Typography
                mb={spacingMap.md}
                style={{ marginBottom: "5px", fontSize: "14px" }}
                variant="bodyCopy"
                dataQA={""}
              >
                Alternate selector for top bar placement
              </Typography>
              <input
                type="text"
                className="topBarPlacementSelector"
                placeholder="Placement Selector ( .header )"
                style={{
                  marginRight: "10px",
                  width: "200px",
                  height: "26px",
                }}
              />
              <select
                className="placementDropdown"
                style={{
                  marginRight: "20px",
                  width: "100px",
                  height: "32px",
                }}
              >
                <option value="prepend">Prepend</option>
                <option value="append">Append</option>
                <option value="before">Before</option>
                <option value="after">After</option>
              </select>
              <Button
                buttonText={"Update Anchor Placement"}
                onClick={() => {
                  const selector = (
                    document.querySelector(
                      ".topBarPlacementSelector",
                    ) as HTMLInputElement
                  ).value;
                  const placement = (
                    document.querySelector(
                      ".placementDropdown",
                    ) as HTMLSelectElement
                  ).value;

                  chrome.tabs
                    .query({ active: true, lastFocusedWindow: true })
                    .then((response) => {
                      let tabId = response[0].id;

                      return chrome.scripting
                        .executeScript({
                          target: { tabId: tabId },
                          func: (sel) => !!document.querySelector(sel),
                          args: [selector],
                        })
                        .then((results) => {
                          if (results[0].result) {
                            return chrome.scripting.executeScript({
                              target: { tabId: tabId },
                              func: updateAnchorPlacement,
                              args: [selector, placement],
                            });
                          } else {
                            setAnchorError("Selector does not exist");
                            throw new Error("Selector does not exist");
                          }
                        })
                        .then(() => {
                          setShowError("");
                          setAnchorError("");
                        })
                        .catch((e) => setShowError(e.message));
                    });
                }}
                variant="primary"
                dataQA={""}
              />
              {anchorError && (
                <Typography
                  variant="bodyCopy"
                  style={{ color: "red" }}
                  dataQA={""}
                >
                  {anchorError}
                </Typography>
              )}
            </div>
          </div>
        </>
      )}

      <Typography variant="bodyCopy" dataQA={""}>
        {devToolsMessage}
      </Typography>
      <Typography variant="bodyCopy" dataQA={""}>
        {backgroundMessage}
      </Typography>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<DevtoolsPanel />);
