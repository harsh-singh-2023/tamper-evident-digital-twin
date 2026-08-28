const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { create } = require('kubo-rpc-client');
require('dotenv').config();
const { initFabric } = require('./fabric');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize IPFS client (assuming local node on default port)
const ipfs = create({ host: '127.0.0.1', port: 5001, protocol: 'http' });

// In-memory store for previous hashes per device
const deviceState = {};

// Fabric Gateway References
let gateway = null;
let network = null;
let contract = null;

app.post('/api/state', async (req, res) => {
    try {
        const payload = req.body;
        
        if (!payload || !payload.device_id) {
            return res.status(400).json({ error: 'Payload must contain a device_id' });
        }
        
        const deviceId = payload.device_id;
        const payloadString = JSON.stringify(payload);
        
        // Compute SHA-256 hash of the JSON payload
        const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
        
        // Upload payload to IPFS (with fallback mock if node is unreachable)
        let ipfsCid;
        try {
            const ipfsResult = await ipfs.add(payloadString);
            ipfsCid = ipfsResult.path;
        } catch (err) {
            console.warn("[Warning] Local IPFS node not reachable, using mock CID for testing");
            ipfsCid = "QmMockCidForTesting12345" + hash.substring(0, 10);
        }
        
        // Prepare the on-chain record schema
        const timestamp = Date.now();
        const prevHashRef = deviceState[deviceId] || "";
        const submittingPeer = process.env.MSP_ID || "Org1MSP"; 
        
        const record = {
            device_id: deviceId,
            state_hash: hash,
            ipfs_cid: ipfsCid,
            timestamp: timestamp,
            prev_hash_ref: prevHashRef,
            submitting_peer: submittingPeer
        };
        
        console.log(`[Phase 3] Processed update for device: ${deviceId}`);
        
        // Submit 'record' to the Fabric chaincode if gateway is initialized
        if (contract) {
            try {
                console.log(`Submitting transaction to ledger...`);
                await contract.submitTransaction(
                    'RecordStateUpdate',
                    record.device_id,
                    record.state_hash,
                    record.ipfs_cid,
                    record.timestamp.toString(),
                    record.prev_hash_ref,
                    record.submitting_peer
                );
                console.log(`Transaction anchored on ledger successfully.`);
            } catch (fabricErr) {
                console.error(`Fabric submission failed: ${fabricErr}`);
                return res.status(500).json({ error: 'Failed to anchor to ledger', details: fabricErr.message });
            }
        } else {
            console.warn(`[Warning] Fabric Gateway not connected. Record was generated but NOT anchored on chain.`);
        }
        
        // Update local state with the new hash for this device
        deviceState[deviceId] = hash;
        
        res.status(200).json({
            message: contract ? 'State update anchored to ledger' : 'State update processed (Dry Run - No Ledger)',
            record: record
        });
        
    } catch (error) {
        console.error('Error processing state update:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3000;

async function main() {
    console.log('Initializing Fabric connection...');
    const fabricCtx = await initFabric();
    if (fabricCtx) {
        gateway = fabricCtx.gateway;
        network = gateway.getNetwork(process.env.CHANNEL_NAME || 'mychannel');
        contract = network.getContract(process.env.CHAINCODE_NAME || 'digital-twin');
        console.log('Fabric Gateway connected successfully.');
    }

    app.listen(PORT, () => {
        console.log(`Sync service running on port ${PORT}`);
        console.log(`Listening for state updates on POST /api/state`);
    });
}

main().catch(err => {
    console.error('Failed to start sync service:', err);
});
