# Digital Twin Smart Contract (Phase 2)

This directory contains the Hyperledger Fabric chaincode (smart contract) written in Go.

It defines the `StateRecord` schema and implements the core logic for anchoring digital twin state updates to the ledger.

## Functions

1. **`RecordStateUpdate`**: Takes `deviceID`, `stateHash`, `ipfsCid`, `timestamp`, `prevHashRef`, and `submittingPeer`. It saves the record in two ways:
   - A historical entry using a composite key (`record~deviceID~timestamp`) so that every single update is preserved.
   - An updated "latest" entry at `deviceID` for quick tip queries.
2. **`GetLatestRecord`**: Retrieves the most recent state payload anchored for a `deviceID`.
3. **`GetRecord`**: Retrieves a specific historical state payload for a `deviceID` at a specific `timestamp`.

## Prerequisites
- Go 1.20+
- A running Hyperledger Fabric test network (e.g., from `fabric-samples/test-network`).

## Local Deployment Instructions

To deploy this chaincode to your local `fabric-samples/test-network`:

1. Copy or link this folder into the `fabric-samples/asset-transfer-basic/chaincode-go` location, or deploy it directly using the peer lifecycle commands.
2. Assuming you are in `fabric-samples/test-network`, run:

```bash
./network.sh deployCC -ccn digital-twin -ccp /path/to/your/project/chaincode -ccl go
```
*(Replace `/path/to/your/project/chaincode` with the absolute path to this folder).*

## Testing via CLI

Once deployed, you can manually invoke it via the `peer` CLI:

**Invoke a record update:**
```bash
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n digital-twin --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/msp/tlscacerts/tlsca.org1.example.com-cert.pem --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/msp/tlscacerts/tlsca.org2.example.com-cert.pem -c '{"function":"RecordStateUpdate","Args":["sensor_001","mockhash123","Qm12345","1700000000","","Org1MSP"]}'
```

**Query the latest record:**
```bash
peer chaincode query -C mychannel -n digital-twin -c '{"Args":["GetLatestRecord","sensor_001"]}'
```
