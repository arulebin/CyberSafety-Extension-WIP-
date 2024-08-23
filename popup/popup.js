const dataBreachbtn=document.querySelector("#check-data-breach");
const reportbtn=document.querySelector("#report-cybercrime");

dataBreachbtn.addEventListener("click",()=>{
    window.open("https://cyber-safe-web.vercel.app/Features/DataBreach/features.html");
});

reportbtn.addEventListener("click",()=>{
    window.open("https://cybercrime.gov.in/Webform/Index.aspx");
});

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
    chrome.runtime.sendMessage({ action: "checkUrlSafety" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error receiving site safety status:", chrome.runtime.lastError);
            statusIndicator.textContent = "Error: Could not receive response from background script.";
            statusIndicator.style.color = '#ffc107';
        } else {
            if (response && response.unsafeSite !== undefined) {
                statusIndicator.textContent = response.unsafeSite ? "Warning: Unsafe site" : "Safe";
                statusIndicator.style.color = response.unsafeSite ? '#c9302c' : '#28a745';
            } else {
                statusIndicator.textContent = "Error: Could not determine site safety.";
                statusIndicator.style.color = '#ffc107';
            }
        }
    });

    // Toggle ad block state
    toggle.addEventListener('change', () => {
        const adBlockEnabled = toggle.checked;
        chrome.storage.local.set({ adBlockEnabled: adBlockEnabled }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving adBlockEnabled to storage:", chrome.runtime.lastError);
            } else {
                chrome.runtime.sendMessage({ action: adBlockEnabled ? 'enableAdBlock' : 'disableAdBlock' }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Error sending message to background script:", chrome.runtime.lastError);
                    } else {
                        console.log("Response from background script:", response);
                    }
                });
            }
        });
    });
});