/* eslint-disable */

import React, { useState } from "react";
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
  noQuery: Rule[];
  mediaQueries: { [key: string]: Rule[] };
}

function parseCSS(str: string): Result {
  const result: Result = { noQuery: [], mediaQueries: {} };
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
      if (currentSelectors) {
        currentRule = currentRes;
        if (!currentQuery) {
          if (!result.noQuery.some((item) => item.rule === currentRule)) {
            var resultToPush: Rule = {
              selectors: currentSelectors.split(",").map((item) => item.trim()),
              rule: currentRule,
            };
            // resultToPush.selectors = currentSelectors.split(",").map((item) => item.trim());
            // resultToPush.rule = currentRule;
            result.noQuery.push(resultToPush);
          } else {
            const matchIndex = result.noQuery.findIndex(
              (item) => item.rule === currentRule,
            );
            result.noQuery[matchIndex].selectors = result.noQuery[
              matchIndex
            ].selectors.concat(
              currentSelectors.split(",").map((item) => item.trim()),
            );
          }
        } else {
          if (!result.mediaQueries[currentQuery]) {
            result.mediaQueries[currentQuery] = [];
          }
          var resultToPush: Rule = {
            selectors: currentSelectors.split(",").map((item) => item.trim()),
            rule: currentRule,
          };
          // resultToPush.selectors = currentSelectors.split(",").map((item) => item.trim());
          // resultToPush.rule = currentRule;
          result.mediaQueries[currentQuery].push(resultToPush);
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

  function organizeStyles(styles: {
    stickyCSS: string;
    fixedCSS: string;
    stickyOverZeroCSS: string;
  }) {
    // console.log({ styles });
    var result = {};
    var fullString =
        styles.stickyCSS + styles.fixedCSS + styles.stickyOverZeroCSS,
      queries = fullString.matchAll(/@media[^{]+/gi);
    queries.forEach((query) => {
      // console.log({ query });
      if (!Object.keys(result).includes(query[0].trim())) {
        result[query[0].trim()] = [];
      }
    });
    console.log({ result });
  }

  return (
    <div style={{ margin: spacingMap.md }}>
      <Typography mb={spacingMap.md} variant="displayLarge">
        {extnTitle}!!!
      </Typography>

      {/* <Button
        buttonText="Send Message to Devtools"
        mb={spacingMap.md}
        onClick={() => {
          handleMessageRequestClick(postToDevtools, setDevtoolsMessage);
        }}
        variant="primary"
      /> */}

      {/* <Button
        buttonText="Gather resources"
        mb={spacingMap.md}
        onClick={() => {
          handleMessageRequestClick(gatherResources, setBackgroundMessage);
        }}
        variant="primary"
      /> */}
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
              console.log({ results });
              // setStyles(results[0].result);
              // organizeStyles(results[0].result);
              var fullString =
                results[0].result.stickyCSS +
                results[0].result.fixedCSS +
                results[0].result.stickyOverZeroCSS;
              var parsed = parseCSS(fullString);
              console.log({ parsed });
            },
          );
        }}
        variant="primary"
      />

      {/* <Button 
        buttonText="Send Message to Background"
        mb={spacingMap.md}
        onClick={() => {
          handleMessageRequestClick(postToBackground, setBackgroundMessage);
        }}
        variant="primary"
      /> */}

      <Typography variant="bodyCopy">{devToolsMessage}</Typography>
      <Typography variant="bodyCopy">{backgroundMessage}</Typography>

      {styles.fixedCSS && (
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
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<DevtoolsPanel />);
