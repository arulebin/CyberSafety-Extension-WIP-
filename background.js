let siteSafetyStatus = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "checkUrlSafety") {
        if (sender.tab && sender.tab.id) {
            // Send the stored safety status to the popup
            if (siteSafetyStatus[sender.tab.id]) {
                sendResponse(siteSafetyStatus[sender.tab.id]);
            } else {
                sendResponse({ unsafeSite: false, url: sender.tab.url });
            }
        } else {
            console.error('Error: sender.tab or sender.tab.id is undefined.');
            sendResponse({ unsafeSite: false, url: null });
        }
    } else if (message.action === "unsafeSiteDetected") {
        if (sender.tab && sender.tab.id) {
            // Store the unsafe site status
            siteSafetyStatus[sender.tab.id] = { unsafeSite: true, url: message.url };
        } else {
            console.error('Error: Cannot store safety status, sender.tab or sender.tab.id is undefined.');
        }
    }else if (message.action === "showAlert") {
        chrome.windows.create({
            url: chrome.runtime.getURL("./Alerts/phishing-alert.html"),
            type: "popup",
            width: 400,
            height: 300
        });
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    // Clean up stored status when a tab is closed
    delete siteSafetyStatus[tabId];
});
