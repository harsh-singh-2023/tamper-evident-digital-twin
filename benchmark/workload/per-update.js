'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const crypto = require('crypto');

class PerUpdateWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
    }

    async submitTransaction() {
        this.txIndex++;
        const deviceId = `sensor_bench_${this.workerIndex}`;
        const payloadString = JSON.stringify({ temp: 40 + (Math.random() * 10), index: this.txIndex });
        const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
        const ipfsCid = "QmCaliperBench" + hash.substring(0, 10);
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
    return new PerUpdateWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
