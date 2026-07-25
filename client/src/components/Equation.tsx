import { useMemo } from "react";
import katex from "katex";

interface Props {
  latex: string;
}

export default function Equation({ latex }: Props) {
  const html = useMemo(
    () => katex.renderToString(latex, { throwOnError: false, displayMode: false }),
    [latex]
  );

  return <span className="text-slate-800 dark:text-slate-100" dangerouslySetInnerHTML={{ __html: html }} />;
}
