'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');
const crypto = require('crypto');

class DeviationTriggeredWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = 0;
    }

    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
    }

    async submitTransaction() {
        this.txIndex++;
        const deviceId = `sensor_bench_dev_${this.workerIndex}`;
        
        // Simulating a payload that deviated significantly (e.g. huge temp spike)
        const payloadString = JSON.stringify({ temp: 95.0 + (Math.random() * 5), index: this.txIndex, alert: 'DEVIATION_DETECTED' });
        const hash = crypto.createHash('sha256').update(payloadString).digest('hex');
        const ipfsCid = "QmCaliperDev" + hash.substring(0, 10);
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
    return new DeviationTriggeredWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;
