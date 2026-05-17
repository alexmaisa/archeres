import "./globals.css";
import "./i18n";

export const metadata = {
  title: "Arche - Scientific Research Methodology Planner",
  description: "A compact, multiuser workspace to help beginner researchers select research designs, calculate sample sizes, and structure methodology drafts.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
