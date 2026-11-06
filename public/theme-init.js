// Apply the saved theme before first paint so there is no flash.
// Loaded as an external file because a strict CSP forbids inline scripts.
try {
  var saved = localStorage.getItem("cotizaia.theme");
  document.documentElement.dataset.theme = saved === "dark" ? "dark" : "light";
} catch (e) {
  document.documentElement.dataset.theme = "light";
}
