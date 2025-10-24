// scripts/deploy-order-book-non-upgradeable.ts
import { ethers } from "hardhat";

async function main() {
  console.log("开始部署 OrderBook 合约（不可升级模式）...");

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

  // 部署 OrderBook 合约（不可升级模式）
  console.log("\n正在部署 OrderBook（不可升级模式）...");
  
  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = await OrderBook.deploy();
  
  await orderBook.deployed();
  console.log("✓ OrderBook 合约已部署到:", orderBook.address);

  // 初始化合约
  console.log("初始化 OrderBook 合约...");
  const initTx = await orderBook.initialize(MARKET_REGISTRY);
  await initTx.wait();
  console.log("✓ 合约初始化成功");

  // 验证合约配置
  console.log("\n验证 OrderBook 配置...");
  
  const exchange = await orderBook.getExchange();
  const owner = await orderBook.owner();

  console.log("Exchange 地址:", exchange);
  console.log("合约所有者:", owner);

  // 测试基本功能
  console.log("\n测试基本功能...");
  try {
    const openOrderIds = await orderBook.getOpenOrderIds(deployer.address, '0x118eb3f0d7c0ae4056328851b3ee7510108aa230');
    console.log("✓ 基本功能测试通过");
    console.log("  初始订单数量:", openOrderIds.length);
  } catch (error) {
    console.log("⚠️ 功能测试有警告（可能正常）:", error.message);
  }

  // 保存部署信息到文件
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentInfo = {
    network: {
      name: (await ethers.provider.getNetwork()).name,
      chainId: (await ethers.provider.getNetwork()).chainId
    },
    timestamp: new Date().toISOString(),
    deploymentType: "non-upgradeable",
    contracts: {
      orderBook: orderBook.address,
    },
    config: {
      marketRegistry: MARKET_REGISTRY,
    },
    deployer: deployer.address,
    note: "不可升级部署 - 部署后无法升级合约逻辑"
  };

  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentsDir, `order-book-${networkName}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n部署信息已保存到:", deploymentFile);

  console.log("\n🎉 部署完成!");
  console.log("==========================================");
  console.log("OrderBook 地址:", orderBook.address);
  console.log("部署网络:", networkName);
  console.log("部署类型: 不可升级");
  console.log("==========================================");

  return {
    orderBook,
    deploymentFile,
    deploymentInfo
  };
}

// 错误处理
main().catch((error) => {
  console.error("部署失败:", error);
  process.exit(1);
});

export { main };

