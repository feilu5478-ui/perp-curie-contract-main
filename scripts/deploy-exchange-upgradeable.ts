// scripts/deploy-exchange-upgradeable.ts
import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("开始部署 Exchange 合约（可升级模式）...");

  // 配置参数
  const MARKET_REGISTRY = "0x09EDAC3c1a7547c865ecDac2E8B9C63d00b8b6B8";
  const ORDER_BOOK = "0xB913E25d56C2ab388862B06274B71179C98b45E9";
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
    const uniswapV3Factory = await marketRegistry.getUniswapV3Factory();
    console.log("✓ MarketRegistry 验证成功");
    console.log("  Quote Token:", quoteToken);
    console.log("  UniswapV3 Factory:", uniswapV3Factory);

    // 验证 OrderBook
    const orderBook = await ethers.getContractAt("IOrderBook", ORDER_BOOK);
    const exchangeFromOrderBook = await orderBook.getExchange();
    console.log("✓ OrderBook 验证成功");
    console.log("  Exchange 地址:", exchangeFromOrderBook);

    // 验证 ClearingHouseConfig
    const clearingHouseConfig = await ethers.getContractAt("IClearingHouseConfig", CLEARING_HOUSE_CONFIG);
    const mmRatio = await clearingHouseConfig.getMmRatio();
    const twapInterval = await clearingHouseConfig.getTwapInterval();
    console.log("✓ ClearingHouseConfig 验证成功");
    console.log("  MM Ratio:", mmRatio.toString());
    console.log("  TWAP Interval:", twapInterval.toString());

  } catch (error) {
    console.error("✗ 依赖合约验证失败:", error);
    throw error;
  }

  try {
    // 部署 Exchange 合约（可升级模式）
    const Exchange = await ethers.getContractFactory("Exchange");
    
    console.log("\n正在部署 Exchange（可升级模式）...");
    
    const exchange = await upgrades.deployProxy(
      Exchange,
      [MARKET_REGISTRY, ORDER_BOOK, CLEARING_HOUSE_CONFIG],
      { 
        initializer: "initialize",
        kind: "transparent",
      }
    );

    await exchange.deployed();
    console.log("✓ Exchange 已部署到:", exchange.address);

    // 验证合约信息
    console.log("\n验证 Exchange 配置...");
    
    const orderBookFromContract = await exchange.getOrderBook();
    const accountBalance = await exchange.getAccountBalance();
    const clearingHouseConfigFromContract = await exchange.getClearingHouseConfig();

    console.log("OrderBook 地址:", orderBookFromContract);
    console.log("AccountBalance 地址:", accountBalance);
    console.log("ClearingHouseConfig 地址:", clearingHouseConfigFromContract);

    // 验证配置是否正确
    if (orderBookFromContract === ORDER_BOOK && 
        clearingHouseConfigFromContract === CLEARING_HOUSE_CONFIG) {
      console.log("✓ 合约配置验证成功");
    } else {
      console.log("✗ 合约配置验证失败");
      throw new Error("合约配置不匹配");
    }

    // 验证实现合约地址
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(exchange.address);
    console.log("实现合约地址:", implementationAddress);

    // 验证代理管理员地址
    const adminAddress = await upgrades.erc1967.getAdminAddress(exchange.address);
    console.log("代理管理员地址:", adminAddress);

    // 测试基本功能
    console.log("\n测试基本功能...");
    try {
      // 测试获取最大 tick 跨度的默认值
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
      deploymentType: "upgradeable",
      contracts: {
        exchange: {
          proxy: exchange.address,
          implementation: implementationAddress,
          admin: adminAddress,
        },
        dependencies: {
          marketRegistry: MARKET_REGISTRY,
          orderBook: ORDER_BOOK,
          clearingHouseConfig: CLEARING_HOUSE_CONFIG,
        }
      },
      config: {
        marketRegistry: MARKET_REGISTRY,
        orderBook: ORDER_BOOK,
        clearingHouseConfig: CLEARING_HOUSE_CONFIG,
      },
      deployer: deployer.address,
      note: "可升级部署 - 使用代理模式"
    };

    const networkName = (await ethers.provider.getNetwork()).name;
    const deploymentFile = path.join(deploymentsDir, `exchange-upgradeable-${networkName}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n部署信息已保存到:", deploymentFile);

    console.log("\n🎉 部署完成!");
    console.log("==========================================");
    console.log("Exchange 代理地址:", exchange.address);
    console.log("实现合约地址:", implementationAddress);
    console.log("代理管理员地址:", adminAddress);
    console.log("部署网络:", networkName);
    console.log("部署类型: 可升级");
    console.log("==========================================");

    return {
      exchange,
      implementationAddress,
      adminAddress,
      deploymentFile,
      deploymentInfo
    };

  } catch (error) {
    console.error("部署失败:", error);
    
    // 如果是初始化问题，建议使用不可升级模式
    if (error.message.includes("upgrade safe") || error.message.includes("initializer")) {
      console.log("\n=== 建议 ===");
      console.log("检测到初始化问题，建议使用不可升级模式部署");
      console.log("运行: npx hardhat run scripts/deploy-exchange-non-upgradeable.ts --network localhost");
    }
    throw error;
  }
}

// 错误处理
main().catch((error) => {
  console.error("部署失败:", error);
  process.exit(1);
});

export { main };

