const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();
const { initFabric } = require('../../sync-service/fabric'); // Reuse fabric module

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // allow frontend to connect
        methods: ["GET", "POST"]
    }
});

let contract = null;
let gateway = null;

// The endpoint that Node-RED or Attack Scripts hit to simulate the live stream of data
app.post('/api/stream', async (req, res) => {
    try {
        const { payload, type, injectionTimestamp } = req.body;
        
        if (!payload || !payload.device_id) {
            return res.status(400).json({ error: 'Payload must contain a device_id' });
        }
        
        console.log(`[Dashboard Backend] Received live payload for ${payload.device_id}`);
        
        // 1. Compute hash of the incoming payload
        const payloadString = JSON.stringify(payload);
        const computedHash = crypto.createHash('sha256').update(payloadString).digest('hex');
        
        let onChainHash = null;
        let isMismatch = false;
        let chainRecord = null;
        
        // 2. Query chaincode for expected hash
        if (contract) {
            try {
                const resultBytes = await contract.evaluateTransaction('GetLatestRecord', payload.device_id);
                chainRecord = JSON.parse(resultBytes.toString('utf8'));
                onChainHash = chainRecord.state_hash;
                
                if (computedHash !== onChainHash) {
                    isMismatch = true;
                }
            } catch (err) {
                console.warn(`[Warning] Could not get latest record from chaincode: ${err.message}`);
                // If it doesn't exist on chain yet, it's technically a mismatch or a race condition
                isMismatch = true; 
            }
        } else {
            console.warn(`[Warning] Fabric Gateway not connected. Running in Dry Run mode.`);
            // Mock mismatch for testing attack A if gateway is offline
            if (type === 'spoofed' || type === 'unauthorised' || type === 'replay') {
                isMismatch = true;
            }
        }
        
        // Calculate latency if this was an injected attack
        let latencyMs = null;
        if (injectionTimestamp) {
            latencyMs = Date.now() - injectionTimestamp;
        }

        const eventData = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            device_id: payload.device_id,
            payload: payload,
            computedHash: computedHash,
            onChainHash: onChainHash || 'UNAVAILABLE',
            isMismatch: isMismatch,
            attackType: type || 'none',
            latencyMs: latencyMs,
            chainRecord: chainRecord
        };
        
        // 3. Emit to frontend
        io.emit('state_update', eventData);
        
        res.status(200).json({ message: 'Payload received and broadcasted', event: eventData });
    } catch (error) {
        console.error('Error processing stream payload:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 4000;

async function main() {
    console.log('Initializing Fabric connection for Dashboard...');
    const fabricCtx = await initFabric();
    if (fabricCtx) {
        gateway = fabricCtx.gateway;
        const network = gateway.getNetwork(process.env.CHANNEL_NAME || 'mychannel');
        contract = network.getContract(process.env.CHAINCODE_NAME || 'digital-twin');
        console.log('Fabric Gateway connected successfully.');
    } else {
        console.warn('Starting without Fabric connection (Dry Run).');
    }

    server.listen(PORT, () => {
        console.log(`Dashboard backend running on port ${PORT}`);
        console.log(`Listening for raw payload stream on POST /api/stream`);
    });
}

main().catch(err => {
    console.error('Failed to start dashboard backend:', err);
});
