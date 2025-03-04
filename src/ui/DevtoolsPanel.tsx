/* eslint-disable */

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Button, Typography, spacingMap } from "@frontend/wknd-components";
import { getFixedAndStickySelectors } from "../js/automator";
import "../css/fonts.scss";
import "../css/styles.scss";

const extnTitle: string = chrome.runtime.getManifest().name;

interface Rule {
  selectors: string[];
  rule: string;
}

interface Result {
  [key: string]: Rule[];
}

function parseCSS(str: string): Result {
  const result: Result = { noQuery: [] };
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
        var resultToPush: Rule = {
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
            result[currentQuery].forEach((item: Rule) => {
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
            result["noQuery"].forEach((item: Rule) => {
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

  console.log({ result });
  return result;
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

  function handleMessageRequestClick(
    requestMsg: () => Promise<string>,
    setMsg: React.Dispatch<React.SetStateAction<string>>,
  ) {
    requestMsg()
      .then((results) => {
        setMsg(results);
      })
      .catch((e) => {
        setShowError(e as string);
      });
  }

  useEffect(() => {
    console.log("Styles updated", styles);
    var rules: string[] = [];
    Object.keys(styles).forEach((key) => {
      console.log("Key", key);
      if (key === "noQuery") {
        styles[key].forEach((item: Rule) => {
          item.selectors.forEach((selector) => {
            rules.push(selector + " { " + item.rule + "; }");
          });
        });
      } else {
        styles[key].forEach((item: Rule) => {
          item.selectors.forEach((selector) => {
            rules.push(key + " {" + selector + " { " + item.rule + "; }}");
          });
        });
      }
    });
    console.log("Rules", rules);
  }, [styles]);

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
              setStyles(parseCSS(results[0].result));
            },
          );
        }}
        variant="primary"
      />

      <Typography variant="bodyCopy">{devToolsMessage}</Typography>
      <Typography variant="bodyCopy">{backgroundMessage}</Typography>

      {/* {styles.fixedCSS && (
        <div>
          <h3>For Fixed Elements</h3>
          <pre className="wrap">{styles.fixedCSS}</pre>
        </div>
      )}

      {styles.stickyCSS && (
        <div>
          <h3>For Sticky Elements</h3>
          <pre className="wrap">{styles.stickyCSS}</pre>
        </div>
      )}

      {styles.stickyOverZeroCSS && (
        <div>
          <h3>For Elements with Sticky Top over 0</h3>
          <pre className="wrap">{styles.stickyOverZeroCSS}</pre>
        </div>
      )} */}
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<DevtoolsPanel />);
