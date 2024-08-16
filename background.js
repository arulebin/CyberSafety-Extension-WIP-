let siteSafetyStatus = {};
let adBlockEnabled = false;
let filterList = [];

// Listener for messages
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    try {
        console.log("Received message:", message);
        switch (message.action) {
            case "enableAdBlock":
                adBlockEnabled = true;
                await chrome.storage.local.set({ adBlockEnabled: true });
                await applyAdBlockRules();
                sendResponse({ success: true });
                break;

            case "disableAdBlock":
                adBlockEnabled = false;
                await chrome.storage.local.set({ adBlockEnabled: false });
                await removeAdBlockRules();
                sendResponse({ success: true });
                break;

            case "checkUrlSafety":
                if (sender.tab && sender.tab.id) {
                    const status = siteSafetyStatus[sender.tab.id] || { unsafeSite: false, url: sender.tab.url };
                    sendResponse(status);
                } else {
                    console.error('Error: sender.tab or sender.tab.id is undefined.');
                    sendResponse({ unsafeSite: false, url: null });
                }
                break;

            case "unsafeSiteDetected":
                if (sender.tab && sender.tab.id) {
                    siteSafetyStatus[sender.tab.id] = { unsafeSite: true, url: message.url };
                    sendResponse({ success: true });
                } else {
                    console.error('Error: Cannot store safety status, sender.tab or sender.tab.id is undefined.');
                    sendResponse({ success: false, error: 'Cannot store safety status.' });
                }
                break;

            default:
                console.error('Unknown action:', message.action);
                sendResponse({ success: false, error: 'Unknown action' });
                break;
        }
    } catch (error) {
        console.error('Error processing message:', error);
        sendResponse({ success: false, error: error.message });
    }
    return true; // Indicates the response is sent asynchronously
});


// Clean up stored status when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
    delete siteSafetyStatus[tabId];
});

// Fetch the EasyList for ad-blocking
async function fetchEasyList() {
    try {
        const response = await fetch('https://raw.githubusercontent.com/brave/adblock-lists/acd7f31cd3f8fcd0d4f1066c374af383ef80c23d/brave-unbreak.txt');
        const filters = await response.text();
        return filters.split('\n').filter(line => line && !line.startsWith('!'));
    } catch (error) {
        console.error('Error fetching filters:', error);
        return [];
    }
}

// Apply ad-blocking rules
async function applyAdBlockRules() {
    try {
        console.log("Applying ad block rules...");
        const filters = await fetchEasyList();
        filterList = filters.filter(filter => /^[\x00-\x7F]*$/.test(filter));

        chrome.webRequest.onBeforeRequest.addListener(
            onBeforeRequestListener,
            { urls: ["<all_urls>"] },
            ["blocking"]
        );
        console.log("Ad block rules applied successfully.");
    } catch (error) {
        console.error('Error applying ad block rules:', error);
    }
}

// Remove ad-blocking rules
async function removeAdBlockRules() {
    try {
        console.log("Removing ad block rules...");
        chrome.webRequest.onBeforeRequest.removeListener(onBeforeRequestListener);
        console.log("Ad block rules removed successfully.");
    } catch (error) {
        console.error('Error removing ad block rules:', error);
    }
}

// Listener for web requests
function onBeforeRequestListener(details) {
    if (adBlockEnabled) {
        const isBlocked = filterList.some(filter => details.url.includes(filter));
        return isBlocked ? { cancel: true } : { cancel: false };
    }
    return { cancel: false };
}

// Initialize ad-blocking on startup
function initialize() {
    chrome.storage.local.get('adBlockEnabled', (result) => {
        adBlockEnabled = result.adBlockEnabled === true;
        if (adBlockEnabled) {
            applyAdBlockRules();
        }
    });
}

initialize();
