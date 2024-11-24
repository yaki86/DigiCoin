const hre = require("hardhat");
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

async function main() {
  try {
    // ネットワーク接続の確認
    const network = await hre.ethers.provider.getNetwork();
    console.log("接続先ネットワーク:", network.name);

    // ウォレット情報の取得
    const [signer] = await hre.ethers.getSigners();
    console.log("ウォレットアドレス:", await signer.getAddress());

    // 残高の確認
    const balance = await hre.ethers.provider.getBalance(signer.address);
    console.log("ETH残高:", ethers.formatEther(balance), "ETH");

    // 環境変数の確認
    const digiCoinAddress = process.env.DIGICOIN_CONTRACT_ADDRESS;
    console.log("DIGICOIN_CONTRACT_ADDRESS:", digiCoinAddress);

    if (!digiCoinAddress) {
      throw new Error("DIGICOIN_CONTRACT_ADDRESS is not set in the environment variables");
    }

    // ABIの読み込み
    const contractPath = path.join(__dirname, "../artifacts/contracts/DigiCoin.sol/DigiCoin.json");
    const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
    const abi = contractJson.abi;
    console.log("ABI読み込み成功");

    // DigiCoinコントラクトの接続
    const digiCoin = new ethers.Contract(digiCoinAddress, abi, signer);
    console.log("DigiCoinコントラクトアドレス:", digiCoin.target);

    // コントラクトの関数呼び出しテスト
    try {
      const owner = await digiCoin.owner();
      console.log("コントラクトオーナー:", owner);
    } catch (error) {
      console.error("コントラクトの関数呼び出しに失敗しました:", error.message);
    }

    // コントラクトのバイトコード取得
    const bytecode = await hre.ethers.provider.getCode(digiCoinAddress);
    console.log("コントラクトのバイトコード長:", bytecode.length);
    if (bytecode === "0x") {
      console.error("警告: 指定されたアドレスにコントラクトが存在しません");
    }

    // ガス価格の取得
    const feeData = await hre.ethers.provider.getFeeData();
    console.log("現在のガス価格:", ethers.formatUnits(feeData.gasPrice, "gwei"), "Gwei");

    // ブロック番号の取得
    const blockNumber = await hre.ethers.provider.getBlockNumber();
    console.log("現在のブロック番号:", blockNumber);

    console.log("デバッグ完了");
  } catch (error) {
    console.error("エラーが発生しました:");
    console.error(error.message);
    if (error.stack) {
      console.error("スタックトレース:");
      console.error(error.stack);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

