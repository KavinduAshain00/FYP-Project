/**
 * Multiplayer preview runtime builders.
 *
 * Each function returns a complete HTML document string that is loaded into a
 * sandboxed iframe. The server and client iframes communicate via a shared
 * BroadcastChannel, giving each module its own isolated "network".
 */

/**
 * Build the HTML for the server preview iframe.
 *
 * The iframe mocks a Node.js + Express + Socket.IO environment so the
 * student's server code can run unchanged inside the browser. A
 * BroadcastChannel acts as the transport layer between server and clients.
 */
export function buildServerPreviewHtml(channelName, serverCode) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 16px; font-family: 'Courier New', monospace; background: #0f172a; color: #e2e8f0; min-height: 100%; }
    .header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px 12px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #22c55e; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .header h3 { margin: 0; font-size: 13px; color: #94a3b8; }
    .header .port { color: #fbbf24; font-size: 11px; }
    #logs { font-size: 11px; line-height: 1.6; overflow-y: auto; max-height: calc(100vh - 80px); }
    .log { padding: 2px 0; border-bottom: 1px solid #1e293b; }
    .log.info { color: #38bdf8; }
    .log.warn { color: #fbbf24; }
    .log.error { color: #f87171; }
    .log .ts { color: #475569; margin-right: 8px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="dot"></div>
    <h3>Server Running</h3>
    <span class="port">:3001</span>
  </div>
  <div id="logs"></div>
  <script>
    (function() {
      var logEl = document.getElementById('logs');
      var ts = function() { return new Date().toLocaleTimeString(); };
      function slog(msg, level) {
        var d = document.createElement('div');
        d.className = 'log ' + (level || 'info');
        d.innerHTML = '<span class="ts">' + ts() + '</span>' + msg;
        logEl.appendChild(d);
        logEl.scrollTop = logEl.scrollHeight;
        try {
          window.parent.postMessage({ type: 'console', source: 'server', level: level || 'log', message: msg, timestamp: Date.now() }, '*');
        } catch(e) {}
      }

      var channel = new BroadcastChannel('${channelName}');
      var sockets = {};
      var nextId = 1;

      function MockServerSocket(id) {
        this.id = id;
        this._handlers = {};
        this._rooms = new Set();
      }
      MockServerSocket.prototype.on = function(event, fn) {
        if (!this._handlers[event]) this._handlers[event] = [];
        this._handlers[event].push(fn);
      };
      MockServerSocket.prototype.emit = function(event, data) {
        channel.postMessage({ type: 'server-to-client', target: this.id, event: event, data: data });
      };
      MockServerSocket.prototype.join = function(room) { this._rooms.add(room); };
      MockServerSocket.prototype.leave = function(room) { this._rooms.delete(room); };
      MockServerSocket.prototype._trigger = function(event, data) {
        var handlers = this._handlers[event] || [];
        handlers.forEach(function(fn) { fn(data); });
      };

      var ioMock = {
        _connectionHandlers: [],
        on: function(event, fn) {
          if (event === 'connection') ioMock._connectionHandlers.push(fn);
        },
        emit: function(event, data) {
          channel.postMessage({ type: 'server-to-client', target: 'all', event: event, data: data });
        },
        to: function(room) {
          return {
            emit: function(event, data) {
              Object.values(sockets).forEach(function(s) {
                if (s._rooms.has(room)) {
                  channel.postMessage({ type: 'server-to-client', target: s.id, event: event, data: data });
                }
              });
              channel.postMessage({ type: 'server-to-client', target: 'room:' + room, event: event, data: data });
            }
          };
        }
      };

      channel.onmessage = function(e) {
        var msg = e.data;
        if (msg.type === 'client-connect') {
          var sid = 'socket_' + nextId++;
          sockets[sid] = new MockServerSocket(sid);
          channel.postMessage({ type: 'server-assign-id', clientId: msg.clientId, socketId: sid });
          slog('Player connected: ' + sid);
          ioMock._connectionHandlers.forEach(function(fn) { fn(sockets[sid]); });
        } else if (msg.type === 'client-emit') {
          var sock = sockets[msg.socketId];
          if (sock) {
            sock._trigger(msg.event, msg.data);
          }
        } else if (msg.type === 'client-disconnect') {
          var s = sockets[msg.socketId];
          if (s) {
            s._trigger('disconnect');
            slog('Player disconnected: ' + msg.socketId);
            delete sockets[msg.socketId];
          }
        }
      };

      function mockRequire(mod) {
        if (mod === 'express') return function() {
          return { use: function(){}, get: function(){}, post: function(){} };
        };
        if (mod === 'http') return {
          createServer: function() {
            return { listen: function(port, cb) { slog('Server listening on port ' + port); if (cb) cb(); } };
          }
        };
        if (mod === 'socket.io') return { Server: function() { return ioMock; } };
        return {};
      }

      var origConsole = { log: console.log, info: console.info, warn: console.warn, error: console.error };
      console.log = function() { var m = Array.prototype.map.call(arguments, function(a) { return typeof a === 'object' ? JSON.stringify(a) : String(a); }).join(' '); slog(m, 'info'); };
      console.info = console.log;
      console.warn = function() { var m = Array.prototype.map.call(arguments, String).join(' '); slog(m, 'warn'); };
      console.error = function() { var m = Array.prototype.map.call(arguments, String).join(' '); slog(m, 'error'); };

      try {
        var require = mockRequire;
        (new Function('require', 'console', ${JSON.stringify(serverCode)}))(mockRequire, console);
      } catch(e) {
        slog('Server error: ' + e.message, 'error');
      }
    })();
  </script>
</body>
</html>`;
}

/**
 * Build the HTML for a client preview iframe.
 *
 * A mock `io()` function is injected that communicates with the server iframe
 * over BroadcastChannel. The student's client code calls `io()` and gets back
 * a socket-like object that tunnels events through the channel.
 */
export function buildClientPreviewHtml(channelName, clientId, html, css, js) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>${css}</style>
</head>
<body>
  ${html}
  <script>
    (function() {
      var channelName = '${channelName}';
      var clientId = '${clientId}';
      var channel = new BroadcastChannel(channelName);
      var socketId = null;
      var handlers = {};
      var connected = false;
      var pendingEmits = [];

      window.io = function() {
        var socket = {
          id: null,
          connected: false,
          on: function(event, fn) {
            if (!handlers[event]) handlers[event] = [];
            handlers[event].push(fn);
          },
          emit: function(event, data) {
            if (!socketId) {
              pendingEmits.push({ event: event, data: data });
              return;
            }
            channel.postMessage({ type: 'client-emit', socketId: socketId, event: event, data: data });
          },
          disconnect: function() {
            channel.postMessage({ type: 'client-disconnect', socketId: socketId });
          }
        };

        channel.onmessage = function(e) {
          var msg = e.data;
          if (msg.type === 'server-assign-id' && msg.clientId === clientId) {
            socketId = msg.socketId;
            socket.id = socketId;
            socket.connected = true;
            connected = true;
            (handlers['connect'] || []).forEach(function(fn) { fn(); });
            pendingEmits.forEach(function(p) {
              channel.postMessage({ type: 'client-emit', socketId: socketId, event: p.event, data: p.data });
            });
            pendingEmits = [];
          } else if (msg.type === 'server-to-client') {
            if (msg.target === 'all' || msg.target === socketId || (msg.target && msg.target.startsWith && msg.target.startsWith('room:'))) {
              (handlers[msg.event] || []).forEach(function(fn) { fn(msg.data); });
            }
          }
        };

        setTimeout(function() {
          channel.postMessage({ type: 'client-connect', clientId: clientId });
        }, 100);

        return socket;
      };

      var originalConsole = { log: console.log, info: console.info, warn: console.warn, error: console.error };
      function sendToParent(level, message) {
        try {
          if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'console', source: clientId, level: level, message: message, timestamp: Date.now() }, '*');
          }
        } catch (err) {}
      }
      ['log','info','warn','error'].forEach(function(level) {
        var fn = function() {
          originalConsole[level].apply(console, arguments);
          var message = Array.prototype.map.call(arguments, function(a) {
            return typeof a === 'object' ? JSON.stringify(a) : String(a);
          }).join(' ');
          sendToParent(level, message);
        };
        try { console[level] = fn; } catch (e) {}
      });
      window.__capturedConsole = console;
    })();

    function runUserCode() {
      var con = window.__capturedConsole || console;
      try {
        (function(console) {
          ${js}
        })(con);
      } catch (e) {
        con.error('Runtime error: ' + (e && e.message ? e.message : String(e)));
        var errDiv = document.createElement('div');
        errDiv.style.cssText = 'color:#fc4a1a;padding:20px;font-family:monospace;background:#132f4c;border-radius:8px;margin:20px;';
        errDiv.innerHTML = '<h3>Error:</h3><pre>' + (e && e.message ? e.message : String(e)) + '</pre>';
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
