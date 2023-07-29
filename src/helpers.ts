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
