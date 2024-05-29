import type { MessageInterface } from "../types/global.d.js";

const backgroundListener = (
  message: MessageInterface,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: string) => void,
) => {
  if (
    message.sender === "devtoolsPanel" &&
    message.subject === "connectToBackground"
  ) {
    sendResponse("Hello from background.ts");
  }

  return true;
};

chrome.runtime.onMessage.addListener(backgroundListener);
