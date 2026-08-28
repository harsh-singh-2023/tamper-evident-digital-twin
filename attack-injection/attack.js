const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

// We reuse the fabric connection logic from sync-service for attack (c)
const { initFabric } = require('../sync-service/fabric');

const SYNC_SERVICE_URL = 'http://localhost:3000/api/state';
const DEVICE_ID = 'sensor_001';

async function attackSpoofedReading() {
    console.log('\n--- [ATTACK A] Spoofed Reading ---');
    const fakePayload = {
        device_id: DEVICE_ID,
        temperature: 99.9, // Dangerously high, but plausible
        pressure: 2.5,
        vibration: 0.1
    };
    
    // An attacker might try to push this directly to the dashboard's data stream
    // or intercept the network. The dashboard will compute the hash and check the ledger.
    // Since this didn't go through the sync service, the ledger won't have this hash.
    const fakeHash = crypto.createHash('sha256').update(JSON.stringify(fakePayload)).digest('hex');
    
    console.log(`[Injecting] Spoofed payload for ${DEVICE_ID} at ${Date.now()}`);
    console.log(`Payload:`, fakePayload);
    console.log(`Expected Hash (Dashboard will compute): ${fakeHash}`);
    console.log(`Result: Dashboard will flag this because ${fakeHash} is NOT on the ledger.`);
    
    return { type: 'spoofed', payload: fakePayload, injectionTimestamp: Date.now() };
}

async function attackReplayedMessage() {
    console.log('\n--- [ATTACK B] Replayed Message ---');
    // Simulate intercepting a valid payload from the past
    const oldPayload = {
        device_id: DEVICE_ID,
        temperature: 45.2,
        pressure: 1.05,
        vibration: 0.02
    };
    
    console.log(`[Injecting] Replaying old valid payload to Sync Service at ${Date.now()}...`);
    try {
        const response = await axios.post(SYNC_SERVICE_URL, oldPayload);
        const record = response.data.record;
        console.log(`Sync Service processed it, BUT look at the record:`, record);
        console.log(`Result: Dashboard will flag this because the timestamp is new but the payload is old/duplicate, or the prev_hash_ref logic on the dashboard will detect a cycle/replay.`);
        return { type: 'replay', record: record, injectionTimestamp: Date.now() };
    } catch (err) {
        console.error(`Failed to send replay attack: ${err.message}`);
    }
}

async function attackUnauthorisedEdit() {
    console.log('\n--- [ATTACK C] Unauthorised Direct Edit ---');
    console.log(`[Injecting] Bypassing sync service and directly altering the ledger at ${Date.now()}...`);
    
    // Attacker uses compromised peer credentials to write directly to the chaincode
    const fabricCtx = await initFabric();
    if (!fabricCtx) {
        console.log(`[Warning] Fabric Gateway not configured. Simulating unauthorized direct edit locally.`);
        console.log(`Result: Chaincode would have a new record, but no corresponding IPFS file or sync service log.`);
        return { type: 'unauthorised', injectionTimestamp: Date.now() };
    }
    
    const { gateway } = fabricCtx;
    const network = gateway.getNetwork(process.env.CHANNEL_NAME || 'mychannel');
    const contract = network.getContract(process.env.CHAINCODE_NAME || 'digital-twin');
    
    const fakeHash = "DEADBEEF00000000000000000000000000000000000000000000000000000000";
    const timestamp = Date.now();
    
    try {
        await contract.submitTransaction(
            'RecordStateUpdate',
            DEVICE_ID,
            fakeHash, // Malicious hash
            "QmFakeCIDForUnauthorizedEdit",
            timestamp.toString(),
            "fake_prev_hash",
            "CompromisedOrgMSP"
        );
        console.log(`Direct edit anchored to ledger successfully!`);
        console.log(`Result: Dashboard will flag this because the incoming live payloads will NOT match this rogue hash.`);
    } catch (err) {
        console.error(`Direct edit failed (maybe chaincode policy blocked it?):`, err.message);
    }
    
    return { type: 'unauthorised', injectionTimestamp: timestamp };
}

async function main() {
    const args = process.argv.slice(2);
    const attackType = args[0];
    
    if (attackType === 'a' || attackType === 'spoofed') {
        await attackSpoofedReading();
    } else if (attackType === 'b' || attackType === 'replay') {
        await attackReplayedMessage();
    } else if (attackType === 'c' || attackType === 'unauthorised') {
        await attackUnauthorisedEdit();
    } else {
        console.log(`Usage: node attack.js [a|b|c]`);
        console.log(`  a : Spoofed reading`);
        console.log(`  b : Replayed message`);
        console.log(`  c : Unauthorised direct edit`);
    }
}

main().catch(console.error);
