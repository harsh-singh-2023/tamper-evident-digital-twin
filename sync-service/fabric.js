const grpc = require('@grpc/grpc-js');
const { connect, signers } = require('@hyperledger/fabric-gateway');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

async function newGrpcConnection(tlsCertPath, peerEndpoint, peerHostAlias) {
    const tlsRootCert = await fs.readFile(tlsCertPath);
    const tlsCredentials = grpc.credentials.createSsl(tlsRootCert);
    return new grpc.Client(peerEndpoint, tlsCredentials, {
        'grpc.ssl_target_name_override': peerHostAlias,
    });
}

async function newIdentity(certPath, mspId) {
    const credentials = await fs.readFile(certPath);
    return { mspId, credentials };
}

async function newSigner(keyPath) {
    const files = await fs.readdir(keyPath);
    const keyFile = files.find(file => file.endsWith('_sk'));
    if (!keyFile) {
        throw new Error(`No private key found in ${keyPath}`);
    }
    const privateKeyPath = path.join(keyPath, keyFile);
    const privateKeyPem = await fs.readFile(privateKeyPath);
    const privateKey = crypto.createPrivateKey(privateKeyPem);
    return signers.newPrivateKeySigner(privateKey);
}

/**
 * Initializes the Fabric Gateway connection.
 * Relies on environment variables for paths and endpoints.
 */
async function initFabric() {
    const mspId = process.env.MSP_ID || 'Org1MSP';
    const cryptoPath = process.env.CRYPTO_PATH;
    const tlsCertPath = process.env.TLS_CERT_PATH;
    const certPath = process.env.CERT_PATH;
    const keyPath = process.env.KEY_PATH;
    const peerEndpoint = process.env.PEER_ENDPOINT || 'localhost:7051';
    const peerHostAlias = process.env.PEER_HOST_ALIAS || 'peer0.org1.example.com';

    if (!cryptoPath || !tlsCertPath || !certPath || !keyPath) {
        console.warn('[Warning] Fabric crypto paths not fully configured in .env. Falling back to mock Fabric connection for testing.');
        return null;
    }

    const client = await newGrpcConnection(tlsCertPath, peerEndpoint, peerHostAlias);
    const identity = await newIdentity(certPath, mspId);
    const signer = await newSigner(keyPath);

    const gateway = connect({
        client,
        identity,
        signer,
        evaluateOptions: () => {
            return { deadline: Date.now() + 5000 };
        },
        endorseOptions: () => {
            return { deadline: Date.now() + 15000 };
        },
        submitOptions: () => {
            return { deadline: Date.now() + 5000 };
        },
        commitStatusOptions: () => {
            return { deadline: Date.now() + 60000 };
        },
    });

    return { gateway, client };
}

module.exports = {
    initFabric
};
