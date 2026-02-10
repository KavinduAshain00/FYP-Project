import { useState } from "react";
import { tutorAPI } from "../api/api";
import { useAuth } from "../context/AuthContext";

const HINT_STYLES = [
  { value: "general", label: "General" },
  { value: "error-explanation", label: "Error" },
  { value: "logic-guidance", label: "Logic" },
  { value: "concept-reminder", label: "Concept" },
  { value: "visual-gameloop", label: "Animation" },
  { value: "code-review", label: "Code Review" },
];

const CodeHighlight = ({ code, explanation, language = "javascript" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-gray-300 bg-gray-900">
      <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800/80 px-3 py-2">
        <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[11px] font-semibold uppercase text-indigo-400">
          {language}
        </span>
        <button
          type="button"
          className="rounded bg-indigo-600 px-2.5 py-1 text-xs text-white hover:bg-indigo-500"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Hide Explanation" : "Explain Code"}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto bg-[#0d1117] px-4 py-3 font-mono text-[13px] leading-relaxed text-gray-200">
        <code>{code}</code>
      </pre>
      {isExpanded && explanation && (
        <div className="border-t border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
          <div className="text-[13px] leading-relaxed text-gray-400 whitespace-pre-wrap">
            <span className="mb-2 block text-sm font-semibold text-emerald-400">
              What this code does:
            </span>
            {explanation}
          </div>
        </div>
      )}
    </div>
  );
};

const parseResponseWithCode = (text) => {
  if (!text) return [];
  const parts = [];
  const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    const language = match[1] || "javascript";
    const code = match[2].trim();
    const explanation = generateCodeExplanation(code);
    parts.push({ type: "code", content: code, language, explanation });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }
  return parts.length > 0 ? parts : [{ type: "text", content: text }];
};

const generateCodeExplanation = (code) => {
  const explanations = [];
  if (code.includes("useState"))
    explanations.push(
      "Note: useState creates a state variable and a function to update it.",
    );
  if (code.includes("useEffect"))
    explanations.push(
      "Note: useEffect runs side effects (like fetching data) when dependencies change.",
    );
  if (code.includes("socket.emit"))
    explanations.push(
      "Note: socket.emit sends a message/event to the server through the socket connection.",
    );
  if (code.includes("socket.on"))
    explanations.push(
      "Note: socket.on listens for events from the server and runs a callback when received.",
    );
  if (code.includes("addEventListener"))
    explanations.push(
      "Note: addEventListener attaches an event handler to an element (like click, keydown).",
    );
  if (code.includes("requestAnimationFrame"))
    explanations.push(
      "Note: requestAnimationFrame schedules code to run before the next screen repaint (~60fps).",
    );
  if (code.includes("async") || code.includes("await"))
    explanations.push(
      "Note: async/await makes asynchronous code read like synchronous code.",
    );
  if (code.includes(".map("))
    explanations.push(
      "Note: .map() creates a new array by transforming each element.",
    );
  if (code.includes(".filter("))
    explanations.push(
      "Note: .filter() creates a new array with elements that pass a test.",
    );
  if (code.includes(".reduce("))
    explanations.push(
      "Note: .reduce() combines array elements into a single value.",
    );
  if (code.includes("ctx.") || code.includes("getContext"))
    explanations.push(
      "Note: Canvas context is used to draw shapes, text, and images on a canvas element.",
    );
  if (code.includes("Math.random()"))
    explanations.push(
      "Note: Math.random() returns a random number between 0 and 1.",
    );
  if (code.includes("setInterval") || code.includes("setTimeout"))
    explanations.push(
      "Note: Timer functions execute code after a delay or repeatedly at intervals.",
    );
  return explanations.length > 0
    ? explanations.join("\n")
    : "Click to see a line-by-line breakdown of this code.";
};

const TutorModal = ({ open, onClose, context = {} }) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hintStyle, setHintStyle] = useState("general");
  const [confidence, setConfidence] = useState(null);
  const { user } = useAuth();

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    setConfidence(null);
    try {
      const resp = await tutorAPI.ask(question, {
        type: "hint-mode",
        hintStyle,
        ...context,
        userId: user?.id,
        username: user?.username,
      });
      setAnswer(resp.data.answer || "No answer from tutor.");
      setConfidence(resp.data.confidence);
    } catch (err) {
      console.error("Tutor error", err);
      setAnswer("Error: Failed to get response from tutor.");
    } finally {
      setLoading(false);
    }
  };

  const parsedAnswer = answer ? parseResponseWithCode(answer) : [];

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50">
      <div className="w-[720px] max-w-[95%] overflow-hidden rounded-lg border border-gray-700 bg-gray-900">
        <header className="flex items-center justify-between border-b border-gray-700 bg-indigo-600 px-4 py-3 text-white">
          <h3 className="m-0 text-lg font-semibold">🤖 AI Companion</h3>
          <button
            type="button"
            className="border-none bg-transparent text-base cursor-pointer text-white hover:opacity-80"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        <form className="p-4" onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="mb-2 block font-semibold text-gray-300">
              Hint type:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {HINT_STYLES.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  className={`rounded-2xl border-2 px-3 py-1.5 text-xs transition ${hintStyle === style.value ? "border-indigo-500 bg-indigo-500/20 font-semibold text-indigo-300" : "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
                  onClick={() => setHintStyle(style.value)}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <label
            htmlFor="question"
            className="mb-1.5 block font-semibold text-gray-300"
          >
            Describe your problem (I'll guide you, not solve it!):
          </label>
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Be specific:\n• What are you trying to do?\n• What's happening instead?\n• Any error messages?"
            className="mb-4 min-h-[100px] w-full resize-y rounded-md border border-gray-600 bg-gray-800 text-gray-200 placeholder-gray-500 p-2.5 focus:outline-none focus:border-gray-500"
          />

          <div className="mt-2.5 flex gap-2">
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-4 py-2.5 font-semibold text-white hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Thinking..." : "Get Hint"}
            </button>
            <button
              type="button"
              className="rounded-md bg-gray-800 border border-gray-600 px-4 py-2.5 text-gray-200 hover:bg-gray-700"
              onClick={onClose}
            >
              Close
            </button>
          </div>

          <div className="mt-4">
            {answer && (
              <div className="relative rounded-md bg-gray-900 p-3 font-sans text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">
                {confidence && (
                  <span
                    className={`absolute top-2 right-2 text-base ${confidence >= 0.6 ? "text-emerald-400" : confidence >= 0.4 ? "text-amber-400" : "text-red-500"}`}
                  >
                    {confidence >= 0.6
                      ? "High"
                      : confidence >= 0.4
                        ? "Medium"
                        : "Low"}
                  </span>
                )}
                <div className="flex flex-col gap-3">
                  {parsedAnswer.map((part, index) =>
                    part.type === "code" ? (
                      <CodeHighlight
                        key={index}
                        code={part.content}
                        language={part.language}
                        explanation={part.explanation}
                      />
                    ) : (
                      <pre
                        key={index}
                        className="m-0 whitespace-pre-wrap font-inherit text-sm leading-relaxed"
                      >
                        {part.content}
                      </pre>
                    ),
                  )}
                </div>
                <p className="mt-3 border-t border-white/10 pt-2.5 text-[13px] text-emerald-400">
                  💪{" "}
                  <em className="not-italic">
                    Now try applying this hint yourself!
                  </em>
                </p>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default TutorModal;
