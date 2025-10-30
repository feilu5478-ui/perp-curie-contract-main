// scripts/deploy-vault-upgradeable.ts
import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("开始部署 Vault 合约（可升级模式）...");

  // 配置参数
  const INSURANCE_FUND = "0x0adB0e5c9C2aFaE2D8DEf8C32EF3C51383e15E26";
  const CLEARING_HOUSE_CONFIG = "0x2D0F2F30E47918be3D99dF88983251DA221063DE";
  const ACCOUNT_BALANCE = "0xC6A89EFcC84a32376E9350D8467A48234657fb9a";
  const EXCHANGE = "0x163F449C0F4537fB0a99C8d28Fb5d99B6B7F09B2";

  console.log("使用参数:");
  console.log("InsuranceFund:", INSURANCE_FUND);
  console.log("ClearingHouseConfig:", CLEARING_HOUSE_CONFIG);
  console.log("AccountBalance:", ACCOUNT_BALANCE);
  console.log("Exchange:", EXCHANGE);

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", (await deployer.getBalance()).toString());

  // 验证依赖合约
  console.log("\n验证依赖合约...");
  
  try {
    // 验证 InsuranceFund
    const insuranceFund = await ethers.getContractAt("IInsuranceFund", INSURANCE_FUND);
    const settlementToken = await insuranceFund.getToken();
    console.log("✓ InsuranceFund 验证成功");
    console.log("  Settlement Token:", settlementToken);

    // 验证 ClearingHouseConfig
    const clearingHouseConfig = await ethers.getContractAt("IClearingHouseConfig", CLEARING_HOUSE_CONFIG);
    const mmRatio = await clearingHouseConfig.getMmRatio();
    const twapInterval = await clearingHouseConfig.getTwapInterval();
    console.log("✓ ClearingHouseConfig 验证成功");
    console.log("  MM Ratio:", mmRatio.toString());
    console.log("  TWAP Interval:", twapInterval.toString());

    // 验证 AccountBalance
    const accountBalance = await ethers.getContractAt("IAccountBalance", ACCOUNT_BALANCE);
    const vaultFromAccountBalance = await accountBalance.getVault();
    console.log("✓ AccountBalance 验证成功");
    console.log("  Vault 地址:", vaultFromAccountBalance);

    // 验证 Exchange
    const exchange = await ethers.getContractAt("IExchange", EXCHANGE);
    const accountBalanceFromExchange = await exchange.getAccountBalance();
    console.log("✓ Exchange 验证成功");
    console.log("  AccountBalance 地址:", accountBalanceFromExchange);

  } catch (error) {
    console.error("✗ 依赖合约验证失败:", error);
    throw error;
  }

  try {
    // 部署 Vault 合约（可升级模式）
    const Vault = await ethers.getContractFactory("Vault");
    
    console.log("\n正在部署 Vault（可升级模式）...");
    
    const vault = await upgrades.deployProxy(
      Vault,
      [INSURANCE_FUND, CLEARING_HOUSE_CONFIG, ACCOUNT_BALANCE, EXCHANGE],
      { 
        initializer: "initialize",
        kind: "transparent",
      }
    );

    await vault.deployed();
    console.log("✓ Vault 已部署到:", vault.address);

    // 验证合约信息
    console.log("\n验证 Vault 配置...");
    
    const settlementToken = await vault.getSettlementToken();
    const insuranceFundFromContract = await vault.getInsuranceFund();
    const clearingHouseConfigFromContract = await vault.getClearingHouseConfig();
    const accountBalanceFromContract = await vault.getAccountBalance();
    const exchangeFromContract = await vault.getExchange();

    console.log("Settlement Token:", settlementToken);
    console.log("InsuranceFund 地址:", insuranceFundFromContract);
    console.log("ClearingHouseConfig 地址:", clearingHouseConfigFromContract);
    console.log("AccountBalance 地址:", accountBalanceFromContract);
    console.log("Exchange 地址:", exchangeFromContract);

    // 验证配置是否正确
    if (insuranceFundFromContract === INSURANCE_FUND && 
        clearingHouseConfigFromContract === CLEARING_HOUSE_CONFIG &&
        accountBalanceFromContract === ACCOUNT_BALANCE &&
        exchangeFromContract === EXCHANGE) {
      console.log("✓ 合约配置验证成功");
    } else {
      console.log("✗ 合约配置验证失败");
      throw new Error("合约配置不匹配");
    }

    // 验证实现合约地址
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(vault.address);
    console.log("实现合约地址:", implementationAddress);

    // 验证代理管理员地址
    const adminAddress = await upgrades.erc1967.getAdminAddress(vault.address);
    console.log("代理管理员地址:", adminAddress);

    // 测试基本功能
    console.log("\n测试基本功能...");
    try {
      const decimals = await vault.decimals();
      const totalDebt = await vault.getTotalDebt();
      console.log("✓ 基本功能测试通过");
      console.log("  代币精度:", decimals);
      console.log("  总债务:", totalDebt.toString());
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
        vault: {
          proxy: vault.address,
          implementation: implementationAddress,
          admin: adminAddress,
        },
        dependencies: {
          insuranceFund: INSURANCE_FUND,
          clearingHouseConfig: CLEARING_HOUSE_CONFIG,
          accountBalance: ACCOUNT_BALANCE,
          exchange: EXCHANGE,
        }
      },
      config: {
        insuranceFund: INSURANCE_FUND,
        clearingHouseConfig: CLEARING_HOUSE_CONFIG,
        accountBalance: ACCOUNT_BALANCE,
        exchange: EXCHANGE,
      },
      deployer: deployer.address,
      note: "可升级部署 - 使用代理模式"
    };

    const networkName = (await ethers.provider.getNetwork()).name;
    const deploymentFile = path.join(deploymentsDir, `vault-upgradeable-${networkName}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n部署信息已保存到:", deploymentFile);

    console.log("\n🎉 部署完成!");
    console.log("==========================================");
    console.log("Vault 代理地址:", vault.address);
    console.log("实现合约地址:", implementationAddress);
    console.log("代理管理员地址:", adminAddress);
    console.log("部署网络:", networkName);
    console.log("部署类型: 可升级");
    console.log("==========================================");

    return {
      vault,
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
      console.log("运行: npx hardhat run scripts/deploy-vault-non-upgradeable.ts --network localhost");
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

