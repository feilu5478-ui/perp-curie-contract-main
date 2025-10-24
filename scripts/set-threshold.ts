import * as fs from "fs";
import { ethers } from "hardhat";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  const deploymentFile = path.join(__dirname, "../deployments/sepolia/insurance-fund.json");
  if (!fs.existsSync(deploymentFile)) {
    console.error("❌ InsuranceFund deployment not found.");
    return;
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentFile, "utf8"));
  const insuranceFundAddress = deployment.address;

  // 🔥 设置分布阈值（例如：100,000 TKA）
  const THRESHOLD = ethers.utils.parseUnits("100000", 18); // 根据代币小数位数调整

  console.log("💰 Setting distribution threshold...");
  console.log(`   InsuranceFund: ${insuranceFundAddress}`);
  console.log(`   Threshold: ${ethers.utils.formatUnits(THRESHOLD, 18)} TKA`);

  const insuranceFund = await ethers.getContractAt("InsuranceFund", insuranceFundAddress);
  
  const setTx = await insuranceFund.setDistributionThreshold(THRESHOLD);
  await setTx.wait();
  
  console.log("✅ Distribution threshold set successfully!");
  
  // 验证设置
  const currentThreshold = await insuranceFund.getDistributionThreshold();
  console.log(`✅ Current Threshold: ${ethers.utils.formatUnits(currentThreshold, 18)} TKA`);
}

main().catch(console.error);