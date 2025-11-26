import * as fs from "fs";
import { ethers } from "hardhat";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  // 从部署文件读取 InsuranceFund 地址
  const deploymentFile = path.join(__dirname, "../deployments/sepolia/insurance-fund.json");
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ InsuranceFund deployment not found. Please deploy InsuranceFund first.");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const insuranceFundAddress = deployment.address;

  // 🔥 在这里填入你的 SurplusBeneficiary 地址
  const BENEFICIARY_ADDRESS = "YOUR_BENEFICIARY_ADDRESS_HERE"; // 替换为实际的受益人地址

  if (BENEFICIARY_ADDRESS === "YOUR_BENEFICIARY_ADDRESS_HERE") {
    console.error("❌ Please set the BENEFICIARY_ADDRESS in the script");
    return;
  }

  console.log("🎁 Setting Surplus Beneficiary for Insurance Fund...");
  console.log(`   InsuranceFund: ${insuranceFundAddress}`);
  console.log(`   Beneficiary: ${BENEFICIARY_ADDRESS}`);

  const insuranceFund = await ethers.getContractAt("InsuranceFund", insuranceFundAddress);
  
  const setTx = await insuranceFund.setSurplusBeneficiary(BENEFICIARY_ADDRESS);
  await setTx.wait();
  
  console.log("✅ Surplus Beneficiary set successfully!");
  
  // 验证设置
  const currentBeneficiary = await insuranceFund.getSurplusBeneficiary();
  console.log(`✅ Current Surplus Beneficiary: ${currentBeneficiary}`);
}

main().catch(console.error);