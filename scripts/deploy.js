require('dotenv').config();
const { ethers } = require("ethers");
const DigiCoinABI = require('../artifacts/contracts/DigiCoin.sol/DigiCoin.json').abi;

async function main() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deploying DigiCoin contract...");

  const DigiCoin = new ethers.ContractFactory(DigiCoinABI, DigiCoinABI.bytecode, wallet);
  const initialSupply = ethers.utils.parseEther("1000000"); // 100万DigiCoin
  const digiCoin = await DigiCoin.deploy(initialSupply);

  await digiCoin.deployed();

  console.log("DigiCoin deployed to:", digiCoin.address);

  // コントラクトアドレスを.envファイルに書き込む
  const fs = require('fs');
  fs.appendFileSync('.env', `\nDIGICOIN_CONTRACT_ADDRESS=${digiCoin.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });