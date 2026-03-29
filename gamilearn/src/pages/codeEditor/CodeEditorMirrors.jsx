import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";

export default function CodeEditorMirrors({
  activeTab,
  editorKey,
  codeRefs,
  extHtml,
  extCss,
  extJs,
  extServer,
  onEditorCreate,
  onChangeHtml,
  onChangeCss,
  onChangeJs,
  onChangeServer,
}) {
  const r = codeRefs.current;
  /** Root div must fill flex parent so height:100% → .cm-scroller scrolls inside */
  const mirrorShell =
    "h-full min-h-0 w-full overflow-hidden [&_.cm-editor]:min-h-0";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {activeTab === "html" && (
        <CodeMirror
          key={`html-${editorKey}`}
          value={r.html}
          height="100%"
          className={mirrorShell}
          theme={vscodeDark}
          extensions={extHtml}
          onCreateEditor={onEditorCreate}
          onChange={onChangeHtml}
          basicSetup={{ lineNumbers: true, completionKeymap: true }}
        />
      )}
      {activeTab === "css" && (
        <CodeMirror
          key={`css-${editorKey}`}
          value={r.css}
          height="100%"
          className={mirrorShell}
          theme={vscodeDark}
          extensions={extCss}
          onCreateEditor={onEditorCreate}
          onChange={onChangeCss}
          basicSetup={{ lineNumbers: true, completionKeymap: true }}
        />
      )}
      {activeTab === "js" && (
        <CodeMirror
          key={`js-${editorKey}`}
          value={r.js}
          height="100%"
          className={mirrorShell}
          theme={vscodeDark}
          extensions={extJs}
          onCreateEditor={onEditorCreate}
          onChange={onChangeJs}
          basicSetup={{ lineNumbers: true, completionKeymap: true }}
        />
      )}
      {activeTab === "server" && (
        <CodeMirror
          key={`server-${editorKey}`}
          value={r.server}
          height="100%"
          className={mirrorShell}
          theme={vscodeDark}
          extensions={extServer}
          onCreateEditor={onEditorCreate}
          onChange={onChangeServer}
          basicSetup={{ lineNumbers: true, completionKeymap: true }}
        />
      )}
    </div>
  );
}
