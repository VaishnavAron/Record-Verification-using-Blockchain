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

    }  catch (error) {
        const resultDiv = document.getElementById('issuerResult');
        resultDiv.className = 'result error';
        let message = `❌ Recording Failed. Check console for details.`;
        
        // Function to find the human-readable revert reason deep within the error object
        const findRevertReason = (err) => {
            if (err.reason) return err.reason;
            if (err.data && err.data.message) return err.data.message;
            if (err.error && err.error.message) return err.error.message;
            if (err.message) {
                // Check if the message contains the common Ganache/Ethers revert strings
                if (err.message.includes('revert') || err.message.includes('execution reverted')) {
                    // Attempt to extract the custom string if available
                    const reasonMatch = err.message.match(/'([^']+)'/);
                    if (reasonMatch && reasonMatch[1]) return reasonMatch[1];
                    return "Transaction reverted by contract (No specific reason provided).";
                }
            }
            return null;
        };

        const revertReason = findRevertReason(error);

        // 1. User Rejected Transaction
        if (error.code === 4001) {
            message = '❌ Transaction Rejected by user (MetaMask signature declined).';
        }
        // 2. Smart Contract Revert (Duplicate Hash)
        else if (revertReason) {
            // Check for our custom revert string or a general revert
            if (revertReason.includes('already recorded')) {
                 message = `
                    <h2>🛑 ERROR: HASH ALREADY RECORDED</h2>
                    <p>This document's integrity hash already exists on the blockchain. </p>
                    <p>Duplicate issuance is prevented to maintain unique records.</p>
                `;
            } else {
                 message = `
                    <h2>🛑 ERROR: TRANSACTION REVERTED</h2>
                    <p>The contract rejected this transaction. Reason: <strong>${revertReason.substring(0, 80)}</strong></p>
                    <p>This typically means the document is already recorded.</p>
                `;
            }
        }
        // 3. Fallback for other errors (Network, RPC, etc.)
        else {
            message = `❌ Network/RPC Error. Details: ${error.message.substring(0, 80)}...`;
        }
        
        resultDiv.innerHTML = message;
        console.error("Recording error:", error);
    }
}
// window.onload = init; is below the function

// Call init when the file loads
window.onload = init;