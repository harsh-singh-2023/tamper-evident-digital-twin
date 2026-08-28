# Synchronization Service (Phase 1)

This service receives synthetic state updates (JSON) from Node-RED, computes the SHA-256 hash of the payload, uploads the payload to the local IPFS node, and constructs the tamper-evident record matching the on-chain schema. 

Currently (Phase 1), it only logs the constructed record. In Phase 3, this will be wired to the Hyperledger Fabric chaincode via the Fabric Gateway SDK.

## Prerequisites
- Node.js (v18+)
- A local IPFS node running with the HTTP API exposed on `http://127.0.0.1:5001`. 
  - If you are using Kubo, simply run `ipfs daemon`.
- A running Hyperledger Fabric test network (Phase 3).

## Setup
```bash
npm install
```

### Fabric Gateway Configuration (Phase 3)
To connect the sync service to your local Fabric network:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and replace the placeholder `CRYPTO_PATH` with the absolute path to your `fabric-samples/test-network/organizations/peerOrganizations/org1.example.com` directory.
3. Ensure the chaincode from Phase 2 is deployed on your test network.

## Running the Service
```bash
node index.js
```
The service will start on port 3000 by default. It will log whether the Fabric Gateway connected successfully or if it's running in Dry Run mode (no ledger).

## Testing
You can manually test the service using `curl` or Postman. 

**Request:**
```bash
curl -X POST http://localhost:3000/api/state \
-H "Content-Type: application/json" \
-d '{
  "device_id": "sensor_001",
  "temperature": 45.2,
  "pressure": 1.05,
  "vibration": 0.02
}'
```

**Expected behavior:**
1. The service computes the hash.
2. Uploads the JSON string to IPFS and returns the CID.
3. Prepares a `RecordStateUpdate` according to the required schema.
4. Returns a 200 OK with the prepared record.

If you send a second request for `sensor_001`, you should see the `prev_hash_ref` field populated with the `state_hash` from the first request.
