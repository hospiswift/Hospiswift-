/* Hospiswift consultation room (app only): video, voice and chat.
   HS_ROOM.open({id, role: "patient"|"host", mode: "Video"|"Voice"|"Chat", name, onEnd})
   The patient and the pharmacy or hospital join the same room id.
   Media is real WebRTC. Signalling runs over BroadcastChannel, so two tabs or frames of the same
   browser connect for real. For calls across devices, replace send()/onmessage with a WebSocket
   signalling server and add a TURN server (or use Agora, Twilio or Daily). */
(function (w) {
  "use strict";
  var CSS = ".hsr{position:fixed;inset:0;z-index:400;background:#0A1F18;color:#fff;display:flex;flex-direction:column;font-family:inherit}" +
    ".hsr-top{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:calc(14px + env(safe-area-inset-top,0px)) 16px 10px}" +
    ".hsr-top b{font-size:17px}.hsr-st{font-size:13px;color:#B9D9CC}.hsr-tm{font-weight:800;font-size:18px}" +
    ".hsr-stage{flex:1;position:relative;display:flex;align-items:center;justify-content:center;min-height:0;margin:0 12px;border-radius:18px;background:#0F2A22;overflow:hidden}" +
    ".hsr-rv{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000}.hsr-rv.off{display:none}" +
    ".hsr-av{width:96px;height:96px;border-radius:50%;background:var(--accent,var(--a,#0B7A55));display:grid;place-items:center;font-weight:800;font-size:32px;position:relative}" +
    ".hsr-lv{position:absolute;right:10px;bottom:10px;width:96px;height:128px;object-fit:cover;border-radius:12px;background:#000;transform:scaleX(-1);border:2px solid rgba(255,255,255,.4)}" +
    ".hsr-note{text-align:center;font-size:13px;color:#B9D9CC;padding:8px 16px}.hsr-note button{margin-top:6px;background:#fff;color:#0A1F18;font-weight:700;border-radius:10px;padding:9px 14px;border:0;cursor:pointer;font:inherit;font-weight:700}" +
    ".hsr-ctl{display:flex;gap:10px;padding:10px 16px calc(16px + env(safe-area-inset-bottom,0px))}.hsr-ctl button{flex:1;padding:14px;border-radius:14px;border:0;font:inherit;font-weight:800;cursor:pointer;background:#1E3B31;color:#fff}.hsr-ctl .end{background:#D32F2F}" +
    ".hsr-chat{flex:1;display:flex;flex-direction:column;min-height:0;margin:0 12px;background:#fff;color:#10231C;border-radius:18px;overflow:hidden}" +
    ".hsr-msgs{flex:1;overflow:auto;padding:12px;display:flex;flex-direction:column;gap:8px}.hsr-b{max-width:80%;padding:8px 12px;border-radius:14px;font-size:14px}" +
    ".hsr-b.o{background:#E3F4EC;align-self:flex-start}.hsr-b.m{background:var(--accent,var(--a,#0B7A55));color:#fff;align-self:flex-end}" +
    ".hsr-in{display:flex;gap:8px;padding:10px;border-top:1.5px solid #DCE6E1}.hsr-in input{flex:1;min-width:0;padding:12px;border:1.5px solid #DCE6E1;border-radius:12px;font:inherit}.hsr-in button{padding:0 16px;border-radius:12px;border:0;background:var(--accent,var(--a,#0B7A55));color:#fff;font-weight:800;cursor:pointer}";
  var ICE = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  w.HS_ROOM = {
    open: function (o) {
      if (!document.getElementById("hsr-css")) { var s = document.createElement("style"); s.id = "hsr-css"; s.textContent = CSS; document.head.appendChild(s); }
      var me = o.role, other = me === "host" ? "patient" : "host", chat = o.mode === "Chat", vid = o.mode === "Video";
      var ini = String(o.name || "?").replace(/^(Dr\.|Pharm\.)\s*/, "").split(" ").map(function (x) { return x[0] || ""; }).join("").slice(0, 2).toUpperCase();
      var ch = null, pc = null, stream = null, peer = false, connected = false, demo = false, queued = [], tm = null, t0 = 0, ended = false, mediaP, timers = [];
      try { ch = new BroadcastChannel("hsroom-" + o.id); } catch (e) {}
      var root = document.createElement("div"); root.className = "hsr"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", o.mode + " consultation with " + o.name);
      root.innerHTML = '<div class="hsr-top"><div><b>' + esc(o.name) + '</b><div class="hsr-st" id="hsrSt" role="status">Waiting for ' + esc(o.name) + ' to join…</div></div><div class="hsr-tm" id="hsrTm">00:00</div></div>' +
        (chat ? '<div class="hsr-chat"><div class="hsr-msgs" id="hsrMsgs"></div><div class="hsr-in"><input id="hsrIn" placeholder="Type a message" aria-label="Message"><button id="hsrSend">Send</button></div></div>'
              : '<div class="hsr-stage"><video class="hsr-rv off" id="hsrRv" autoplay playsinline></video><div class="hsr-av" id="hsrAv">' + esc(ini) + '</div>' + (vid ? '<video class="hsr-lv" id="hsrLv" autoplay muted playsinline></video>' : '') + '</div>') +
        '<div class="hsr-note" id="hsrNote"></div><div class="hsr-ctl">' + (chat ? '' : '<button id="hsrMu">Mute</button>' + (vid ? '<button id="hsrCm">Camera off</button>' : '')) + '<button class="end" id="hsrEnd">End</button></div>';
      document.body.appendChild(root);
      var $ = function (s) { return root.querySelector(s); };
      function status(t) { var e = $("#hsrSt"); if (e) e.textContent = t; }
      function note(t, btn) { var n = $("#hsrNote"); if (!n) return; n.innerHTML = esc(t) + (btn ? '<br><button id="hsrDemo">' + btn + '</button>' : ""); var b = $("#hsrDemo"); if (b) b.onclick = startDemo; }
      function connect() {
        if (connected) return; connected = true; note(""); status("Connected" + (demo ? " (demo mode)" : "")); t0 = Date.now();
        tm = setInterval(function () { var s = Math.floor((Date.now() - t0) / 1000); $("#hsrTm").textContent = ("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + s % 60).slice(-2); }, 1000);
      }
      function addMsg(who, text, sys) {
        var m = $("#hsrMsgs"); if (!m) return; var d = document.createElement("div"); d.className = "hsr-b " + who; d.textContent = text; m.appendChild(d); m.scrollTop = 99999;
      }
      function send(m) { m.from = me; if (ch) ch.postMessage(m); }
      function seen() { if (peer) return; peer = true; note(""); if (chat) connect(); else status("Connecting…"); }

      /* media */
      mediaP = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !chat)
        ? navigator.mediaDevices.getUserMedia({ audio: true, video: vid }).then(function (s) { stream = s; var lv = $("#hsrLv"); if (lv) lv.srcObject = s; }).catch(function () { note("Allow the microphone" + (vid ? " and camera" : "") + " so the other person can hear you."); })
        : Promise.resolve();

      /* WebRTC */
      function mkpc() {
        pc = new RTCPeerConnection(ICE);
        if (stream) stream.getTracks().forEach(function (t) { pc.addTrack(t, stream); });
        else { pc.addTransceiver("audio", { direction: "recvonly" }); if (vid) pc.addTransceiver("video", { direction: "recvonly" }); }
        pc.onicecandidate = function (e) { if (e.candidate) send({ t: "ice", c: e.candidate.toJSON() }); };
        pc.ontrack = function (e) {
          var rv = $("#hsrRv"); if (!rv) return; if (rv.srcObject !== e.streams[0]) rv.srcObject = e.streams[0];
          if (vid) { rv.classList.remove("off"); var a = $("#hsrAv"); if (a) a.style.display = "none"; }
        };
        pc.onconnectionstatechange = function () {
          if (pc.connectionState === "connected") connect();
          if (pc.connectionState === "failed") { status("Connection failed"); note("The call could not connect. End and join again.", ""); }
        };
      }
      function flush() { queued.forEach(function (c) { pc.addIceCandidate(c).catch(function () {}); }); queued = []; }
      function offer() { if (pc || chat) return; mediaP.then(function () { if (ended || pc) return; mkpc(); pc.createOffer().then(function (d) { return pc.setLocalDescription(d); }).then(function () { send({ t: "offer", d: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } }); }); }); }
      if (ch) ch.onmessage = function (e) {
        var m = e.data; if (!m || m.from === me || ended) return;
        if (m.t === "hello") { seen(); if (me === "host") send({ t: "hello" }); else offer(); }
        else if (m.t === "offer" && me === "host") { seen(); mediaP.then(function () { if (ended) return; if (pc) { pc.close(); pc = null; } mkpc(); pc.setRemoteDescription(m.d).then(flush).then(function () { return pc.createAnswer(); }).then(function (a) { return pc.setLocalDescription(a); }).then(function () { send({ t: "answer", d: { type: pc.localDescription.type, sdp: pc.localDescription.sdp } }); }); }); }
        else if (m.t === "answer" && pc) pc.setRemoteDescription(m.d).then(flush).catch(function () {});
        else if (m.t === "ice") { if (pc && pc.remoteDescription) pc.addIceCandidate(m.c).catch(function () {}); else queued.push(m.c); }
        else if (m.t === "chat") addMsg("o", m.text);
        else if (m.t === "bye") { status(o.name + " left"); peer = false; connected = false; clearInterval(tm); if (pc) { pc.close(); pc = null; } }
      };
      send({ t: "hello" });
      timers.push(setTimeout(function () { if (!peer && !ended) note(o.name + " has not joined yet. Calls connect for real when both sides are in the room.", "Continue in demo mode"); }, 7000));

      function startDemo() { demo = true; peer = true; connect(); if (chat) addMsg("o", "Hello, I'm " + o.name + ". How can I help you today?"); }
      /* controls */
      function cleanup() { ended = true; clearInterval(tm); timers.forEach(clearTimeout); if (pc) { try { pc.close(); } catch (e) {} } if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); if (ch) { try { ch.close(); } catch (e) {} } root.remove(); document.removeEventListener("keydown", onKey); }
      function end() { if (ended) return; send({ t: "bye" }); cleanup(); if (o.onEnd) o.onEnd(); }
      function onKey(e) { if (e.key === "Escape") end(); }
      document.addEventListener("keydown", onKey);
      $("#hsrEnd").onclick = end;
      var mu = $("#hsrMu"); if (mu) mu.onclick = function () { if (stream) stream.getAudioTracks().forEach(function (t) { t.enabled = !t.enabled; }); mu.textContent = mu.textContent === "Mute" ? "Unmute" : "Mute"; };
      var cm = $("#hsrCm"); if (cm) cm.onclick = function () { if (stream) stream.getVideoTracks().forEach(function (t) { t.enabled = !t.enabled; }); cm.textContent = cm.textContent === "Camera off" ? "Camera on" : "Camera off"; };
      if (chat) {
        var sendMsg = function () { var i = $("#hsrIn"), v = i.value.trim(); if (!v) return; addMsg("m", v); i.value = ""; send({ t: "chat", text: v }); if (demo) setTimeout(function () { addMsg("o", "Thanks for sharing. Let me look into that."); }, 1200); };
        $("#hsrSend").onclick = sendMsg; $("#hsrIn").onkeydown = function (e) { if (e.key === "Enter") sendMsg(); };
      }
      return { end: end };
    }
  };
})(window);
