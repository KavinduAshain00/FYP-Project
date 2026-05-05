import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { motion } from "framer-motion";
import { FaServer, FaUsers } from "react-icons/fa";

export function CodeEditorFileTabs({
  tabs,
  activeTab,
  onTabChange,
  isMultiplayerModule,
}) {
  return (
    <motion.div
      className="flex items-center bg-neutral-900 border-b border-neutral-800/60 shrink-0 px-1 pt-1 gap-0.5"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {tabs.map((tab, idx) => (
        <motion.button
          key={tab}
          initial={{ opacity: 0, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 + idx * 0.03 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          className={`px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition rounded-t-lg ${
            activeTab === tab
              ? "text-black bg-blue-600"
              : "text-blue-400/85 hover:text-blue-100 hover:bg-neutral-900/80"
          }`}
          onClick={() => onTabChange(tab)}
        >
          {tab === "server" && (
            <FaServer className="text-blue-400 text-xs" aria-hidden />
          )}
          {tab === "server" ? "SERVER.JS" : tab.toUpperCase()}
        </motion.button>
      ))}
      {isMultiplayerModule && (
        <span className="ml-auto mr-3 flex items-center gap-1 text-[10px] text-blue-500">
          <FaUsers aria-hidden /> Multiplayer
        </span>
      )}
    </motion.div>
  );
}

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
  const userCode = codeRefs.current;
  /** Root div must fill flex parent so height:100% → .cm-scroller scrolls inside */
  const mirrorShell =
    "h-full min-h-0 w-full overflow-hidden [&_.cm-editor]:min-h-0";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {activeTab === "html" && (
        <CodeMirror
          key={`html-${editorKey}`}
          value={userCode.html}
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
          value={userCode.css}
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
          value={userCode.js}
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
          value={userCode.server}
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
