import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { Button, Typography, spacingMap } from "@frontend/wknd-components";
import "../css/fonts.scss";
import ErrorToast from "./ErrorToast";

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

function DevtoolsPanel() {
  const [showError, setShowError] = useState("");
  const [backgroundMessage, setBackgroundMessage] = useState("");
  const [devToolsMessage, setDevtoolsMessage] = useState("");

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

  return (
    <div style={{ margin: spacingMap.md }}>
      <Typography mb={spacingMap.md} variant="displayLarge">
        {extnTitle}!!!
      </Typography>

      <Button
        buttonText="Send Message to Background"
        mb={spacingMap.md}
        onClick={() => {
          handleMessageRequestClick(postToBackground, setBackgroundMessage);
        }}
        variant="primary"
      />

      <Typography variant="bodyCopy">{backgroundMessage}</Typography>

      <Button
        buttonText="Send Message to Devtools"
        mb={spacingMap.md}
        onClick={() => {
          handleMessageRequestClick(postToDevtools, setDevtoolsMessage);
        }}
        variant="primary"
      />

      <Typography variant="bodyCopy">{devToolsMessage}</Typography>

      {showError && (
        <ErrorToast message={showError} setShowError={setShowError} />
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<DevtoolsPanel />);
