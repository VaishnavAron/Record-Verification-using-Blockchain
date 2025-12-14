// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contract to store and verify document hashes
contract DocumentVerifier {
    // A mapping to store the document hash (string) and the Ethereum address of the Issuer
    mapping(string => address) public verifiedDocuments;
    
    // Event to log successful issuance
    event DocumentRecorded(string indexed documentHash, address indexed issuer);
    
    // Function for the Issuer to anchor the document hash
    function recordDocument(string memory _documentHash) public {
        // Require that the hash is not already recorded (to prevent duplicate issuance)
        require(verifiedDocuments[_documentHash] == address(0), "Error: Document hash already recorded.");
        
        // Store the sender (msg.sender) as the Issuer against the hash
        verifiedDocuments[_documentHash] = msg.sender;
        
        // Emit the event
        emit DocumentRecorded(_documentHash, msg.sender);
    }
    
    // Function for the Verifier to check if a hash exists (Free read operation)
    function verifyDocument(string memory _documentHash) public view returns (bool, address) {
        address issuer = verifiedDocuments[_documentHash];
        // Returns true if the hash is associated with an address other than the zero address
        return (issuer != address(0), issuer);
    }
}