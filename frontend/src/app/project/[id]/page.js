import WorkspaceClient from "./WorkspaceClient";

export async function generateStaticParams() {
  return [{ id: "1" }];
}

export default function WorkspacePage() {
  return <WorkspaceClient />;
}
