// scripts/deploy-order-book.ts
import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("开始部署 OrderBook 合约...");

  // 配置参数
  const MARKET_REGISTRY = "0x09EDAC3c1a7547c865ecDac2E8B9C63d00b8b6B8";

  console.log("使用参数:");
  console.log("MarketRegistry:", MARKET_REGISTRY);

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", (await deployer.getBalance()).toString());

  // 验证 MarketRegistry 合约
  console.log("\n验证 MarketRegistry 合约...");
  const marketRegistry = await ethers.getContractAt("IMarketRegistry", MARKET_REGISTRY);
  
  try {
    const quoteToken = await marketRegistry.getQuoteToken();
    const uniswapV3Factory = await marketRegistry.getUniswapV3Factory();
    const maxOrdersPerMarket = await marketRegistry.getMaxOrdersPerMarket();
    
    console.log("✓ MarketRegistry 验证成功");
    console.log("  Quote Token:", quoteToken);
    console.log("  UniswapV3 Factory:", uniswapV3Factory);
    console.log("  Max Orders Per Market:", maxOrdersPerMarket.toString());
  } catch (error) {
    console.error("✗ MarketRegistry 验证失败:", error);
    throw error;
  }

  // 部署 OrderBook 合约
  const OrderBook = await ethers.getContractFactory("OrderBook");
  
  console.log("\n正在部署 OrderBook...");
  const orderBook = await upgrades.deployProxy(
    OrderBook,
    [MARKET_REGISTRY],
    { 
      initializer: "initialize",
      kind: "transparent"
    }
  );

  await orderBook.deployed();
  console.log("OrderBook 已部署到:", orderBook.address);

  // 验证合约信息
  console.log("\n验证 OrderBook 配置...");
  
  const exchange = await orderBook.getExchange();
  const marketRegistryFromContract = await orderBook.marketRegistry();

  console.log("Exchange 地址:", exchange);
  console.log("MarketRegistry 地址:", marketRegistryFromContract);

  // 验证实现合约地址
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(orderBook.address);
  console.log("实现合约地址:", implementationAddress);

  // 验证代理管理员地址
  const adminAddress = await upgrades.erc1967.getAdminAddress(orderBook.address);
  console.log("代理管理员地址:", adminAddress);

  // 保存部署信息到文件
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    timestamp: new Date().toISOString(),
    orderBook: {
      proxy: orderBook.address,
      implementation: implementationAddress,
      admin: adminAddress,
    },
    marketRegistry: MARKET_REGISTRY,
    deployer: deployer.address,
  };

  // 保存到 JSON 文件
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `order-book-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n部署信息已保存到:", deploymentFile);

  console.log("\n部署完成!");
  console.log("OrderBook 代理地址:", orderBook.address);
  console.log("OrderBook 实现地址:", implementationAddress);
  console.log("代理管理员地址:", adminAddress);

  return {
    orderBook,
    implementationAddress,
    adminAddress,
    deploymentFile
  };
}

// 错误处理
main().catch((error) => {
  console.error("部署失败:", error);
  process.exit(1);
});

export { main };

// scripts/deploy-order-book-workaround.ts
// scripts/deploy-order-book-correct.ts
