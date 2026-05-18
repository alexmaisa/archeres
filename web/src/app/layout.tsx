import React from "react";
import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Arche - Scientific Research Methodology Planner",
  description: "A compact, multiuser workspace to help beginner researchers select research designs, calculate sample sizes, and structure methodology drafts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
