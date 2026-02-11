function createToastContainer() {
  let container = document.getElementById("toast-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.top = "24px";
    container.style.left = "50%";
    container.style.transform = "translateX(-50%)";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.gap = "10px";
    container.style.pointerEvents = "none";
    document.body.appendChild(container);
  }

  return container;
}

function showToast(message, type = "info", duration = 3000) {
  const container = createToastContainer();

  const toast = document.createElement("div");

  toast.style.pointerEvents = "auto";
  toast.style.minWidth = "320px";
  toast.style.maxWidth = "420px";
  toast.style.padding = "14px 20px";
  toast.style.borderRadius = "10px";
  toast.style.background = "#ffffff";
  toast.style.border = "1px solid #e5eaf1";
  toast.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "500";
  toast.style.color = "#2f3a4a";
  toast.style.textAlign = "center";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(-12px)";
  toast.style.transition = "all 0.25s ease";

  // Soft top accent
  const accentColors = {
    success: "#6bbf8f",
    error: "#d47c7c",
    warning: "#d6b25e",
    info: "#6c9dfc"
  };

  toast.style.borderTop = `3px solid ${accentColors[type] || accentColors.info
    }`;

  toast.innerText = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  });

  const timeout = setTimeout(removeToast, duration);

  function removeToast() {
    clearTimeout(timeout);
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-12px)";
    setTimeout(() => toast.remove(), 200);
  }
}
