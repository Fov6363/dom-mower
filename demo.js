(() => {
  let loading = false;

  function startDemo() {
    if (loading || window.__DOM_MOWER__) return;
    loading = true;

    const script = document.createElement("script");
    script.src = `./content.js?demo=${Date.now()}`;
    script.onload = () => {
      loading = false;
      script.remove();
    };
    script.onerror = () => {
      loading = false;
      script.remove();
      window.alert("The demo could not start. Please reload the page and try again.");
    };
    document.body.appendChild(script);
  }

  document.querySelectorAll("[data-start-demo]").forEach((button) => {
    button.addEventListener("click", startDemo);
  });
})();
