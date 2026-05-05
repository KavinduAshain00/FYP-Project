/**
 * Vanilla HTML/CSS/JS preview document (no React runtime).
 * @param {{ html: string, css: string, js: string }} code
 */
export function buildSinglePlayerPreviewHtml({ html, css, js }) {
  const userCode = { html: html || "", css: css || "", js: js || "" };
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${userCode.css}</style>
</head>
<body>
  ${userCode.html}
  <script>
    (function () {
      var originalConsole = {
        log: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error,
      };
      function sendToParent(level, message) {
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(
              { type: 'console', level: level, message: message, timestamp: Date.now() },
              '*'
            );
          }
        } catch (err) {}
      }
      ['log', 'info', 'warn', 'error'].forEach(function (level) {
        var fn = function () {
          originalConsole[level].apply(console, arguments);
          var message = Array.prototype.map
            .call(arguments, function (a) {
              return typeof a === 'object' ? JSON.stringify(a) : String(a);
            })
            .join(' ');
          sendToParent(level, message);
        };
        try {
          console[level] = fn;
        } catch (e) {}
      });
      window.__capturedConsole = console;
    })();
    function runUserCode() {
      var con = window.__capturedConsole || console;
      try {
        (function (console) {
          ${userCode.js}
        })(con);
      } catch (e) {
        con.error('Runtime error: ' + (e && e.message ? e.message : String(e)));
        var errDiv = document.createElement('div');
        errDiv.style.cssText =
          'color:#527CB0;padding:20px;font-family:monospace;background:#16284c;border-radius:8px;margin:20px;';
        errDiv.innerHTML =
          '<h3>Error:</h3><pre>' + (e && e.message ? e.message : String(e)) + '</pre>';
        if (document.body) document.body.appendChild(errDiv);
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runUserCode);
    } else {
      runUserCode();
    }
  </script>
</body>
</html>`;
}
