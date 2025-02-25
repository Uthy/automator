import type { MessageInterface } from "../types/global.d.js";

function insertStylesheet(content: string) {
  const style = document.createElement("style");
  style.textContent = content;
  document.head.appendChild(style);
  // console.log("inserting stylesheet:", content);
  return null;
}

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
    console.log({ message, sender });
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
          (resource: chrome.devtools.inspectedWindow.Resource) =>
            resource.type === "stylesheet",
        );
        stylesheets.map((resource) => {
          resource.getContent((content) => {
            // run all code that sifts through stylesheets here
            console.log({ resource, content });
            chrome.scripting
              .executeScript({
                target: { tabId: message.tabIds },
                func: insertStylesheet,
                args: [content],
              })
              .then((res) => {
                console.log({ res });
              })
              .catch((err) => console.error(err));
          });
          return resource;
        });
      });
      sendResponse("Gathering resources...");
    }

    return true;
  },
);
