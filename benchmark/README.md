# Digital Twin Benchmarking (Phase 6)

This module uses **Hyperledger Caliper** to benchmark the state synchronization throughput and latency of your chaincode under three different anchoring policies:

1. **Per-update**: Anchoring every single update (Highest TPS requirement, lowest latency).
2. **Batched**: Grouping 10 updates into a single transaction (Lower TPS requirement, high data throughput).
3. **Deviation-triggered**: Only anchoring when data deviates significantly (Lowest frequency, minimal overhead).

## Prerequisites
- Node.js (v18+)
- Hyperledger Fabric test network running.
- Caliper CLI installed.

## Setup

Since the Fabric test network is likely running in your WSL instance (as established in previous phases), **you should run this benchmark from WSL**.

1. Navigate to this directory in WSL.
2. Install dependencies and bind Caliper to the Fabric SDK:
```bash
npm install
npx caliper bind --caliper-bind-sut fabric:2.4
```
*(If binding fails, ensure your Node version is compatible with Caliper, or run it directly in your WSL terminal).*

3. **Update Network Config:** Open `networks/network-config.yaml` and replace `/path/to/fabric-samples/...` with the absolute path to your `fabric-samples` directory inside WSL (e.g., `/home/username/fabric-samples/test-network/...`).

## Running the Benchmarks

Run the benchmark suite using the Caliper CLI:

```bash
npx caliper launch manager \
    --caliper-workspace ./ \
    --caliper-networkconfig networks/network-config.yaml \
    --caliper-benchconfig benchmarks/config.yaml \
    --caliper-flow-only-test \
    --caliper-fabric-gateway-enabled
```

## Reviewing Results

After the run completes, Caliper will generate an HTML report (e.g., `report.html`) in the root of the workspace. Open this file in your browser to view the throughput (TPS), success rate, and latency percentiles (min, max, avg, 99th) for all three anchoring policies. This table is perfect for your capstone project report!
