const statusIndicator = document.querySelector('.status-indicator');

document.addEventListener('DOMContentLoaded', function () {
    chrome.runtime.sendMessage({action: "checkUrlSafety"}, function(response) {
        if (response && response.unsafeSite !== undefined) {
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
    });    
});
