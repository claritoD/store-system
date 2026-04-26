function setActiveNav() {
  const page = (location.pathname.split("/").pop() || "").toLowerCase();
  document.querySelectorAll("[data-nav]").forEach((a) => {
    const target = (a.getAttribute("href") || "").toLowerCase();
    if (target === page) a.classList.add("active");
  });
}

function toast(msg, type = "primary") {
  const el = document.getElementById("toast");
  if (!el) {
    alert(msg);
    return;
  }
  el.className = `toast align-items-center text-bg-${type} border-0`;
  el.querySelector(".toast-body").textContent = msg;
  const t = new bootstrap.Toast(el, { delay: 2500 });
  t.show();
}

