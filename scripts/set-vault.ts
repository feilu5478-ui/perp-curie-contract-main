import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // 从部署文件读取 InsuranceFund 地址
  // const deploymentFile = path.join(__dirname, "../deployments/sepolia/insurance-fund.json");
  // if (!fs.existsSync(deploymentFile)) {
  //   console.error("❌ InsuranceFund deployment not found. Please deploy InsuranceFund first.");
  //   return;
  // }

  // const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const insuranceFundAddress = "0x0adB0e5c9C2aFaE2D8DEf8C32EF3C51383e15E26";

  // 🔥 在这里填入你的 Vault 地址
  const VAULT_ADDRESS = "0xf12285fF19c58bD751dA4f604ebefc0C9Df00A10"; // 替换为实际的 Vault 地址

  // if (VAULT_ADDRESS === "0x2EE8E5374a8A89f4B3B98018703F6d131B1de013") {
  //   console.error("❌ Please set the VAULT_ADDRESS in the script");
  //   return;
  // }

  console.log("🔗 Setting Vault for Insurance Fund...");
  console.log(`   InsuranceFund: ${insuranceFundAddress}`);
  console.log(`   Vault: ${VAULT_ADDRESS}`);

  const insuranceFund = await ethers.getContractAt("InsuranceFund", insuranceFundAddress);
  
  const setTx = await insuranceFund.setVault(VAULT_ADDRESS);
  await setTx.wait();
  
  console.log("✅ Vault set successfully!");
  
  // 验证设置
  const currentVault = await insuranceFund.getVault();
  console.log(`✅ Current Vault: ${currentVault}`);
}

main().catch(console.error);



// import * as fs from "fs";
// import { ethers } from "hardhat";
// import * as path from "path";

// async function main() {
//   const [deployer] = await ethers.getSigners();
  
//   // 从部署文件读取 InsuranceFund 地址
//   const deploymentFile = path.join(__dirname, "../deployments/sepolia/insurance-fund.json");
//   if (!fs.existsSync(deploymentFile)) {
//     console.error("❌ InsuranceFund deployment not found. Please deploy InsuranceFund first.");
//     return;
//   }

//   const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
//   const insuranceFundAddress = deployment.address;

//   // 🔥 在这里填入你的 Vault 地址
//   const VAULT_ADDRESS = "0x2EE8E5374a8A89f4B3B98018703F6d131B1de013"; // 替换为实际的 Vault 地址

//   // if (VAULT_ADDRESS === "0x2EE8E5374a8A89f4B3B98018703F6d131B1de013") {
//   //   console.error("❌ Please set the VAULT_ADDRESS in the script");
//   //   return;
//   // }

//   console.log("🔗 Setting Vault for Insurance Fund...");
//   console.log(`   InsuranceFund: ${insuranceFundAddress}`);
//   console.log(`   Vault: ${VAULT_ADDRESS}`);

//   const insuranceFund = await ethers.getContractAt("InsuranceFund", insuranceFundAddress);
  
//   const setTx = await insuranceFund.setVault(VAULT_ADDRESS);
//   await setTx.wait();
  
//   console.log("✅ Vault set successfully!");
  
//   // 验证设置
//   const currentVault = await insuranceFund.getVault();
//   console.log(`✅ Current Vault: ${currentVault}`);
// }

// main().catch(console.error);