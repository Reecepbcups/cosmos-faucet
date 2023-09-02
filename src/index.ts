import { CosmWasmClient, SigningCosmWasmClient, GasPrice, coin, calculateFee } from "cosmwasm";

// import stargate client from stargate
import { SigningStargateClient } from "@cosmjs/stargate";

import { getAccountFromMnemonic } from "./helpers"

import express from 'express';
import cors from 'cors';

import fs from 'fs';

import { config } from 'dotenv';
config();
const { API_PORT } = process.env;


const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


let cooldown_map = new Map();

interface ChainInfo {
    rpc_url: string;
    prefix: string;
    faucet_mnemonic: string;
    denom: string;
    amount_to_send: number;
    gas_price: number;
    gas_amount: number;
    cooldown_seconds: number;
    error?: string;
}

function get_chain(chain_id: string) {
    if (chain_id === undefined) {
        return {
            error: 'Chain not found'
        }
    }

    let chains = JSON.parse(fs.readFileSync('chains.json', 'utf8'));
    let chain_keys = Object.keys(chains);
    let chain = chains[chain_id];

    if (chain === undefined) {
        return {
            error: 'Chain not found',
            chains: chain_keys
        }
    }

    return chain;
}


// === endpoints ===

app.get('/', (req, res) => {
    const base_url = req.protocol + '://' + req.get('host') + req.originalUrl;
    res.json({
        endpoints: [
            `Get Faucet Info: ${base_url}<chain_id>`,
            `Requests Funds (~6 second wait): ${base_url}<chain_id>/<address>`
        ],
        chains: Object.keys(JSON.parse(fs.readFileSync('chains.json', 'utf8')))
    })
})


app.get('/:chain_id', async (req, res) => {    
    const { chain_id } = req.params;

    let chain = get_chain(chain_id);
    if (!chain || chain.error) {
        res.status(400).json(chain);
        return;
    }

    chain = chain as ChainInfo;

    try {
        const payment_account = await getAccountFromMnemonic(chain.faucet_mnemonic, chain.prefix);
    
        const client = await CosmWasmClient.connect(chain.rpc_url);
        const balance = await client.getBalance(payment_account.account.address, chain.denom);


        res.json({
            faucet_addr: payment_account.account.address,
            faucet_balance: balance
        })
    } catch (error: any) {
        res.status(400).json({
            error: error.message
        })
    }

})


app.get('/:chain_id/:address', async (req, res) => {
    const { chain_id, address } = req.params;

    // ensure address is only alphanumeric
    // if (!address.match(/^[a-zA-Z0-9]+$/)) {
    //     res.status(400).json({
    //         error: 'Address is not valid'
    //     })
    //     return;
    // }



    let chain = get_chain(chain_id);
    if (!chain || chain.error) {
        res.status(400).json(chain);
        return;
    }

    chain = chain as ChainInfo;

    // ensure address is valid and starts with prefix
    if (!address.startsWith(chain.prefix)) {
        res.status(400).json({
            error: 'Address is not valid'
        })
    }
    
    const map_key = `${chain_id}-${address}`;
    if (cooldown_map.has(map_key)) {
        let cooldown = cooldown_map.get(map_key);
        let seconds_until_then = (cooldown - Date.now()) / 1000;
        if (cooldown > Date.now()) {
            res.status(400).json({                
                error: `Address is in cooldown for ${seconds_until_then} seconds`
            })
            return;
        }
    }

    const payment_account = await getAccountFromMnemonic(chain.faucet_mnemonic, chain.prefix); 
    if (address === payment_account.account.address) {
        res.status(400).json({
            error: 'Address is the same as the faucet address'
        })
        return;
    }

    const config = {
        chainId: chain_id,
        rpcEndpoint: chain.rpc_url,
        prefix: chain.prefix,
    }
    const fee = calculateFee(chain.gas_amount, GasPrice.fromString(`${chain.gas_price}${chain.denom}`));

    try {
        const client = await SigningStargateClient.connectWithSigner(config.rpcEndpoint, payment_account.wallet);
        const amt = coin(chain.amount_to_send, chain.denom);

        let result = await client.sendTokens(payment_account.account.address, address, [amt], fee);
        if (result.code === 0) {
            cooldown_map.set(map_key, Date.now() + chain.cooldown_seconds * 1000);
        }

        res.json({
            message: `Payment of amount: ${amt.amount} ${amt.denom}`,
            faucet_account: payment_account.account.address,        
            result: result
        })

    } catch (error: any) {
        console.log(error.message)
        res.json({
            error: error.message
        })
    }
})


app.listen(API_PORT, () => {
    if(!API_PORT) {
        console.error('API_PORT is not defined. Follow README.md instructions to set up .env file.');
        process.exit(1);
    }

    console.log(`Server is running on port ${API_PORT}`);
})
