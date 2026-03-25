import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';

/**
 * Preprocess markdown to fix common AI output issues:
 * - Strip wrapping ```markdown or ``` (AI often wraps output in code fences)
 * - Stray backticks/quotes on their own lines
 * - Single-word fenced code blocks → convert to inline
 */
function preprocessMarkdown(text) {
  if (!text || typeof text !== 'string') return text;
  let out = text.trim();
  // Strip wrapping code fences (AI often returns ```markdown\n...\n```)
  if (out.startsWith('```')) {
    const end = out.indexOf('\n```', 3);
    if (end !== -1) out = out.slice(out.indexOf('\n') + 1, end).trim();
    else if (out.endsWith('```')) out = out.replace(/^```\w*\n?/, '').replace(/\n?```\s*$/, '').trim();
  }
  return out
    .replace(/^\s*[`']\s*$/gm, '') // Remove lines that are only ` or '
    .replace(/\n{3,}/g, '\n\n') // Collapse excessive newlines
    .replace(/^```\w*\s*\n([^\n]{1,60})\s*\n```/gm, '`$1`') // Single short line in code block → inline
    .trim();
}

/**
 * Renders markdown as user-friendly formatted content (headings, code blocks, lists).
 * Clean, readable typography with consistent spacing.
 */
const MarkdownContent = ({ content, className = '', proseClass = 'prose-invert prose-sm' }) => {
  if (!content || typeof content !== 'string') return null;

  const cleaned = preprocessMarkdown(content);

  return (
    <motion.div
      className={`markdown-content ${proseClass} ${className}`}
      style={{ wordBreak: 'break-word' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-blue-50 mt-6 mb-3 first:mt-0 tracking-tight leading-tight">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-blue-100 mt-5 mb-2.5 pb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-medium text-blue-200 mt-4 mb-2">
              {children}
            </h3>
          ),
          code: ({ inline, children, className: langClass, ...props }) => {
            const str = String(children ?? '').trim();
            const isShortBlock = !inline && str.length > 0 && str.length < 80 && !str.includes('\n');
            const lang = langClass?.replace(/^language-/, '') || '';
            if (inline || isShortBlock) {
              return (
                <code
                  className="inline px-1.5 py-0.5 rounded bg-blue-800/90 text-blue-200 font-mono text-[13px]"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <div className="my-4 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 shadow-lg shadow-black/25">
                {lang && (
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-300 bg-blue-900/80">
                    {lang}
                  </div>
                )}
                <div className="p-4 overflow-x-auto">
                  <code
                    className="block text-blue-100 font-mono text-[13px] leading-[1.5] whitespace-pre"
                    {...props}
                  >
                    {children}
                  </code>
                </div>
              </div>
            );
          },
          pre: ({ children }) => (
            <pre className="my-0 p-0 bg-transparent border-0 min-w-0 overflow-visible">
              {children}
            </pre>
          ),
          p: ({ children }) => (
            <p className="text-blue-200 text-[15px] my-3 leading-[1.6]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-3 space-y-2 text-blue-200 marker:text-blue-400/60">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-3 space-y-2 text-blue-200 marker:text-blue-400/60 marker:font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-[15px] leading-[1.6] pl-1">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-blue-50">{children}</strong>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline underline-offset-2"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="pl-4 my-4 py-2 text-blue-300 text-[15px] italic bg-neutral-900 border border-neutral-800 rounded-lg">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-0 my-5 h-px bg-blue-400/20" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full text-xs rounded-lg overflow-hidden shadow-md shadow-black/20">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-blue-900/80 text-blue-100">{children}</thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-neutral-900 text-blue-200">{children}</tbody>
          ),
          tr: ({ children }) => <tr className="border-0">{children}</tr>,
          th: ({ children }) => <th className="px-3 py-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="px-3 py-2">{children}</td>,
        }}
      >
        {cleaned}
      </ReactMarkdown>
    </motion.div>
  );
};

export default MarkdownContent;
