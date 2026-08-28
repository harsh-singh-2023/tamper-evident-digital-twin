'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const crypto = require('crypto');

class BatchedWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
        this.batchSize = 10; // Batching 10 sensor updates into 1 ledger anchor
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
    }

    async submitTransaction() {
        this.txIndex++;
        const deviceId = `sensor_bench_${this.workerIndex}`;
        
        // Simulating a batch of 10 readings
        const batch = [];
        for(let i=0; i<this.batchSize; i++) {
            batch.push({ temp: 40 + (Math.random() * 10), index: this.txIndex * this.batchSize + i });
        }
        
        const payloadString = JSON.stringify(batch);
        const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
        const ipfsCid = "QmCaliperBatch" + hash.substring(0, 10);
        const timestamp = Date.now().toString();

        const request = {
            contractId: 'digital-twin',
            contractFunction: 'RecordStateUpdate',
            contractArguments: [deviceId, hash, ipfsCid, timestamp, "prevHash", "Org1MSP"],
            readOnly: false
        };

        await this.sutAdapter.sendRequests(request);
    }
}

function createWorkloadModule() {
    return new BatchedWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
