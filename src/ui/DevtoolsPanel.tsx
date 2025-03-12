/* eslint-disable */

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Button,
  Typography,
  fontSizes,
  spacingMap,
} from "@frontend/wknd-components";
import { getFixedAndStickySelectors } from "../js/automator";
import { injectAutomTestEle } from "../js/injectElem";
import { updateAnchorPlacement } from "../js/anchorAdjust";
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
  const [showError, setShowError] = useState("");
  const [backgroundMessage, setBackgroundMessage] = useState("");
  const [devToolsMessage, setDevtoolsMessage] = useState("");
  const [styles, setStyles] = useState({} as any);
  const [addClone, setAddClone] = useState(true); // set Default checked
  const [addResizeListener, setAddResizeListener] = useState(false);
  const [buttonText, setButtonText] = useState("Inject Test Topbar");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    console.log("Styles updated", styles);
  }, [styles]);

  useEffect(() => {
    // Check if the .bx-automator-test element exists on the site
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
            } else {
              setButtonText("Inject Test Topbar");
            }
          },
        );
      });
  }, []);

  return (
    <div style={{ margin: spacingMap.md }}>
      <Typography mb={spacingMap.md} variant="displayLarge">
        {extnTitle}
      </Typography>

      <Button
        buttonText={"Get Styles"}
        mb={spacingMap.md}
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
                        } else {
                          setButtonText("Inject Test Topbar");
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
        mb={spacingMap.md}
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
                })
                .catch((e) => setShowError(e.message));
            });
        }}
        variant="primary"
        style={{
          backgroundColor:
            buttonText === "Injected - refresh styles" ? "green" : "",
        }}
      />

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
      />

      {isExpanded && (
        <>
          <Typography
            mb={spacingMap.md}
            style={{ fontSize: "20px" }}
            variant="headline"
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
            <Typography
              mb={spacingMap.md}
              style={{ marginBottom: "10px", fontSize: "18px" }}
              variant="bodyCopy"
            >
              Anchor Placement Adjustment
            </Typography>
            <Typography
              mb={spacingMap.md}
              style={{ marginBottom: "5px", fontSize: "14px" }}
              variant="bodyCopy"
            >
              Alternate selector for top bar placement
            </Typography>
            <input
              type="text"
              className="topBarPlacementSelector"
              placeholder="Placement Selector ( .header )"
              style={{
                marginBottom: spacingMap.md,
                marginRight: "10px",
                width: "200px",
                height: "26px",
              }}
            />
            <select
              className="placementDropdown"
              style={{
                marginBottom: spacingMap.md,
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
              mb={spacingMap.md}
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
                        func: updateAnchorPlacement,
                        args: [selector, placement],
                      })
                      .then(() => {
                        setShowError("");
                      })
                      .catch((e) => setShowError(e.message));
                  });
              }}
              variant="primary"
            />
          </div>
        </>
      )}

      <Typography variant="bodyCopy">{devToolsMessage}</Typography>
      <Typography variant="bodyCopy">{backgroundMessage}</Typography>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<DevtoolsPanel />);
