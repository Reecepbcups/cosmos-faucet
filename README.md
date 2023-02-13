# Cosmos Faucet

Get funds through a browser GET request or cURL, making it easy for users without needing a discord bot. Configuration files allow adding multiple chain and mnemonic options for various network faucets.

## Usage

```bash
# NODE: add chain ids in the chains.json file (can run multiple faucets on 1 instance)

# Show which chains and endpoints there are
GET https://ip:port/

# Get information about the faucet for a given chain
GET https://ip:port/<chain_id>

# Send funds to an address on the given chain
GET https://ip:port/<chain_id>/<address>
```

## Install

```bash
sudo apt update

# install nodejs
curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.34.0/install.sh | bash
bash # new instance
nvm install node

# if you get broken install bc ubuntu is a pain
cd /etc/apt/sources.list.d 
sudo rm nodesource.list
sudo apt --fix-broken install
sudo apt update
sudo apt remove nodejs npm node nodejs-doc
# then install node js again from above nvm
```

```bash
cp configs/.env.example .env
# edit the port you want it to run on

cp configs/chains.json.example chains.json
# add chains / mnemonics you want to use. On start, you can view addresses via http://ip:port/<chain_id>

# local
npm run start

# prod
npm i pm2 --global
pm2 start src/index.ts --name faucet --watch --interpreter ./node_modules/.bin/ts-node
# pm2 logs
# pm2 stop faucet
```
