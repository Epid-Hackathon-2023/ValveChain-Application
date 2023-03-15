/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const os = require("os");
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require(os.homedir() + '/ValveChain-Application/test-application/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require(os.homedir() + '/ValveChain-Application/test-application/AppUtil.js');



// pre-requisites:
// - fabric-sample two organization test-network setup with two peers, ordering service,
//   and 2 certificate authorities
//         ===> from directory /fabric-samples/test-network
//         ./network.sh up createChannel -ca
// - Use any of the asset-transfer-basic chaincodes deployed on the channel "mychannel"
//   with the chaincode name of "basic". The following deploy command will package,
//   install, approve, and commit the javascript chaincode, all the actions it takes
//   to deploy a chaincode to a channel.
//         ===> from directory /fabric-samples/test-network
//         ./network.sh deployCC -ccn basic -ccp ~/ValveChain-chaincode/ -ccl javascript
// - Be sure that node.js is installed
//         ===> from directory /ValveChain-Application
//         node -v
// - npm installed code dependencies
//         ===> from directory /ValveChain-Application
//         npm install
// - to run this test application
//         ===> from directory /ValveChain-Application
//         node app.js

// NOTE: If you see  kind an error like these:
/*
    2020-08-07T20:23:17.590Z - error: [DiscoveryService]: send[mychannel] - Channel:mychannel received discovery error:access denied
    ******** FAILED to run the application: Error: DiscoveryService: mychannel error: access denied
   OR
   Failed to register user : Error: fabric-ca request register failed with errors [[ { code: 20, message: 'Authentication failure' } ]]
   ******** FAILED to run the application: Error: Identity not found in wallet: appUser
*/
// Delete the /ValveChain-Application/wallet directory
// and retry this application.
//
// The certificate authority must have been restarted and the saved certificates for the
// admin and application user are not valid. Deleting the wallet store will force these to be reset
// with the new certificate authority.
//

class ValveChainApplication {
    constructor() {
        this.channelName = process.env.CHANNEL_NAME || 'mychannel';
        this.chaincodeName = process.env.CHAINCODE_NAME || 'basic';
        this.mspOrg1 = 'Org1MSP';
        this.walletPath = path.join(__dirname, 'wallet');
        this.org1UserId = 'javascriptAppUser';
    }

    prettyJSONString(inputString) {
        return JSON.stringify(JSON.parse(inputString), null, 2);
    }

    async initialize() {
        const ccp = buildCCPOrg1();
        const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');
        const wallet = await buildWallet(Wallets, this.walletPath);
        await enrollAdmin(caClient, wallet, this.mspOrg1);
        await registerAndEnrollUser(caClient, wallet, this.mspOrg1, this.org1UserId, 'org1.department1');

        this.gateway = new Gateway();
        await this.gateway.connect(ccp, {
            wallet,
            identity: this.org1UserId,
            discovery: { enabled: true, asLocalhost: true },
        });
        this.network = await this.gateway.getNetwork(this.channelName);
        this.contract = this.network.getContract(this.chaincodeName);
    }

    async createVanne(vanne_id, name, description, position_c, position_a, temp_relevee_amont, temp_relevee_aval, temp_attendue, name_groupe, groupe_localisation) {
        await this.contract.submitTransaction('createVanne', vanne_id, name, description, position_c, position_a, temp_relevee_amont, temp_relevee_aval, temp_attendue, name_groupe, groupe_localisation);
    }

    async updateVanne(vanne_id, vanne_update) {
        await this.contract.submitTransaction('updateVanne', vanne_id, vanne_update);
    }

    async getVanneById(vanne_id) {
        const result = await this.contract.evaluateTransaction('getVanneById', vanne_id);
        console.log('Transaction returned (By ID): ' + this.prettyJSONString(result.toString()));
    }

    async getVanneByName(vanne_name) {
        const result = await this.contract.evaluateTransaction('getVanneByName', vanne_name);
        console.log('Transaction returned (By name): ' + this.prettyJSONString(result.toString()));
    }

    async getVannesByGroupName(groupe_name) {
        const result = await this.contract.evaluateTransaction('getVannesByGroupName', groupe_name);
        console.log('Transaction returned (By groupe): ' + this.prettyJSONString(result.toString()));
    }


    async getAllVannes() {
        const allResults = await this.contract.evaluateTransaction('getAllVannes');
        console.log('All vannes: ' + this.prettyJSONString(allResults.toString()));
    }

    async disconnect() {
        await this.gateway.disconnect();
    }
}

async function main() {
    const app = new ValveChainApplication();
    try {
        await app.initialize();

        await app.createVanne('1', 'ABP 116 VL', 'Réglante secours condensats ABP 302 RE', '', 'F', '', '', '30', 'M2C17', 'entre les pompes CVI 001 à 004 PO et le condenseur. (M2C17)');
        await app.createVanne('2', 'ABP 117 VL', 'Réglante secours condensats ABP 301 RE', '', 'F', '', '', '30', 'M2C17', 'entre les pompes CVI 001 à 004 PO et le condenseur. (M2C17)');
        await app.createVanne('3', 'ABP 118 VL', 'Soupape de sûreté condensats ABP 302 RE', 'S.O', 'I', '', '', '30', 'M2C17', 'entre les pompes CVI 001 à 004 PO et le condenseur. (M2C17)');

        await app.getVanneById('1');
        await app.getVanneById('2');
        await app.getVanneById('3');

        console.log('==================================');

        await app.getVanneByName('ABP 116 VL');
        await app.getVanneByName('ABP 118 VL');

        console.log('==================================');

        await app.getVannesByGroupName('M2C17');

        console.log('==================================');

        const vanne_update_data = { "temp_relevee_amont": "28.1" }
        await app.updateVanne('1', vanne_update_data);
        await app.getVanneById('1');

        console.log('==================================');

        await app.getAllVannes();

    } finally {
        await app.disconnect();
    }
}

main();