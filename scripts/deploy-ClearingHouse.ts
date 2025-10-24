import * as fs from "fs";
import { ethers, upgrades } from "hardhat";
import * as path from "path";

async function main() {
  console.log("开始部署 ClearingHouse 合约...");

  // 部署参数
  const clearingHouseConfigArg = "0x2D0F2F30E47918be3D99dF88983251DA221063DE";
  const vaultArg = "0x78BCe05B99dD4a9e352e60a2ae6FDDE21a839cc2";
  const quoteTokenArg = "0x41cffBcE944DDcb71769Dec7C7628a4Cf88Bad9F";
  const uniV3FactoryArg = "0xCbaec1555707dFAff3303ed6123Db16Eb67F1791";
  const exchangeArg = "0x00c8f23c3e497FD3Ed5af36471cc29dD96028883";
  const accountBalanceArg = "0x93EC9F5e8037c4fA5e2490A6e774B1e97Bd4CFA2";
  const insuranceFundArg = "0x03063939aCaE3231b3ec535207833B2f37bCD848";

  // 获取网络信息
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  
  console.log(`部署到网络: ${networkName}`);

  // 获取合约工厂
  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");

  // 使用可升级模式部署
  const clearingHouse = await upgrades.deployProxy(
    ClearingHouse,
    [
      clearingHouseConfigArg,
      vaultArg,
      quoteTokenArg,
      uniV3FactoryArg,
      exchangeArg,
      accountBalanceArg,
      insuranceFundArg
    ],
    {
      initializer: "initialize",
      kind: "transparent",
    }
  );

  // 等待部署完成
  await clearingHouse.deployed();
  
  // 获取部署交易信息
  const deploymentTransaction = clearingHouse.deployTransaction;
  const receipt = await deploymentTransaction.wait();

  console.log("ClearingHouse 代理合约地址:", clearingHouse.address);
  
  // 获取实现合约地址
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(clearingHouse.address);
  console.log("ClearingHouse 实现合约地址:", implementationAddress);

  // 获取代理管理员地址
  const adminAddress = await upgrades.erc1967.getAdminAddress(clearingHouse.address);
  console.log("代理管理员地址:", adminAddress);

  // 验证合约
  console.log("验证合约初始化状态...");
  
  const quoteToken = await clearingHouse.getQuoteToken();
  console.log("Quote Token:", quoteToken);
  
  const vault = await clearingHouse.getVault();
  console.log("Vault:", vault);
  
  const exchange = await clearingHouse.getExchange();
  console.log("Exchange:", exchange);

  // 保存部署信息
  const deploymentInfo = {
    network: networkName,
    timestamp: new Date().toISOString(),
    proxyAddress: clearingHouse.address,
    implementationAddress: implementationAddress,
    adminAddress: adminAddress,
    blockNumber: receipt.blockNumber,
    transactionHash: deploymentTransaction.hash
  };

  // 创建部署目录
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  // 保存部署信息
  const deploymentFile = path.join(deploymentsDir, `ClearingHouse-${networkName}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`部署信息已保存到: ${deploymentFile}`);

  console.log("ClearingHouse 合约部署完成!");
}

// 错误处理
main().catch((error) => {
  console.error("部署失败:", error);
  process.exit(1);
});