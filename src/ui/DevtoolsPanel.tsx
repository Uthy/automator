/* eslint-disable */

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Button, Typography, spacingMap } from "@frontend/wknd-components";
import { getFixedAndStickySelectors } from "../js/automator";
import "../css/fonts.scss";
import "../css/styles.scss";

const extnTitle: string = chrome.runtime.getManifest().name;

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
  }, [styles]);

  return (
    <div style={{ margin: spacingMap.md }}>
      <Typography mb={spacingMap.md} variant="displayMedium">
        {extnTitle}
      </Typography>

      <Typography variant="bodyCopy">{devToolsMessage}</Typography>

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

      {styles.stickyOverZero && (
        <div>
          <h3>For Elements with Sticky Top over 0</h3>
          <pre className="wrap">{styles.stickyOverZero}</pre>
        </div>
      )}
      <div id="panel_form">
        <form>
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
            buttonText="TEST"
            mb={spacingMap.md}
            onClick={() => {
              let tabId = chrome.devtools.inspectedWindow.tabId;
              chrome.scripting.executeScript(
                {
                  target: { tabId: tabId },
                  func: getFixedAndStickySelectors,
                },
                (results: any) => {
                  setStyles(results[0].result);
                },
              );
              // chrome.devtools.inspectedWindow.eval(
              //   `(function() { return document.stylesheets })()`,
              //   (result: any, isException: any) => {
              //     if (isException) {
              //       console.log(isException);
              //     } else {
              //       console.log(result);
              //     }
              //   },
              // );
            }}
          />
          {/* <Button
          buttonText="Get Styles"
          mb={spacingMap.md}
          onClick={() => {
            let tabId = chrome.devtools.inspectedWindow.tabId;
            chrome.scripting.executeScript(
              {
                target: { tabId: tabId },
                func: getFixedAndStickySelectors,
              },
              (results: any) => {
                setStyles(results[0].result);
              },
            );
          }}
          variant="primary"
        /> */}
        </form>
      </div>
      {!!styles && <Typography variant="bodyCopy">Styles found</Typography>}
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<DevtoolsPanel />);
