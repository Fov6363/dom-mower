chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["page-effects.css"],
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  } catch (error) {
    console.warn("DOM Mower 无法在当前页面启动：", error);
  }
});
