/* eslint-disable */

import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Button,
  Input,
  Typography,
  spacingMap,
  Toggle,
  TextArea,
} from "@frontend/wknd-components";
import { getFixedAndStickySelectors } from "../js/automator";
import { injectAutomTestEle } from "../js/injectElem";
import "../css/fonts.scss";
import "../css/styles.scss";
import { injectFunctionTest } from "../js/injectFunctionTest";
import { updateZindex } from "../js/updateZindex";
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
          ).filter((item) => !item.includes("bx-automator-test")),
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
                item.selectors = item.selectors
                  .concat(resultToPush.selectors)
                  .filter((item) => !item.includes("bx-automator-test"));
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
                item.selectors = item.selectors
                  .concat(resultToPush.selectors)
                  .filter((item) => !item.includes("bx-automator-test"));
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

// function postToDevtools(): Promise<string> {
//   return new Promise((resolve, reject) => {
//     chrome.runtime
//       .sendMessage({
//         sender: "devtoolsPanel",
//         subject: "connectToDevtools",
//       })
//       .then((response) => {
//         resolve(response as string);
//       })
//       .catch((e) => {
//         reject(e);
//       });
//   });
// }

// function postToBackground(): Promise<string> {
//   return new Promise((resolve, reject) => {
//     chrome.runtime
//       .sendMessage({
//         sender: "devtoolsPanel",
//         subject: "connectToBackground",
//         tabIds: chrome.devtools.inspectedWindow.tabId,
//       })
//       .then((response) => {
//         resolve(response as string);
//       })
//       .catch((e) => {
//         reject(e);
//       });
//   });
// }

// function gatherResources(): Promise<string> {
//   return new Promise((resolve, reject) => {
//     chrome.runtime.sendMessage(
//       {
//         sender: "devtoolsPanel",
//         subject: "gatherResources",
//         tabIds: chrome.devtools.inspectedWindow.tabId,
//       },
//       (response) => {
//         resolve(response as string);
//       },
//     );
//   });
// }

