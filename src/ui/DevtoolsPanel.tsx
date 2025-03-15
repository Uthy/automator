/* eslint-disable */

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Button,
  ButtonGroup,
  Typography,
  spacingMap,
  Toggle,
  TextArea,
  Icon,
} from "@frontend/wknd-components";
import { getFixedAndStickySelectors } from "../js/automator";
import { injectAutomTestEle } from "../js/injectElem";
import "../css/fonts.scss";
import "../css/styles.scss";
import { injectFunctionTest } from "../js/injectFunctionTest";

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
  // const [backgroundMessage, setBackgroundMessage] = useState("");
  // const [devToolsMessage, setDevtoolsMessage] = useState("");
  const [styles, setStyles] = useState({} as any);
  const [addClone, setAddClone] = useState(true); // set Default checked
  const [addResizeListener, setAddResizeListener] = useState(false);
  const [buttonText, setButtonText] = useState("Inject Test Topbar");
  const [elementsQuery, setElementsQuery] = useState({} as any);

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

  function handleToggleClone() {
    setAddClone(!addClone);
    chrome.scripting.executeScript(
      {
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        func: (addClone) => {
          addClone = !addClone;
          const $campaign = document.querySelector(".bx-automator-test"),
            $clone =
              $campaign?.querySelector(".bx-automator-test-clone") || null,
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
  }

  // useEffect(() => {
  //   console.log("Styles updated", styles);
  // }, [styles]);

  // useEffect(() => {
  //   // Check if the .bx-automator-test element exists on the site
  //   // chrome.tabs
  //   //   .query({ active: true, lastFocusedWindow: true })
  //   //   .then((response) => {
  //   //     let tabId = response[0].id;
  //   //     chrome.scripting.executeScript(
  //   //       {
  //   //         target: { tabId: tabId },
  //   //         func: () => !!document.querySelector(".bx-automator-test"),
  //   //       },
  //   //       (results) => {
  //   //         console.log("Results", results);
  //   //         if (results[0].result) {
  //   //           setButtonText("Injected - refresh styles");
  //   //         } else {
  //   //           setButtonText("Inject Test Topbar");
  //   //         }
  //   //       },
  //   //     );
  //   //   });
  //   console.log("Devtools Panel mounted");
  //   chrome.scripting.executeScript(
  //     {
  //     target: { tabId: chrome.devtools.inspectedWindow.tabId },
  //     func: () => {
  //       let result = {
  //         $campaign: document.querySelectorAll(".bx-automator-test").length > 0,
  //         $styleElment: document.querySelectorAll("style.bx-automator-test-style").length > 0,
  //       };
  //       return result;
  //     }
  //   },
  //   (results) => {
  //     console.log("Results", results);
  //     setElementsQuery(results[0].result || {});
  //   }
  //   );
  // }, []);

  return (
    <div style={{ margin: spacingMap.md }}>
      <Typography mb={spacingMap.md} variant="displayLarge">
        {extnTitle}
      </Typography>

      {!styles.css ? (
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
                const resultText = results[0].result;
                const resultObj = parseCSS(resultText);
                setStyles(resultObj);
                const textarea = document.getElementById(
                  "styleTextarea",
                ) as HTMLTextAreaElement;
                textarea.value = resultObj.css.join("\n");
              },
            );
          }}
          variant="primary"
        />
      ) : (
        <Button
          buttonText={"Clear Styles"}
          mb={spacingMap.md}
          onClick={() => {
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
          }}
          variant="primary"
        />
      )}

      <Button
        buttonText={"Function Test"}
        mb={spacingMap.md}
        onClick={() => {
          const textarea = document.getElementById(
            "styleTextarea",
          ) as HTMLTextAreaElement;
          var styleContent = textarea.value;
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
                  args: [styleContent],
                });
              } catch (e) {
                return setErrorMsg(e.message);
              }
            });
        }}
        variant="primary"
      />

      <TextArea
        dataQA="style-textarea"
        id="styleTextarea"
        $resize="resize"
        placeholder="Enter text"
        mb={spacingMap.md}
        style={{ height: "150px" }}
      />

      {/* <div style={{ marginBottom: spacingMap.md }}>
        <label>
          <input
            type="checkbox"
            checked={addClone}
            // onChange={(e) => {
            //   setAddClone(e.target.checked);
            //   if (e.target.checked) {
            //     // chrome.tabs
            //     //   .query({ active: true, lastFocusedWindow: true })
            //     //   .then((response) => {
            //     //     let tabId = response[0].id;
            //     //     chrome.scripting.executeScript(
            //     //       {
            //     //         target: { tabId: tabId },
            //     //         func: () =>
            //     //           !!document.querySelector(".bx-automator-test"),
            //     //       },
            //     //       (results) => {
            //     //         if (results[0].result) {
            //     //           setButtonText("Injected - refresh styles");
            //     //         } else {
            //     //           setButtonText("Inject Test Topbar");
            //     //         }
            //     //       },
            //     //     );
            //     //   });
            //   }
            // }}
            onChange = {handleToggleClone}
          />
          Add Clone - Enable Site Pushdown
        </label>
      </div> */}

      <Toggle
        dataQA="clone-toggle"
        isActive={addClone}
        onClick={handleToggleClone}
        label="Add Clone - Enable Site Pushdown"
        mb={spacingMap.md}
        mt={spacingMap.md}
      />

      <Button
        buttonText={
          elementsQuery.$campaign
            ? "Injected - refresh styles"
            : "Inject Test Topbar"
        }
        mb={spacingMap.md}
        onClick={() => {
          const textarea = document.getElementById(
            "styleTextarea",
          ) as HTMLTextAreaElement;
          const styleContent = textarea.value;

          chrome.tabs
            .query({ active: true, lastFocusedWindow: true })
            .then((response) => {
              let tabId = response[0].id;

              return chrome.scripting
                .executeScript({
                  target: { tabId: tabId },
                  func: injectAutomTestEle,
                  args: [styleContent, addClone, addResizeListener],
                })
                .then(() => {
                  setButtonText("Injected - refresh styles");
                })
                .catch((e) => setErrorMsg(e.message));
            });
        }}
        variant="primary"
        style={{
          backgroundColor:
            buttonText === "Injected - refresh styles" ? "green" : "",
        }}
      />

      {/* <Typography variant="bodyCopy">{devToolsMessage}</Typography>
      <Typography variant="bodyCopy">{backgroundMessage}</Typography> */}
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<DevtoolsPanel />);
