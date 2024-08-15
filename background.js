const apiKey = 'AIzaSyBC39wmmTDQFmIG_SgUf-Wo2H0aQ5xVT2Y';
const safeBrowsingApiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;


chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    let activeTab = tabs[0];
    let activeTabUrl = activeTab.url;
    checkUrlSafety(activeTabUrl);
});

async function checkUrlSafety(url) {
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
                {"url": url}
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

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const textResponse = await response.text();

        const data = JSON.parse(textResponse); 
        if (data && data.matches && data.matches.length > 0) {
            console.log('Unsafe URL detected:', url);
            // Handle unsafe URL
        } else {
            console.log('URL is safe:', url);
        }
    } catch (error) {
        console.error('Error checking URL safety:', error);
    }
}

