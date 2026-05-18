import React, { Suspense } from "react";
import WorkspaceClient from "./WorkspaceClient";

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "hsl(224 25% 6%)",
        color: "rgba(255, 255, 255, 0.6)",
        fontFamily: "sans-serif"
      }}>
        Loading workspace...
      </div>
    }>
      <WorkspaceClient />
    </Suspense>
  );
}
