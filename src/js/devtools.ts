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
    if (message.subject === "gatherResources") {
      console.log("Gathering resources...");
      chrome.devtools.inspectedWindow.getResources((resources) => {
        const stylesheets = resources.filter(
          (resource) => resource.type === "stylesheet",
        );
        stylesheets.map((resource) => {
          resource.getContent((content) => 
             content
            // run all code that sifts through stylesheets here
          );
          return resource;
        });
      });
      sendResponse("Gathering resources...");
    }

    console.log({ message });
    return true;
  },
);
