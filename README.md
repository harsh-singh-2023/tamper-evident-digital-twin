# A Blockchain-Enabled Framework for Tamper-Evident State Synchronization and Provenance Assurance in Industrial Digital Twins

This repository contains the full implementation of a university capstone project designed to securely synchronize physical asset states with their Digital Twin counterparts using a permissioned blockchain (Hyperledger Fabric) and distributed off-chain storage (IPFS).

## Architecture Components

1. **Sync Service (`/sync-service`)**: A Node.js middleware that ingests live sensor telemetry (simulated via Node-RED), stores the raw JSON payloads on IPFS, and anchors the cryptographic hash and IPFS CID onto the blockchain to ensure data provenance and immutability.
2. **Chaincode (`/chaincode`)**: The Hyperledger Fabric Go smart contract that enforces access control, stores state hashes, and maintains an unbreakable, tamper-evident cryptographic chain (via `prev_hash_ref`) of all asset history.
3. **Live Dashboard (`/dashboard`)**: A modern React frontend and Node.js WebSocket backend that continuously cross-references incoming telemetry streams against the Fabric ledger in real-time. It instantly flags and visualizes any data tampering, message replay, or unauthorized direct ledger edits.
4. **Attack Injection Module (`/attack-injection`)**: A testing suite used to simulate rogue actors. It can inject spoofed sensor readings, replay old messages, and perform unauthorized direct edits to the ledger to prove the resilience of the architecture.
5. **Benchmarking Suite (`/benchmark`)**: A Hyperledger Caliper configuration used to empirically measure the throughput (TPS) and latency of the system under varying state synchronization policies (Per-update, Batched, and Deviation-triggered).

## Getting Started

Please see the individual `README.md` files located in each of the component directories for instructions on how to install dependencies and run the services locally.
