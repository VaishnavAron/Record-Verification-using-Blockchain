// ===================================================
// app.js: SHARED CONFIGURATION AND UTILITY FUNCTIONS
// ===================================================

// === CRITICAL CONFIGURATION: CONTRACT DETAILS ===
const CONTRACT_ADDRESS = "0xb7Fb84e5fbbbBA93c6D32733131A0eDDF5EAB025";
const CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "string",
                "name": "documentHash",
                "type": "string"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "issuer",
                "type": "address"
            }
        ],
        "name": "DocumentRecorded",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_documentHash",
                "type": "string"
            }
        ],
        "name": "recordDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "name": "verifiedDocuments",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_documentHash",
                "type": "string"
            }
        ],
        "name": "verifyDocument",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// === UTILITY FUNCTION: HASH CALCULATION ===
// This function calculates the SHA-256 hash of the uploaded file locally in the browser.
async function calculateSHA256Hash(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const buffer = event.target.result;
                const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                // Converts the hash buffer to a hex string
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                resolve(hashHex);
            } catch (e) {
                reject(e);
            }
        };
        reader.onerror = (e) => reject(e);
        reader.readAsArrayBuffer(file);
    });
}