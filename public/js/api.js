function apiBase() {
  return (window.API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

async function apiFetch(path, options = {}) {
  const url = apiBase() + path;
  const opts = {
    credentials: "include",
    ...options
  };

  if (opts.body && !(opts.body instanceof FormData)) {
    opts.headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
    opts.body = JSON.stringify(opts.body);
  }

  const res = await fetch(url, opts);
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const msg = data && data.error ? data.error : "Request failed";
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function requireSession() {
  try {
    const r = await apiFetch("/api/auth/me");
    return r.user;
  } catch (e) {
    if (e.status === 401) {
      window.location.href = "index.html";
      return null;
    }
    throw e;
  }
}

function money(n) {
  const x = Number(n || 0);
  return x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

