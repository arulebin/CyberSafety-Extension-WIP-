document.addEventListener('DOMContentLoaded', function () {
    const statusIndicator = document.querySelector('.status-indicator');
    const toggle = document.querySelector(".adblockToggle");

    // Retrieve the initial state of the ad block toggle from storage
    chrome.storage.local.get('adBlockEnabled', (data) => {
        if (chrome.runtime.lastError) {
            console.error("Error retrieving adBlockEnabled from storage:", chrome.runtime.lastError);
        } else {
            toggle.checked = data.adBlockEnabled === true;
        }
    });

    // Update site safety status on load
    chrome.runtime.sendMessage({ action: "checkUrlSafety" }, function(response) {
        if (chrome.runtime.lastError) {
            console.error("Error receiving site safety status:", chrome.runtime.lastError);
        } else {
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
        }
    });

    // Toggle ad block state
    toggle.addEventListener('change', () => {
        const adBlockEnabled = toggle.checked;
        chrome.storage.local.set({ adBlockEnabled: adBlockEnabled }, function() {
            if (chrome.runtime.lastError) {
                console.error("Error saving adBlockEnabled to storage:", chrome.runtime.lastError);
            }
        });

        console.log("Sending message to background script:", { action: adBlockEnabled ? 'enableAdBlock' : 'disableAdBlock' });
        chrome.runtime.sendMessage({ action: adBlockEnabled ? 'enableAdBlock' : 'disableAdBlock' }, function(response) {
            if (chrome.runtime.lastError) {
                console.error("Error sending message to background script:", chrome.runtime.lastError);
            } else {
                console.log("Response from background script:", response);
            }
        });
    });
});
