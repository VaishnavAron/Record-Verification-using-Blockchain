// verify_logic.js: Logic for Document Verifier Portal

let provider;

async function init() {
    if (!window.ethereum) {
        document.getElementById('status').textContent = 'Error: MetaMask not found.';
        return;
    }
    try {
        // We request accounts to ensure the user has connected MetaMask, but we don't need the signer for view functions
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        document.getElementById('status').textContent = `Connected to network. Ready to Verify.`;
    } catch (error) {
        document.getElementById('status').textContent = `Connection Failed: ${error.message}`;
        console.error("Init Error:", error);
    }
}

async function verifyHash() {
    const fileInput = document.getElementById('verifierFile');
    const resultDiv = document.getElementById('verifierResult');
    resultDiv.className = 'result info';
    resultDiv.innerHTML = '<span class="loader"></span> Processing...';

    if (!fileInput.files.length) {
        resultDiv.className = 'result error';
        resultDiv.textContent = '❌ Please select a document to verify.';
        return;
    }

    try {
        const file = fileInput.files[0];
        // calculateSHA256Hash is loaded globally from app.js
        const fileHash = await calculateSHA256Hash(file); 

        resultDiv.innerHTML = `<span class="loader"></span> Hash Calculated: <strong>${fileHash.substring(0, 30)}...</strong> Querying Blockchain...`;

        // CONTRACT_ADDRESS and CONTRACT_ABI are loaded globally from app.js
        const contractReader = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const [isVerified, issuerAddress] = await contractReader.verifyDocument(fileHash);

        if (isVerified) {
            resultDiv.className = 'result success';
            resultDiv.innerHTML = `
                <h2>✅ VERIFIED AUTHENTIC!</h2>
                <p>This document is verifiable on the blockchain.</p>
                <p><strong>Hash Matched:</strong> ${fileHash}</p>
                <p><strong>Issued By:</strong> <span style="font-family: monospace;">${issuerAddress}</span></p>
            `;
        } else {
            resultDiv.className = 'result error';
            resultDiv.innerHTML = `
                <h2>❌ VERIFICATION FAILED.</h2>
                <p>The document is either fake or has been tampered with since issuance.</p>
                <p><strong>Hash Not Found:</strong> ${fileHash}</p>
            `;
        }

    } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.textContent = `❌ Verification Query Failed. Check console for details.`;
        console.error("Verification error:", error);
    }
}

// Call init when the file loads
window.onload = init;