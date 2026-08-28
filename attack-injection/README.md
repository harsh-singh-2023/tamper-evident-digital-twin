# Attack Injection Module (Phase 4)

This script simulates three distinct attack vectors against the digital twin infrastructure. These injected attacks are timestamped and will be caught and visualized by the Dashboard (Phase 5).

## Prerequisites
- Node.js (v18+)
- Ensure the **Sync Service** (Phase 1/3) is running on port 3000 (needed for the Replay attack).
- Ensure the `.env` file is properly configured with your Fabric test network paths if you want the Unauthorised Edit attack to execute against the real ledger.

## Setup
```bash
npm install
```
*(Optional)* Link the `.env` from Phase 3:
```bash
cp ../sync-service/.env .env
```

## Running Attacks

The script accepts an argument for the attack type (`a`, `b`, or `c`).

### A. Spoofed Reading
Generates a malicious/fake sensor payload and computes its hash. This simulates an attacker intercepting the data stream to the dashboard. The dashboard will flag this because the computed hash of the fake payload won't exist on the ledger.
```bash
node attack.js a
```

### B. Replayed Message
Takes an old, previously valid payload and POSTs it again to the Sync Service. The Sync Service will successfully anchor it, but the dashboard will detect that the `timestamp` is artificially fresh for an old piece of state, or that it breaks the `prev_hash_ref` logic.
```bash
node attack.js b
```

### C. Unauthorised Direct Edit
Bypasses the Sync Service entirely and uses the Fabric Gateway SDK to directly invoke the `RecordStateUpdate` chaincode function with a malicious hash (`DEADBEEF...`). The dashboard will detect this because it will see a ledger update that has no matching real-time IPFS payload.
```bash
node attack.js c
```
