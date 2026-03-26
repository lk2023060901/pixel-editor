import RendererRegressionClient from "./renderer-regression-client";

export const dynamic = "force-dynamic";

export default async function RendererRegressionPage(props: {
  searchParams: Promise<{ caseId?: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <RendererRegressionClient
      {...(searchParams.caseId !== undefined ? { caseId: searchParams.caseId } : {})}
    />
  );
}
