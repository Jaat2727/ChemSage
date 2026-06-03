import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

interface MessageDisplayProps {
  content: string;
}

export function MessageDisplay({ content }: MessageDisplayProps) {
  return (
    <div className="prose prose-sm prose-invert max-w-none break-words [&_p]:leading-snug [&_p]:m-0 [&_pre]:m-0 [&_pre]:p-2 [&_code]:bg-black/30 [&_code]:px-1 [&_code]:py-0.5 [&_a]:text-[var(--accent)] [&_a]:underline">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
