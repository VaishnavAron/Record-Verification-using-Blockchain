// record_logic.js: Logic for Document Issuer Portal

let signer, contract;

async function init() {
    if (!window.ethereum) {
        document.getElementById('status').textContent = 'Error: MetaMask not found.';
        return;
    }
    try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        signer = provider.getSigner();
        // CONTRACT_ADDRESS and CONTRACT_ABI are loaded globally from app.js
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer); 
        document.getElementById('status').textContent = `Connected! Address: ${await signer.getAddress()}`;
    } catch (error) {
        document.getElementById('status').textContent = `Connection Failed: ${error.message}`;
        console.error("Init Error:", error);
    }
}

async function recordHash() {
    const fileInput = document.getElementById('issuerFile');
    const resultDiv = document.getElementById('issuerResult');
    resultDiv.className = 'result info';
    resultDiv.innerHTML = '<span class="loader"></span> Processing...';

    if (!fileInput.files.length) {
        resultDiv.className = 'result error';
        resultDiv.textContent = '❌ Please select a document.';
        return;
    }

    try {
        const file = fileInput.files[0];
        // calculateSHA256Hash is loaded globally from app.js
        const fileHash = await calculateSHA256Hash(file); 
        
        resultDiv.innerHTML = `<span class="loader"></span> Hash Calculated: <strong>${fileHash.substring(0, 30)}...</strong> Awaiting MetaMask transaction...`;

        const tx = await contract.recordDocument(fileHash);
        
        resultDiv.innerHTML = `<span class="loader"></span> Transaction sent! Waiting for confirmation... (Tx: <strong>${tx.hash.substring(0, 10)}...</strong>)`;

        await tx.wait(); 

        resultDiv.className = 'result success';
        resultDiv.innerHTML = `
            <h2>✅ TRANSACTION COMPLETE!</h2>
            <p><strong>Document Hash (SHA-256):</strong> ${fileHash}</p>
            <p><strong>Transaction Hash:</strong> <span style="font-family: monospace;">${tx.hash}</span></p>
            <p style="margin-top: 15px;">The record is now **permanently anchored** to the blockchain.</p>
        `;

    } catch (error) {
        resultDiv.className = 'result error';
        let message = `❌ Recording Failed. Check console for details.`;
        if (error.code === 4001) {
            message = '❌ Transaction Rejected by user.';
        } else if (error.message.includes('already recorded')) {
            message = '❌ Error: Hash already exists on the blockchain (Duplicate issuance).';
        }
        resultDiv.textContent = message;
        console.error("Recording error:", error);
    }
}

// Call init when the file loads
window.onload = init;