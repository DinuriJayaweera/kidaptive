import api from "../../../services/apiClient";

// Module-level singleton — persists across React route changes
let sessionId: string | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let isTracking = false;

// Snapshot the token at session start for use in keepalive fetch on tab close
let snapshotToken: string | null = null;

function getApiBase(): string {
  return (api.defaults.baseURL as string) ?? "http://localhost:5000/api";
}

async function sendHeartbeat() {
  if (!sessionId) return;
  try {
    await api.post("/child/session/heartbeat", { sessionId });
  } catch {
    // non-fatal
  }
}

// Keepalive fetch used on visibilitychange/pagehide — axios may not complete here
function sendKeepAliveHeartbeat() {
  if (!sessionId) return;
  const token = snapshotToken ?? localStorage.getItem("accessToken");
  if (!token) return;
  try {
    fetch(`${getApiBase()}/child/session/heartbeat`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sessionId }),
    });
  } catch {
    // best-effort
  }
}

function onVisibilityChange() {
  if (document.visibilityState === "hidden") {
    sendKeepAliveHeartbeat();
  }
}

function onPageHide() {
  sendKeepAliveHeartbeat();
}

export async function startScreenTime(): Promise<void> {
  if (isTracking) return;
  isTracking = true;
  snapshotToken = localStorage.getItem("accessToken");

  try {
    const { data } = await api.post<{ sessionId: string }>("/child/session/start");
    sessionId = data.sessionId;

    // Heartbeat every 30 seconds
    heartbeatTimer = setInterval(sendHeartbeat, 30_000);

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
  } catch {
    isTracking = false;
    snapshotToken = null;
  }
}

export function stopScreenTime(): void {
  if (!isTracking) return;
  isTracking = false;

  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  document.removeEventListener("visibilitychange", onVisibilityChange);
  window.removeEventListener("pagehide", onPageHide);

  // Send a final heartbeat so the backend records the correct end time
  sendKeepAliveHeartbeat();

  sessionId = null;
  snapshotToken = null;
}
