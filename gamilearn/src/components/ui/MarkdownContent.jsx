import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders markdown as user-friendly formatted content (headings, code blocks, lists).
 * Code blocks are shown as styled code, not raw ``` markdown.
 */
const MarkdownContent = ({
  content,
  className = "",
  proseClass = "prose-invert prose-sm",
}) => {
  if (!content || typeof content !== "string") return null;

  return (
    <div
      className={`markdown-content ${proseClass} ${className}`}
      style={{
        // Base styles for markdown output
        wordBreak: "break-word",
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings: clear hierarchy, no raw ##
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-white mt-4 mb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-slate-100 mt-3 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold text-slate-200 mt-2 mb-1">
              {children}
            </h3>
          ),
          // Code: inline and block — render as actual code, not raw ```
          code: ({ node, inline, className: codeClassName, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-slate-700/80 text-cyan-200 font-mono text-xs"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="block p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto my-2 border border-white/10"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-2 p-0 bg-transparent border-0 overflow-x-auto">
              {children}
            </pre>
          ),
          p: ({ children }) => (
            <p className="text-slate-300 text-sm my-2 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-slate-300 text-sm my-2 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-slate-300 text-sm my-2 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-300 text-sm">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">{children}</strong>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 hover:underline"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-cyan-500/50 pl-3 my-2 text-slate-400 text-sm italic">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-xs border border-white/10 rounded-lg overflow-hidden">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-800/80 text-slate-200">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-slate-900/50 text-slate-300">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-white/10">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="px-3 py-2">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
