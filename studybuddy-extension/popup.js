document.addEventListener('DOMContentLoaded', () => {
    const openSidebarBtn = document.getElementById('open-sidebar');

    if (openSidebarBtn) {
        openSidebarBtn.addEventListener('click', async () => {
            // Close the popup window
            window.close();

            // Open the side panel
            // Note: chrome.sidePanel.open requires a user gesture, which the click provides.
            // It also requires the tabId or windowId.
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                await chrome.sidePanel.open({ tabId: tab.id });
            }
        });
    }
});