function DevtoolsPanel() {
  const [errorMsg, setErrorMsg] = useState("");
  const [backgroundMessage, setBackgroundMessage] = useState("");
  const [devToolsMessage, setDevtoolsMessage] = useState("");
  const [styles, setStyles] = useState({} as any);
  const [addClone, setAddClone] = useState(true); // set Default checked
  const [addResizeListener, setAddResizeListener] = useState(false);
  // const [buttonText, setButtonText] = useState("Inject Test Topbar");
  const [elementsQuery, setElementsQuery] = useState({} as any);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const zIndexInput = document.getElementById(
    "zIndexInput",
  ) as HTMLInputElement;
  const [zIndexError, setZIndexError] = useState(false); // State to track if the input is invalid

  // function handleMessageRequestClick(
  //   requestMsg: () => Promise<string>,
  //   setMsg: React.Dispatch<React.SetStateAction<string>>,
  // ) {
  //   requestMsg()
  //     .then((results) => {
  //       setMsg(results);
  //     })
  //     .catch((e) => {
  //       setErrorMsg(e as string);
  //     });
  // }

  const handleToggleClone = () => {
    setAddClone(!addClone);
    if (!elementsQuery.$clone) {
      console.log("No clone found - skipping");
      return;
    }
    console.log("Clone found. Running script");
    chrome.scripting.executeScript(
      {
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        func: (addClone) => {
          addClone = !addClone;
          const $campaign = document.querySelector(".bx-automator-test"),
            $clone = document.querySelector(".bx-automator-test-clone") || null,
            $style =
              $campaign?.querySelector("style.bx-automator-test-style") || null;
          console.log({ addClone });
          if (addClone) {
            if (!$clone) {
              console.log("No clone found");
            } else {
              $clone.style.display = "block";
            }
          } else {
            if (!$clone) {
              console.log("No clone found");
            } else {
              $clone.style.display = "none";
            }
          }
          return {
            $campaign: !!$campaign,
            $clone: !!$clone,
            $style: !!$style,
          };
        },
        args: [addClone],
      },
      (results) => {
        console.log("Results", results);
        setElementsQuery(results[0].result || {});
      },
    );
  };

  const handleRefreshStyles = () => {
    chrome.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then(async (response) => {
        let tabId = response[0].id;
        if (!tabId) {
          return setErrorMsg("No tab found");
        }
        try {
          return await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: injectFunctionTest,
            args: [textareaRef.current?.value || ""],
          });
        } catch (e) {
          return setErrorMsg(e.message);
        }
      });
  };

  const handleRefreshBaseStyles = () => {
    const zIndexValue = zIndexInput?.value || "";

    // Check if the value is empty, clear the error state
    if (zIndexValue.trim() === "") {
      setZIndexError(false);
      return;
    }

    // Check if the value is a valid number, set error state if it's not
    if (isNaN(Number(zIndexValue))) {
      setZIndexError(true);
      return;
    }

    setZIndexError(false);

    chrome.tabs
      .query({ active: true, lastFocusedWindow: true })
      .then(async (response) => {
        let tabId = response[0].id;
        if (!tabId) {
          return setErrorMsg("No tab found");
        }
        try {
          return await chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: updateZindex,
            args: [zIndexValue],
          });
        } catch (e) {
          return setErrorMsg(e.message);
        }
      });
  };

  const handleInjectTestTopbar = () => {
    const textarea = document.getElementById(
      "styleTextarea",
    ) as HTMLTextAreaElement;
    const styleContent = textarea.value;

    const zIndexInput = document.getElementById(
      "zIndexInput",
    ) as HTMLInputElement;
    const zIndex = zIndexInput?.value || "2147483647";

    chrome.scripting.executeScript(
      {
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        func: injectAutomTestEle,
        args: [styleContent, addClone, addResizeListener, zIndex],
      },
      (results) => {
        console.log({ results });
        console.log(zIndex);
        setElementsQuery(results[0].result || {});
      },
    );
  };

  const handleGetStyles = () => {
    let tabId = chrome.devtools.inspectedWindow.tabId;
    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        func: getFixedAndStickySelectors,
      },
      (results: any) => {
        const resultText = results[0].result;
        const resultObj = parseCSS(resultText);
        setStyles(resultObj);
        const textarea = document.getElementById(
          "styleTextarea",
        ) as HTMLTextAreaElement;
        textarea.value = resultObj.css.join("\n");
      },
    );
  };

  const handleClearStyles = () => {
    const textarea = document.getElementById(
      "styleTextarea",
    ) as HTMLTextAreaElement;
    textarea.value = "";
    chrome.scripting.executeScript({
      target: { tabId: chrome.devtools.inspectedWindow.tabId },
      func: () => {
        const $campaign = document.querySelector(".bx-automator-test"),
          $styleElment = $campaign?.querySelector(
            "style.bx-automator-test-style",
          );
        if ($styleElment) {
          $styleElment.innerHTML = "";
        }
      },
    });
    setStyles({});
  };

  useEffect(() => {
    console.log("Devtools Panel mounted");
    chrome.scripting.executeScript(
      {
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        func: () => {
          let result = {
            $campaign:
              document.querySelectorAll(".bx-automator-test").length > 0,
            $clone:
              document.querySelectorAll(".bx-automator-test-clone").length > 0,
            $styleElment:
              document.querySelectorAll("style.bx-automator-test-style")
                .length > 0,
          };
          return result;
        },
      },
      (results) => {
        setElementsQuery(results[0].result || {});
      },
    );
  }, []);

  return (
    <div style={{ margin: spacingMap.md }}>
      <Typography mb={spacingMap.md} variant="displayLarge" dataQA="extn-title">
        {extnTitle}
      </Typography>

      {!styles.css ? (
        <Button
          buttonText={"Get Styles"}
          mt={spacingMap.sm}
          mb={spacingMap.sm}
          onClick={handleGetStyles}
          leftIcon="Wand"
          variant="primary"
          dataQA="get-styles"
          primaryButtonColor="green"
        />
      ) : (
        <Button
          buttonText={"Clear Styles"}
          mt={spacingMap.sm}
          mb={spacingMap.sm}
          onClick={handleClearStyles}
          leftIcon="Eraser"
          variant="primary"
          dataQA="clear-styles"
          primaryButtonColor="destructive"
          style={{ color: "white" }}
        />
      )}

      <TextArea
        dataQA="style-textarea"
        id="styleTextarea"
        $resize="both"
        placeholder="Enter CSS here"
        mb={spacingMap.xs}
        rows={10}
        ref={textareaRef}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Toggle
          dataQA="clone-toggle"
          isActive={addClone}
          onClick={handleToggleClone}
          label="Enable Site Pushdown"
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Input
            id="zIndexInput"
            dataQA="z-index-input"
            autoComplete="on"
            type="number"
            placeholder="2147483647"
            prefix={zIndexError ? "Numbers only: " : "z-index: "}
            validation={zIndexError ? "invalid" : undefined}
            rightIcon={zIndexError ? "CircleAlert" : undefined}
            size={9}
            disabled={!elementsQuery.$campaign}
            onChange={handleRefreshBaseStyles}
          />
        </div>

        {elementsQuery.$campaign ? (
          <Button
            buttonText="Update Pushdown"
            variant="primary"
            leftIcon="RefreshCcwDot"
            dataQA="refresh-styles"
            onClick={handleRefreshStyles}
          />
        ) : (
          <Button
            buttonText="Inject Test Topbar"
            variant="primary"
            leftIcon="Crosshair"
            dataQA="inject-test-topbar"
            onClick={handleInjectTestTopbar}
          />
        )}
      </div>

      <Typography variant="bodyCopy">{devToolsMessage}</Typography>
      <Typography variant="bodyCopy">{backgroundMessage}</Typography>
      <Typography variant="bodyCopy">{errorMsg}</Typography>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<DevtoolsPanel />);
