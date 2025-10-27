import * as fs from "fs";
import { ethers, upgrades } from "hardhat";
import * as path from "path";

// 保险基金配置 - 只需要结算代币地址
const INSURANCE_FUND_CONFIG = {
  SETTLEMENT_TOKEN: "0x41cffbce944ddcb71769dec7c7628a4cf88bad9f", // Sepolia TKA
};

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);
  console.log(`💰 ETH Balance: ${ethers.utils.formatEther(await deployer.getBalance())} ETH`);

  try {
    console.log("🚀 Deploying InsuranceFund...");
    console.log(`   Settlement Token: ${INSURANCE_FUND_CONFIG.SETTLEMENT_TOKEN}`);

    // 1. 部署 InsuranceFund 合约
    const InsuranceFund = await ethers.getContractFactory("InsuranceFund");
    const insuranceFund = await upgrades.deployProxy(
      InsuranceFund,
      [INSURANCE_FUND_CONFIG.SETTLEMENT_TOKEN],
      {
        initializer: "initialize",
        kind: "transparent" // 使用透明代理模式
      }
    );

    await insuranceFund.deployed();
    
    console.log(`✅ InsuranceFund deployed to: ${insuranceFund.address}`);

    // 2. 验证基本功能
    console.log("\n🔍 Verifying basic functionality...");
    const token = await insuranceFund.getToken();
    console.log(`✅ Settlement Token: ${token}`);
    
    const vault = await insuranceFund.getVault();
    console.log(`✅ Vault: ${vault} (will be set later)`);
    
    const beneficiary = await insuranceFund.getSurplusBeneficiary();
    console.log(`✅ Surplus Beneficiary: ${beneficiary} (will be set later)`);

    // 3. 保存部署信息
    const deploymentDir = path.join(__dirname, "../deployments/sepolia");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deployment = {
      timestamp: new Date().toISOString(),
      network: "sepolia",
      contract: "InsuranceFund",
      address: insuranceFund.address,
      settlementToken: INSURANCE_FUND_CONFIG.SETTLEMENT_TOKEN,
      implementation: await upgrades.erc1967.getImplementationAddress(insuranceFund.address),
      notes: "Vault and SurplusBeneficiary need to be set later"
    };

    fs.writeFileSync(
      path.join(deploymentDir, "insurance-fund.json"),
      JSON.stringify(deployment, null, 2)
    );

    console.log("\n💾 Deployment saved to: deployments/sepolia/insurance-fund.json");

    console.log("\n🎉 Insurance Fund deployed successfully!");
    console.log("\n📋 Next Steps:");
    console.log("   1. Deploy Vault contract (if not already deployed)");
    console.log("   2. Deploy SurplusBeneficiary contract (if needed)");
    console.log("   3. Run set-vault.ts to set Vault address");
    console.log("   4. Run set-beneficiary.ts to set SurplusBeneficiary address");

  } catch (error) {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  }
}

// 运行部署
main().catch(console.error);