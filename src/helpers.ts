import { Coin } from "@cosmjs/stargate";
import { Secp256k1HdWallet } from "cosmwasm";

export const getAccountFromMnemonic = async (mnemonic: any, prefix: string = "cosmos") => {
    let wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, { prefix: prefix });
    const [account] = await wallet.getAccounts();
    return {
        wallet: wallet,
        account: account,
    }
}

export const getRandomAccount = async (prefix: string = "cosmos") => {
    let wallet = await Secp256k1HdWallet.generate(12, { prefix: prefix });
    const [account] = await wallet.getAccounts();
    return {
        wallet: wallet,
        account: account
    }
};


export const sendTokensToAccount = async (client: any, data: any, to_address: string, rpc: string, coins: [Coin], fee: any) => {
    const result = await client.sendTokens(data.account.address, to_address, coins, fee);
    return result;
}