<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ $cameraName }}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: #0f172a;
        color: #e5e7eb;
        font-family: Arial, sans-serif;
      }
      main {
        width: min(100%, 960px);
        padding: 24px;
      }
      video {
        width: 100%;
        background: #000;
        border-radius: 12px;
      }
      p {
        color: #94a3b8;
      }
    </style>
  </head>
  <body>
    <main>
      <video id="video" controls autoplay muted playsinline></video>
      <p id="status">Conectando ao stream...</p>
    </main>
    <script>
      const videoEl = document.getElementById("video");
      const statusEl = document.getElementById("status");
      const WHEP_URL = @json($whepUrl);
      const RETRY_DELAYS_MS = [1000, 1500, 2500, 4000, 8000];
      let pc = null;
      let reconnectTimer = null;
      let retryCount = 0;
      let connecting = false;

      function setStatus(message) {
        statusEl.textContent = message;
      }

      function clearReconnectTimer() {
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      }

      function cleanupPeerConnection() {
        if (!pc) return;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.oniceconnectionstatechange = null;
        try {
          pc.close();
        } catch (error) {
          console.warn("Falha ao fechar PeerConnection.", error);
        }
        pc = null;
        videoEl.srcObject = null;
      }

      async function waitForIceGathering(currentPc) {
        if (currentPc.iceGatheringState === "complete") return;
        await new Promise((resolve) => {
          const onChange = () => {
            if (currentPc.iceGatheringState === "complete") {
              currentPc.removeEventListener("icegatheringstatechange", onChange);
              resolve();
            }
          };
          currentPc.addEventListener("icegatheringstatechange", onChange);
          setTimeout(() => {
            currentPc.removeEventListener("icegatheringstatechange", onChange);
            resolve();
          }, 2000);
        });
      }

      function classifyPlaybackError(message) {
        if (!message) return "Erro desconhecido.";
        if (message.includes("404")) return "Stream offline.";
        if (message.includes("401") || message.includes("403")) return "Token expirado.";
        return "Falha na conexao.";
      }

      function scheduleReconnect(reason) {
        if (reconnectTimer) return;
        cleanupPeerConnection();
        const delay = RETRY_DELAYS_MS[Math.min(retryCount, RETRY_DELAYS_MS.length - 1)];
        retryCount += 1;
        setStatus(`${reason} Tentando reconectar em ${Math.round(delay / 1000)}s...`);
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connect();
        }, delay);
      }

      function attachPeerConnectionHandlers(currentPc) {
        currentPc.ontrack = (event) => {
          videoEl.srcObject = event.streams[0];
          retryCount = 0;
          setStatus("Stream conectado.");
        };
        currentPc.onconnectionstatechange = () => {
          if (currentPc !== pc) return;
          if (["failed", "disconnected", "closed"].includes(currentPc.connectionState)) {
            scheduleReconnect("Conexao perdida.");
          }
        };
        currentPc.oniceconnectionstatechange = () => {
          if (currentPc !== pc) return;
          if (["failed", "disconnected", "closed"].includes(currentPc.iceConnectionState)) {
            scheduleReconnect("Stream indisponivel.");
          }
        };
      }

      async function connect() {
        if (connecting) return;
        clearReconnectTimer();
        cleanupPeerConnection();
        connecting = true;
        setStatus("Conectando ao stream...");

        const currentPc = new RTCPeerConnection();
        pc = currentPc;
        currentPc.addTransceiver("video", { direction: "recvonly" });
        currentPc.addTransceiver("audio", { direction: "recvonly" });
        attachPeerConnectionHandlers(currentPc);

        try {
          const offer = await currentPc.createOffer();
          await currentPc.setLocalDescription(offer);
          await waitForIceGathering(currentPc);

          const response = await fetch(WHEP_URL, {
            method: "POST",
            headers: { "Content-Type": "application/sdp" },
            body: currentPc.localDescription.sdp,
          });

          if (!response.ok) {
            const message = await response.text();
            throw new Error(message || `HTTP ${response.status}`);
          }

          const answer = await response.text();
          await currentPc.setRemoteDescription({ type: "answer", sdp: answer });
          retryCount = 0;
          setStatus("Aguardando midia...");
        } catch (error) {
          console.error(error);
          scheduleReconnect(classifyPlaybackError(error.message));
        } finally {
          connecting = false;
        }
      }

      window.addEventListener("beforeunload", () => {
        clearReconnectTimer();
        cleanupPeerConnection();
      });

      connect();
    </script>
  </body>
</html>
