// Clicking the toolbar icon on a GitHub tab plays the celebration, so it can be tried without merging.
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, 'chayanne').catch(() => {});
});
