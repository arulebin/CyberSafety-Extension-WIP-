let siteSafetyStatus = {};
let adBlockEnabled = false;
let appliedRuleIds = [];

// Listener for messages
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
    try {
        switch (message.action) {
            case "closeTab":
                if (sender.tab && sender.tab.id) {
                    await chrome.tabs.remove(sender.tab.id);
                    sendResponse({ success: true });
                } else {
                    console.error('Error: No tab ID found.');
                    sendResponse({ success: false, error: 'No tab ID found.' });
                }
                break;

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
    const response = await fetch('https://raw.githubusercontent.com/brave/adblock-lists/acd7f31cd3f8fcd0d4f1066c374af383ef80c23d/brave-unbreak.txt');
    const filters = await response.text();
    return filters.split('\n').filter(line => line && !line.startsWith('!'));
}

// Apply ad-blocking rules
async function applyAdBlockRules() {
    try {
        const filterList = await fetchEasyList();
        const validFilters = filterList.filter(filter => /^[\x00-\x7F]*$/.test(filter));

        const rules = validFilters.map((filter, index) => ({
            id: index + 1,
            priority: 1,
            action: { type: 'block' },
            condition: {
                urlFilter: filter,
                resourceTypes: ['script', 'image', 'xmlhttprequest']
            }
        }));

        // Update dynamic rules in Chrome
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: appliedRuleIds,
            addRules: rules
        });

        appliedRuleIds = rules.map(rule => rule.id);
    } catch (error) {
        console.error('Error applying ad block rules:', error);
    }
}

// Remove ad-blocking rules
async function removeAdBlockRules() {
    try {
        console.log("Removing the following rules:", appliedRuleIds);
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: appliedRuleIds
        });
        appliedRuleIds = [];
    } catch (error) {
        console.error('Error removing ad block rules:', error);
    }
}

// Initialize ad-blocking on startup
(async function initialize() {
    try {
        const { adBlockEnabled } = await chrome.storage.local.get('adBlockEnabled');
        if (adBlockEnabled) {
            await applyAdBlockRules();
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
})();
