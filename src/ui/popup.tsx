import React from "react";
import ReactDOM from "react-dom/client";
import { spacingMap, Typography } from "@frontend/wknd-components";
import "../css/fonts.scss";

const extnTitle: string = chrome.runtime.getManifest().name;

function Popup() {
  return (
    <div style={{ width: "400px" }}>
      <Typography component="h1" m={spacingMap.md} variant="displayXLarge">
        {extnTitle}
      </Typography>

      <Typography
        component="p"
        ml={spacingMap.md}
        mr={spacingMap.md}
        variant="bodyCopySmall"
      >
        To activate {extnTitle}, you&rsquo;ll need to access Chrome Devtools.
        You can do this by:
      </Typography>

      <ul>
        <Typography component="li" variant="bodyCopySmall">
          Keyboard Shortcut: Cmd + Option + I
        </Typography>

        <Typography component="li" variant="bodyCopySmall">
          Chrome Menu: View &gt; Developer &gt; Developer Tools
        </Typography>

        <Typography component="li" variant="bodyCopySmall">
          Right click any element on the screen and select &ldquo;Inspect&rdquo;
        </Typography>
      </ul>

      <Typography
        component="p"
        ml={spacingMap.md}
        mr={spacingMap.md}
        variant="bodyCopySmall"
      >
        Once Devtools is open, select the &ldquo;{extnTitle}&rdquo; panel from
        the menu.
      </Typography>

      <img
        src="assets/popupExample.png"
        alt="How to open { extnTitle }"
        style={{
          width: "360px",
          border: "1px solid lightgray",
          height: "200px",
          marginLeft: spacingMap.md,
          marginRight: spacingMap.md,
          maxWidth: "calc(100% - 3rem)",
          objectFit: "cover",
          objectPosition: "top center",
        }}
      />

      <Typography
        component="p"
        mb={spacingMap.md}
        ml={spacingMap.md}
        mr={spacingMap.md}
        variant="bodyCopySmall"
      >
        Close this popup by clicking on the {extnTitle} extension icon in
        Chrome.
      </Typography>
    </div>
  );
}

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(<Popup />);
