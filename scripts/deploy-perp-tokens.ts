import * as fs from "fs";
import { ethers, upgrades } from "hardhat";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("👤 Deployer:", deployer.address);

  try {
    console.log("🚀 Deploying Perp V2 compatible tokens...");

    // 1. 部署 BaseToken
    console.log("\n🏷️  Deploying BaseToken...");
    const BaseToken = await ethers.getContractFactory("VirtualToken");
    const baseToken = await upgrades.deployProxy(
      BaseToken,
      ["Perp Base Token", "PBASE"],
      { initializer: "__VirtualToken_init", kind: "transparent" }
    );
    await baseToken.deployed();
    console.log(`✅ BaseToken deployed to: ${baseToken.address}`);

    // 2. 部署 QuoteToken  
    console.log("\n💵 Deploying QuoteToken...");
    const QuoteToken = await ethers.getContractFactory("QuoteToken");
    const quoteToken = await upgrades.deployProxy(
      QuoteToken,
      ["Perp Quote Token", "PQUOTE"],
      { initializer: "initialize", kind: "transparent" }
    );
    await quoteToken.deployed();
    console.log(`✅ QuoteToken deployed to: ${quoteToken.address}`);

    // 3. 检查地址排序（确保 baseToken < quoteToken）
    console.log("\n🔍 Checking token address order...");
    if (baseToken.address.toLowerCase() >= quoteToken.address.toLowerCase()) {
      console.error("❌ Token address order invalid! BaseToken must be less than QuoteToken");
      console.log(`   BaseToken: ${baseToken.address}`);
      console.log(`   QuoteToken: ${quoteToken.address}`);
      console.log("   Please redeploy in different order");
      process.exit(1);
    }
    console.log("✅ Token address order is correct");

    // 4. 铸造最大供应量
    console.log("\n💰 Minting maximum supply...");
    const baseMintTx = await baseToken.mintMaximumTo(deployer.address);
    await baseMintTx.wait();
    console.log("✅ BaseToken maximum supply minted");

    const quoteMintTx = await quoteToken.mintMaximumTo(deployer.address);
    await quoteMintTx.wait();
    console.log("✅ QuoteToken maximum supply minted");

    // 5. 保存部署信息
    const deploymentDir = path.join(__dirname, "../deployments/sepolia");
    if (!fs.existsSync(deploymentDir)) {
      fs.mkdirSync(deploymentDir, { recursive: true });
    }

    const deployment = {
      timestamp: new Date().toISOString(),
      network: "sepolia",
      deployer: deployer.address,
      tokens: {
        baseToken: {
          address: baseToken.address,
          name: "Perp Base Token",
          symbol: "PBASE",
          decimals: 18
        },
        quoteToken: {
          address: quoteToken.address,
          name: "Perp Quote Token", 
          symbol: "PQUOTE",
          decimals: 18
        }
      },
      notes: [
        "These tokens are compatible with Perp V2 protocol",
        "Need to create Uniswap V3 pool with these tokens",
        "BaseToken must be token0, QuoteToken must be token1",
        "Will need to setup whitelist after deploying other contracts"
      ]
    };

    fs.writeFileSync(
      path.join(deploymentDir, "perp-tokens.json"),
      JSON.stringify(deployment, null, 2)
    );

    console.log("\n🎉 Perp V2 tokens deployed successfully!");
    console.log("\n📋 Token Addresses:");
    console.log(`   BaseToken (PBASE): ${baseToken.address}`);
    console.log(`   QuoteToken (PQUOTE): ${quoteToken.address}`);
    console.log("\n⏭️  Next Steps:");
    console.log("   1. Create Uniswap V3 pool with these tokens");
    console.log("   2. Deploy MarketRegistry");
    console.log("   3. Deploy other Perp V2 contracts");
    console.log("   4. Setup whitelist for all contracts");

  } catch (error) {
    console.error("💥 Deployment failed:", error);
    process.exit(1);
  }
}

main().catch(console.error);