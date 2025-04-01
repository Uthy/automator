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

  if (
    message.sender === "automator" &&
    message.subject === "fetchExternalStylesheets" &&
    message.urls
  ) {
    Promise.all(
      message.urls.map((url) =>
        fetch(url)
          .then((response) => response.text())
          .catch((error) => {
            console.error(`Failed to fetch ${url}:`, error);
            return null;
          }),
      ),
    )
      .then((results) => {
        sendResponse(results.join("\n"));
      })
      .catch((error) => {
        console.error("Failed at background; ", error);
      });

    return true; // Keep channel open for async response.
  }

  return false; // default return for any unhandled messages.
};

chrome.runtime.onMessage.addListener(backgroundListener);
