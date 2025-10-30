// scripts/deploy-exchange-non-upgradeable.ts
import { ethers } from "hardhat";

async function main() {
  console.log("开始部署 Exchange 合约（不可升级模式）...");

  // 配置参数
  const MARKET_REGISTRY = "0xA642F92c7Cdc362e376487D0519d0752Ee6CD183";
  const ORDER_BOOK = "0x02f48aDD96235156ed24F84B19d9DF3a714b555d";
  const CLEARING_HOUSE_CONFIG = "0x2D0F2F30E47918be3D99dF88983251DA221063DE";

  console.log("使用参数:");
  console.log("MarketRegistry:", MARKET_REGISTRY);
  console.log("OrderBook:", ORDER_BOOK);
  console.log("ClearingHouseConfig:", CLEARING_HOUSE_CONFIG);

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", (await deployer.getBalance()).toString());

  // 验证依赖合约
  console.log("\n验证依赖合约...");
  
  try {
    // 验证 MarketRegistry
    const marketRegistry = await ethers.getContractAt("IMarketRegistry", MARKET_REGISTRY);
    const quoteToken = await marketRegistry.getQuoteToken();
    console.log("✓ MarketRegistry 验证成功");
    console.log("  Quote Token:", quoteToken);

    // 验证 OrderBook
    const orderBook = await ethers.getContractAt("IOrderBook", ORDER_BOOK);
    const exchangeFromOrderBook = await orderBook.getExchange();
    console.log("✓ OrderBook 验证成功");
    console.log("  Exchange 地址:", exchangeFromOrderBook);

    // 验证 ClearingHouseConfig
    const clearingHouseConfig = await ethers.getContractAt("IClearingHouseConfig", CLEARING_HOUSE_CONFIG);
    const mmRatio = await clearingHouseConfig.getMmRatio();
    console.log("✓ ClearingHouseConfig 验证成功");
    console.log("  MM Ratio:", mmRatio.toString());

  } catch (error) {
    console.error("✗ 依赖合约验证失败:", error);
    throw error;
  }

  // 部署 Exchange 合约（不可升级模式）
  console.log("\n正在部署 Exchange（不可升级模式）...");
  
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = await Exchange.deploy();
  
  await exchange.deployed();
  console.log("✓ Exchange 合约已部署到:", exchange.address);

  // 初始化合约
  console.log("初始化 Exchange 合约...");
  const initTx = await exchange.initialize(MARKET_REGISTRY, ORDER_BOOK, CLEARING_HOUSE_CONFIG);
  await initTx.wait();
  console.log("✓ 合约初始化成功");

  // 验证合约配置
  console.log("\n验证 Exchange 配置...");
  
  const orderBookFromContract = await exchange.getOrderBook();
  const accountBalance = await exchange.getAccountBalance();
  const clearingHouseConfigFromContract = await exchange.getClearingHouseConfig();
  const owner = await exchange.owner();

  console.log("OrderBook 地址:", orderBookFromContract);
  console.log("AccountBalance 地址:", accountBalance);
  console.log("ClearingHouseConfig 地址:", clearingHouseConfigFromContract);
  console.log("合约所有者:", owner);

  // 验证初始化是否成功
  if (orderBookFromContract === ORDER_BOOK && 
      clearingHouseConfigFromContract === CLEARING_HOUSE_CONFIG) {
    console.log("✓ 合约初始化验证成功");
  } else {
    console.log("✗ 合约初始化验证失败");
    throw new Error("合约初始化失败");
  }

  // 测试基本功能
  console.log("\n测试基本功能...");
  try {
    const maxTickCrossed = await exchange.getMaxTickCrossedWithinBlock(MARKET_REGISTRY);
    console.log("✓ 基本功能测试通过");
    console.log("  默认 MaxTickCrossed:", maxTickCrossed.toString());
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
      exchange: exchange.address,
    },
    config: {
      marketRegistry: MARKET_REGISTRY,
      orderBook: ORDER_BOOK,
      clearingHouseConfig: CLEARING_HOUSE_CONFIG,
    },
    deployer: deployer.address,
    note: "不可升级部署 - 部署后无法升级合约逻辑"
  };

  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentsDir, `exchange-non-upgradeable-${networkName}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n部署信息已保存到:", deploymentFile);

  console.log("\n🎉 部署完成!");
  console.log("==========================================");
  console.log("Exchange 地址:", exchange.address);
  console.log("部署网络:", networkName);
  console.log("部署类型: 不可升级");
  console.log("==========================================");

  return {
    exchange,
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

