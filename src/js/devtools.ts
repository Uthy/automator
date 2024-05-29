import type { MessageInterface } from "../types/global.d.js";

chrome.devtools.panels.create(
  chrome.runtime.getManifest().name,
  "",
  "devtools-panel.html",
);

chrome.runtime.onMessage.addListener(
  (
    message: MessageInterface,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: string) => void,
  ) => {
    if (
      message.sender === "devtoolsPanel" &&
      message.subject === "connectToDevtools"
    ) {
      sendResponse("Hello from devtools.js");
    }

    return true;
  },
);
