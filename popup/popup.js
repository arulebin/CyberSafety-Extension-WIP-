const statusIndicator = document.querySelector('.status-indicator');
const toggle = document.querySelector(".adblockToggle");

chrome.storage.local.get('adBlockEnabled', (data) => {
    toggle.checked = data.adBlockEnabled === true;
});

document.addEventListener('DOMContentLoaded', function () {
    chrome.runtime.sendMessage({action: "checkUrlSafety"}, function(response) {
        if (response) {
            if (response.unsafeSite !== undefined) {
                if (response.unsafeSite) {
                    statusIndicator.textContent = "Warning: Unsafe site";
                    statusIndicator.style.color = '#c9302c'; 
                } else {
                    statusIndicator.textContent = "Safe";
                    statusIndicator.style.color = '#28a745';
                }
            } else {
                statusIndicator.textContent = "Error: Could not determine site safety.";
                statusIndicator.style.color = '#ffc107';
            }
        } else {
            statusIndicator.textContent = "Error: Could not receive response from background script.";
            statusIndicator.style.color = '#ffc107';
        }
    });
});

toggle.addEventListener('change', () => {
    const adBlockEnabled = toggle.checked;
    chrome.storage.local.set({ adBlockEnabled: adBlockEnabled }, function() {
        if (chrome.runtime.lastError) {
            console.error("Error saving adBlockEnabled to storage:", chrome.runtime.lastError);
        }
    });
    chrome.runtime.sendMessage({ action: adBlockEnabled ? 'enableAdBlock' : 'disableAdBlock' }, function(response) {
        if (chrome.runtime.lastError) {
            console.error("Error sending message to background script:", chrome.runtime.lastError);
        }
    });
});    