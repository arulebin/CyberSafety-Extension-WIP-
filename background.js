let siteSafetyStatus = {};
let adBlockEnabled = false;
let appliedRuleIds = []; // Keep track of applied rule IDs

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
        const response = await fetch('https://raw.githubusercontent.com/d3ward/toolz/master/src/d3host.adblock');
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
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        const existingRuleIds = existingRules.map(rule => rule.id);

        if (existingRuleIds.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: existingRuleIds
            });
            console.log('Removed existing dynamic rules:', existingRuleIds);
        }
        console.log("Applying ad block rules...");
        const filters = await fetchEasyList();
        const validFilters = filters.filter(filter => /^[\x00-\x7F]*$/.test(filter));
        const baseId = 2;
        const rules = validFilters.map((filter, index) => ({
            id: baseId + index,
            priority: 1,
            action: { type: "block" },
            condition: {
                urlFilter: filter,
                resourceTypes: ["script", "image", "xmlhttprequest","sub_frame"]
            }
        }));
        console.log(rules);

        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: rules,
        });

        appliedRuleIds = rules.map(rule => rule.id);
        console.log("Ad block rules applied successfully.")
    } catch (error) {
        console.error('Error applying ad block rules:', error);
    }
}

// Remove ad-blocking rules
async function removeAdBlockRules() {
    try {
        console.log("Removing ad block rules...");
        await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: appliedRuleIds // Remove all currently applied rules
        });
        appliedRuleIds = [];
        console.log("Ad block rules removed successfully.");
    } catch (error) {
        console.error('Error removing ad block rules:', error);
    }
}

// Initialize ad-blocking on startup
async function initialize() {
    try {
        const result = await new Promise((resolve, reject) => {
            chrome.storage.local.get('adBlockEnabled', (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error("Error retrieving adBlockEnabled from storage: " + chrome.runtime.lastError));
                } else {
                    resolve(result);
                }
            });
        });

        adBlockEnabled = result.adBlockEnabled === true;

        if (adBlockEnabled) {
            await applyAdBlockRules();
        }
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

initialize();
