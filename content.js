const apiKey = 'AIzaSyBC39wmmTDQFmIG_SgUf-Wo2H0aQ5xVT2Y';
const safeBrowsingApiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

chrome.runtime.sendMessage({ action: "checkUrlSafety" }, (response) => {
    if (response && response.url) {
        checkUrlSafety(response.url);
    } else {
        console.error('Error: URL is undefined in the response.');
    }
});

async function checkUrlSafety(url) {
    if (!url) {
        console.error('Error: No URL provided to check.');
        return;
    }

    const requestBody = {
        client: {
            clientId: "cyber-safety-extension",
            clientVersion: "1.0"
        },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [
                { "url": url }
            ]
        }
    };

    try {
        const response = await fetch(safeBrowsingApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();
        if (data && data.matches && data.matches.length > 0) {
            console.log('Threat detected:', data.matches);
            chrome.runtime.sendMessage({ action: "unsafeSiteDetected", url: url });
            
        } else {
            console.log('URL is safe:', url);
        }
    } catch (error) {
        console.error('Error checking URL:', error);
    }
}
