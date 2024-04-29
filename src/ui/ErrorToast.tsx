import React from "react";
import { Toast, spacingMap } from "@frontend/wknd-components";
import styled from "styled-components";

const StyledToast = styled(Toast)`
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: calc(54px + ${spacingMap.xs});
  margin: 0;
  width: calc(100% - ${spacingMap.sm});

  & span[data-qa="undefined-typography"] {
    -webkit-line-clamp: 2;
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    flex: auto;
  }
`;

function ErrorToast({
  message,
  setShowError,
}: {
  message: string;
  setShowError: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <StyledToast
      showIcon
      hasTimeout={false}
      text={message}
      trailingLinkText="Report"
      trailingLinkAction={() => {
        window.open(
          `https://docs.google.com/forms/d/e/1FAIpQLSe3ptrVWyp-7in0sn9jT6L077Gd_vCP_PHwCOPqPGkZED8L7Q/viewform?usp=pp_url&entry.1826575004=${message
            .split("\n")
            .join(" ")}`,
          "_blank",
        );
      }}
      onDismiss={() => setShowError("")}
      variant="Error"
    />
  );
}

export default ErrorToast;
