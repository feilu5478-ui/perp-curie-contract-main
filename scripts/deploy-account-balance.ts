// scripts/deploy-account-balance.ts
import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("开始部署 AccountBalance 合约（可升级模式）...");

  // 配置参数
  const CLEARING_HOUSE_CONFIG = "0x2D0F2F30E47918be3D99dF88983251DA221063DE";
  const ORDER_BOOK = "0x02f48aDD96235156ed24F84B19d9DF3a714b555d";

  console.log("使用参数:");
  console.log("ClearingHouseConfig:", CLEARING_HOUSE_CONFIG);
  console.log("OrderBook:", ORDER_BOOK);

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", (await deployer.getBalance()).toString());

  // 验证依赖合约
  console.log("\n验证依赖合约...");
  
  try {
    // 验证 ClearingHouseConfig
    const clearingHouseConfig = await ethers.getContractAt("IClearingHouseConfig", CLEARING_HOUSE_CONFIG);
    const mmRatio = await clearingHouseConfig.getMmRatio();
    const maxMarketsPerAccount = await clearingHouseConfig.getMaxMarketsPerAccount();
    console.log("✓ ClearingHouseConfig 验证成功");
    console.log("  MM Ratio:", mmRatio.toString());
    console.log("  Max Markets Per Account:", maxMarketsPerAccount.toString());

    // 验证 OrderBook
    const orderBook = await ethers.getContractAt("IOrderBook", ORDER_BOOK);
    const exchange = await orderBook.getExchange();
    console.log("✓ OrderBook 验证成功");
    console.log("  Exchange 地址:", exchange);

  } catch (error) {
    console.error("✗ 依赖合约验证失败:", error);
    throw error;
  }

  try {
    // 部署 AccountBalance 合约
    const AccountBalance = await ethers.getContractFactory("AccountBalance");
    
    console.log("\n正在部署 AccountBalance...");
    
    const accountBalance = await upgrades.deployProxy(
      AccountBalance,
      [CLEARING_HOUSE_CONFIG, ORDER_BOOK],
      { 
        initializer: "initialize",
        kind: "transparent"
      }
    );

    await accountBalance.deployed();
    console.log("✓ AccountBalance 已部署到:", accountBalance.address);

    // 验证合约信息
    console.log("\n验证 AccountBalance 配置...");
    
    const clearingHouseConfigFromContract = await accountBalance.getClearingHouseConfig();
    const orderBookFromContract = await accountBalance.getOrderBook();
    const vault = await accountBalance.getVault();
    const owner = await accountBalance.owner();

    console.log("ClearingHouseConfig 地址:", clearingHouseConfigFromContract);
    console.log("OrderBook 地址:", orderBookFromContract);
    console.log("Vault 地址:", vault);
    console.log("合约所有者:", owner);

    // 验证配置是否正确
    if (clearingHouseConfigFromContract === CLEARING_HOUSE_CONFIG && 
        orderBookFromContract === ORDER_BOOK) {
      console.log("✓ 合约配置验证成功");
    } else {
      console.log("✗ 合约配置验证失败");
      throw new Error("合约配置不匹配");
    }

    // 验证实现合约地址
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(accountBalance.address);
    console.log("实现合约地址:", implementationAddress);

    // 验证代理管理员地址
    const adminAddress = await upgrades.erc1967.getAdminAddress(accountBalance.address);
    console.log("代理管理员地址:", adminAddress);

    // 测试基本功能
    console.log("\n测试基本功能...");
    try {
      const baseTokens = await accountBalance.getBaseTokens(deployer.address);
      console.log("✓ 基本功能测试通过");
      console.log("  初始 BaseTokens 数量:", baseTokens.length);
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
        accountBalance: {
          proxy: accountBalance.address,
          implementation: implementationAddress,
          admin: adminAddress,
        },
        dependencies: {
          clearingHouseConfig: CLEARING_HOUSE_CONFIG,
          orderBook: ORDER_BOOK,
        }
      },
      config: {
        clearingHouseConfig: CLEARING_HOUSE_CONFIG,
        orderBook: ORDER_BOOK,
      },
      deployer: deployer.address,
      note: "可升级部署 - 使用代理模式"
    };

    const networkName = (await ethers.provider.getNetwork()).name;
    const deploymentFile = path.join(deploymentsDir, `account-balance-${networkName}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n部署信息已保存到:", deploymentFile);

    console.log("\n🎉 部署完成!");
    console.log("==========================================");
    console.log("AccountBalance 代理地址:", accountBalance.address);
    console.log("实现合约地址:", implementationAddress);
    console.log("代理管理员地址:", adminAddress);
    console.log("部署网络:", networkName);
    console.log("部署类型: 可升级");
    console.log("==========================================");

    return {
      accountBalance,
      implementationAddress,
      adminAddress,
      deploymentFile,
      deploymentInfo
    };

  } catch (error) {
    console.error("部署失败:", error);
    
    // 如果是初始化问题，提供解决方案
    if (error.message.includes("upgrade safe") || error.message.includes("initializer")) {
      console.log("\n=== 解决方案 ===");
      console.log("1. 检查合约初始化函数是否重复调用父合约初始化");
      console.log("2. 尝试使用不可升级部署方式");
      console.log("3. 检查依赖合约是否正确部署");
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

