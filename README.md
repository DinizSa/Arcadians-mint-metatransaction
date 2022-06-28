# `mint-as-metatransaction` based on `moralis-biconomy-metatransactions`

This Project is a fork of [Ethereum Boilerplate](https://github.com/ethereum-boilerplate/ethereum-boilerplate) and demostrates how you can enable gasless transaction/metatransactions using Moralis and Biconomy. This project of course work on any EVM-compatible blockchain such as Polygon, Avalanche, Binance Smart Chain and other such chains.

![dapp3](https://github.com/DinizSa/Arcadians-mint-with-metatransaction/blob/free-mint/preview.gif)

# 🚀 Quick Start

📄 Clone or fork `moralis-biconomy-metatransactions`:
```sh
git clone https://github.com/DinizSa/Arcadians-mint-with-metatransaction
```
💿 Install all dependencies:
```sh
cd moralis-biconomy-metatransactions
yarn install 
```
✏ Rename `.env.example` to `.env` in the main folder and provide your `appId` and `serverUrl` from Moralis ([How to start Moralis Server](https://docs.moralis.io/moralis-server/getting-started/create-a-moralis-server)), plus some other Biconomy API Keys and UI related variables:
```jsx
// Web3
REACT_APP_MORALIS_APPLICATION_ID=xxx
REACT_APP_MORALIS_SERVER_URL=xxx
REACT_APP_MORALIS_SPEEDY_NODES_KEY=xxx
REACT_APP_BICONOMY_API_KEY_KOVAN=xxx
REACT_APP_BICONOMY_API_KEY_BSC_TESTNET=xxx
REACT_APP_BICONOMY_API_KEY_MUMBAI=xxx
REACT_APP_BICONOMY_API_KEY_FUJI=xxx
// UI
REACT_APP_COLLECTION_NAME=xxx
REACT_APP_COLLECTION_LOGO=xxx
REACT_APP_COLLECTION_LOGO_REDIRECT=xxx
```

✏ Create a `.secret` document on the root of the folder, and paste the mnemonic of the account that you want o use as deployer of the contracts (Make sure it has native currency in the network that you will deploy.

✏ Deploy your contracts
cd ./Truffle
yarn compile
yarn migrate --network {network_name}
yarn verify {deployed_contract_address} {constructor_paramneter_01} --network {network_name}

Note: In order the frontend to know with which contract he should communicate, paste the newly contract address generated in the migrate step in the respective `chainId` in the file `list/yourCollectible.json`. 
For example, for the mumbai network, the chainId is 80001, so it corresponds to the hexadecimal 0x13881. Then in the `yourCollectible.json`, the key `0x13881` will have the value as the address of the deployed contract.

# Metatransaction components
There are four components that allow the metatransaction flow
✏ Frontend application
Send signed metatransaction to the relay

✏ Biconomy Relay
You need to setup a relay so he can receive the metatransaction, and call the trusted forwarder contract, paying for the gas of the transaction. In this project we use the (biconomy relay)[https://dashboard.biconomy.io/dapps]. To see how to setup this relay, please check the (tutorial video)[https://www.youtube.com/watch?v=r04x1YqnYLk&list=LL&index=6]. This relay needs to have funds so he can pay for the transaction.

✏ Trusted Forwarder contract
You don't need to deploy this contract, since biconomy deployed the TrustedForwarder contract in several networks, which you can use. See `Truffle/list/biconomyForwarder.json` to see the address of this contract in each network.

✏ Recipient contract
This is the final contract that you want to change state with the metatransaction. There are come changes that you need to do in your contract.
  - Make your contract extend from "@opengsn/contracts/src/BaseRelayRecipient.sol"
  - Register via argument in the constructor of your contract the address of `biconomyForwarder.json`, for the desired network.
  - Through all the contract, replace `msg.sender()` with `_msgSender()`, so your contract has the ability to properly read the sender address in case of metatransactions.

🚴‍♂️ Run your App:
```sh
yarn start
```



