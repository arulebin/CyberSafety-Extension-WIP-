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
            showAlertDialog(url);            
        } else {
            console.log('URL is safe:', url);
        }
    } catch (error) {
        console.error('Error checking URL:', error);
    }
}

function showAlertDialog(url) {

    // Create the dialog element
    const dialog = document.createElement('dialog');
    dialog.setAttribute('style', `
        width: 320px; 
        border-radius: 8px;
        padding: 0;
        border: none;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        font-family: 'Roboto', sans-serif;
    `);

    // Create dialog content
    dialog.innerHTML = `
        <div class="alert" style="
            background-color: #f5c6cb;
            border: 1px solid #f5c6cb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            display:flex;
            justify-content:center;
            flex-direction:column;
        ">
            <h1 style="
                font-size: 18px;
                margin-bottom: 20px;
                color: #721c24;
                font-weight:bold;
            ">Warning!</h1>
            <p style="
                color: #721c24;
                margin-bottom: 20px;
            ">The site <strong>${url}</strong> has been detected as unsafe.</p>
            <div class="alert-buttons" style="text-align: center;">
                <button id="closeDialog" style="
                    width: 100px;
                    padding: 10px;
                    margin: 5px;
                    border: none;
                    border-radius: 5px;
                    background-color: #d9534f;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                ">Ignore</button>
                <button id="leaveDialog" style="
                    width: 100px;
                    padding: 10px;
                    margin: 5px;
                    border: none;
                    border-radius: 5px;
                    background-color: #d9534f;
                    color: white;
                    font-size: 14px;
                    cursor: pointer;
                ">Leave Site</button>
            </div>
        </div>
    `;

    dialog.querySelector('#closeDialog').addEventListener('click', () => {
        dialog.close();
        dialog.remove();
    });

    dialog.querySelector('#leaveDialog').addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "closeTab" });
    });

    document.body.appendChild(dialog);

    dialog.showModal();
}

