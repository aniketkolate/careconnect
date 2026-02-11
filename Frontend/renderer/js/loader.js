let loaderOverlay = null;

function createLoader(message = "Please wait...") {
  loaderOverlay = document.createElement("div");

  loaderOverlay.style.position = "fixed";
  loaderOverlay.style.top = "0";
  loaderOverlay.style.left = "0";
  loaderOverlay.style.width = "100%";
  loaderOverlay.style.height = "100%";
  loaderOverlay.style.background = "rgba(255,255,255,0.7)";
  loaderOverlay.style.backdropFilter = "blur(4px)";
  loaderOverlay.style.display = "flex";
  loaderOverlay.style.flexDirection = "column";
  loaderOverlay.style.alignItems = "center";
  loaderOverlay.style.justifyContent = "center";
  loaderOverlay.style.zIndex = "10000";

  const spinner = document.createElement("div");
  spinner.style.width = "40px";
  spinner.style.height = "40px";
  spinner.style.border = "4px solid #e5eaf1";
  spinner.style.borderTop = "4px solid #4e8cff";
  spinner.style.borderRadius = "50%";
  spinner.style.animation = "spin 0.8s linear infinite";

  const text = document.createElement("div");
  text.innerText = message;
  text.style.marginTop = "12px";
  text.style.fontSize = "14px";
  text.style.fontWeight = "500";
  text.style.color = "#2f3a4a";

  loaderOverlay.appendChild(spinner);
  loaderOverlay.appendChild(text);

  document.body.appendChild(loaderOverlay);
}

function redirectWithLoader(path, message = "Loading...") {

  // Wait 500ms before showing loader
  setTimeout(() => {

    createLoader(message);

    // Small delay so user sees loader before redirect
    setTimeout(() => {
      window.location.href = path;
    }, 1000);

  }, 0);
}


// Spin animation
const style = document.createElement("style");
style.innerHTML = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}`;
document.head.appendChild(style);
