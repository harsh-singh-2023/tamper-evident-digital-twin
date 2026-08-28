package main

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing a digital twin's state record
type SmartContract struct {
	contractapi.Contract
}

// StateRecord describes the structure of the on-chain digital twin state
type StateRecord struct {
	DeviceID       string `json:"device_id"`
	StateHash      string `json:"state_hash"`
	IpfsCid        string `json:"ipfs_cid"`
	Timestamp      int64  `json:"timestamp"`
	PrevHashRef    string `json:"prev_hash_ref"`
	SubmittingPeer string `json:"submitting_peer"`
}

// InitLedger adds a base set of devices to the ledger (optional)
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	log.Println("Initializing Digital Twin Ledger")
	return nil
}

// RecordStateUpdate creates a new state record for a given device
func (s *SmartContract) RecordStateUpdate(ctx contractapi.TransactionContextInterface, deviceID string, stateHash string, ipfsCid string, timestamp int64, prevHashRef string, submittingPeer string) error {
	log.Printf("Recording state update for device %s at %d", deviceID, timestamp)

	// We create two entries:
	// 1. A historical entry using a composite key: record~deviceID~timestamp
	// 2. An updated "latest" entry using just the deviceID

	record := StateRecord{
		DeviceID:       deviceID,
		StateHash:      stateHash,
		IpfsCid:        ipfsCid,
		Timestamp:      timestamp,
		PrevHashRef:    prevHashRef,
		SubmittingPeer: submittingPeer,
	}

	recordJSON, err := json.Marshal(record)
	if err != nil {
		return err
	}

	// 1. Save historical record
	historicalKey, err := ctx.GetStub().CreateCompositeKey("record~deviceID~timestamp", []string{deviceID, fmt.Sprintf("%d", timestamp)})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}

	err = ctx.GetStub().PutState(historicalKey, recordJSON)
	if err != nil {
		return fmt.Errorf("failed to put historical state: %v", err)
	}

	// 2. Save/Update latest record
	err = ctx.GetStub().PutState(deviceID, recordJSON)
	if err != nil {
		return fmt.Errorf("failed to put latest state: %v", err)
	}

	return nil
}

// GetLatestRecord returns the most recent state record for a device
func (s *SmartContract) GetLatestRecord(ctx contractapi.TransactionContextInterface, deviceID string) (*StateRecord, error) {
	recordJSON, err := ctx.GetStub().GetState(deviceID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if recordJSON == nil {
		return nil, fmt.Errorf("the device %s does not exist", deviceID)
	}

	var record StateRecord
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

// GetRecord returns a specific historical record for a device using its timestamp
func (s *SmartContract) GetRecord(ctx contractapi.TransactionContextInterface, deviceID string, timestamp int64) (*StateRecord, error) {
	historicalKey, err := ctx.GetStub().CreateCompositeKey("record~deviceID~timestamp", []string{deviceID, fmt.Sprintf("%d", timestamp)})
	if err != nil {
		return nil, fmt.Errorf("failed to create composite key: %v", err)
	}

	recordJSON, err := ctx.GetStub().GetState(historicalKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if recordJSON == nil {
		return nil, fmt.Errorf("the record for device %s at timestamp %d does not exist", deviceID, timestamp)
	}

	var record StateRecord
	err = json.Unmarshal(recordJSON, &record)
	if err != nil {
		return nil, err
	}

	return &record, nil
}

func main() {
	chaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating digital twin chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting digital twin chaincode: %v", err)
	}
}
