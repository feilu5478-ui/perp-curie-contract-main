// scripts/deploy-collateral-manager-upgradeable.ts
import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("开始部署 CollateralManager 合约（可升级模式）...");

  // 配置参数
  const CLEARING_HOUSE_CONFIG = "0x2D0F2F30E47918be3D99dF88983251DA221063DE";
  const VAULT = "0xf12285fF19c58bD751dA4f604ebefc0C9Df00A10";

  // 初始化参数
  const MAX_COLLATERAL_TOKENS_PER_ACCOUNT = 10;
  const DEBT_NON_SETTLEMENT_TOKEN_VALUE_RATIO = 500000; // 50% in 6 decimals (0.5 * 1e6)
  const LIQUIDATION_RATIO = 800000; // 80% in 6 decimals (0.8 * 1e6)
  const MM_RATIO_BUFFER = 100000; // 10% in 6 decimals (0.1 * 1e6)
  const CL_INSURANCE_FUND_FEE_RATIO = 100000; // 10% in 6 decimals (0.1 * 1e6)
  const DEBT_THRESHOLD = ethers.utils.parseEther("1000"); // 1000 tokens
  const COLLATERAL_VALUE_DUST = ethers.utils.parseEther("1"); // 1 token

  console.log("使用参数:");
  console.log("ClearingHouseConfig:", CLEARING_HOUSE_CONFIG);
  console.log("Vault:", VAULT);
  console.log("MaxCollateralTokensPerAccount:", MAX_COLLATERAL_TOKENS_PER_ACCOUNT);
  console.log("DebtNonSettlementTokenValueRatio:", DEBT_NON_SETTLEMENT_TOKEN_VALUE_RATIO);
  console.log("LiquidationRatio:", LIQUIDATION_RATIO);
  console.log("MMRatioBuffer:", MM_RATIO_BUFFER);
  console.log("CLInsuranceFundFeeRatio:", CL_INSURANCE_FUND_FEE_RATIO);
  console.log("DebtThreshold:", DEBT_THRESHOLD.toString());
  console.log("CollateralValueDust:", COLLATERAL_VALUE_DUST.toString());

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
    console.log("✓ ClearingHouseConfig 验证成功");
    console.log("  MM Ratio:", mmRatio.toString());

    // 验证 Vault
    const vault = await ethers.getContractAt("IVault", VAULT);
    const settlementToken = await vault.getSettlementToken();
    console.log("✓ Vault 验证成功");
    console.log("  Settlement Token:", settlementToken);

  } catch (error) {
    console.error("✗ 依赖合约验证失败:", error);
    throw error;
  }

  try {
    // 部署 CollateralManager 合约（可升级模式）
    const CollateralManager = await ethers.getContractFactory("CollateralManager");
    
    console.log("\n正在部署 CollateralManager（可升级模式）...");
    
    const collateralManager = await upgrades.deployProxy(
      CollateralManager,
      [
        CLEARING_HOUSE_CONFIG,
        VAULT,
        MAX_COLLATERAL_TOKENS_PER_ACCOUNT,
        DEBT_NON_SETTLEMENT_TOKEN_VALUE_RATIO,
        LIQUIDATION_RATIO,
        MM_RATIO_BUFFER,
        CL_INSURANCE_FUND_FEE_RATIO,
        DEBT_THRESHOLD,
        COLLATERAL_VALUE_DUST
      ],
      { 
        initializer: "initialize",
        kind: "transparent",
        // 添加安全选项避免初始化问题
        // unsafeAllow: ["state-variable-immutable", "constructor", "delegatecall"],
      }
    );

    await collateralManager.deployed();
    console.log("✓ CollateralManager 已部署到:", collateralManager.address);

    // 验证合约信息
    console.log("\n验证 CollateralManager 配置...");
    
    const clearingHouseConfigFromContract = await collateralManager.getClearingHouseConfig();
    const vaultFromContract = await collateralManager.getVault();
    const maxCollateralTokensPerAccount = await collateralManager.getMaxCollateralTokensPerAccount();
    const mmRatioBuffer = await collateralManager.getMmRatioBuffer();
    const debtNonSettlementTokenValueRatio = await collateralManager.getDebtNonSettlementTokenValueRatio();
    const liquidationRatio = await collateralManager.getLiquidationRatio();
    const clInsuranceFundFeeRatio = await collateralManager.getCLInsuranceFundFeeRatio();
    const debtThreshold = await collateralManager.getDebtThreshold();
    const collateralValueDust = await collateralManager.getCollateralValueDust();

    console.log("ClearingHouseConfig 地址:", clearingHouseConfigFromContract);
    console.log("Vault 地址:", vaultFromContract);
    console.log("MaxCollateralTokensPerAccount:", maxCollateralTokensPerAccount.toString());
    console.log("MMRatioBuffer:", mmRatioBuffer.toString());
    console.log("DebtNonSettlementTokenValueRatio:", debtNonSettlementTokenValueRatio.toString());
    console.log("LiquidationRatio:", liquidationRatio.toString());
    console.log("CLInsuranceFundFeeRatio:", clInsuranceFundFeeRatio.toString());
    console.log("DebtThreshold:", debtThreshold.toString());
    console.log("CollateralValueDust:", collateralValueDust.toString());

    // 验证配置是否正确
    if (clearingHouseConfigFromContract === CLEARING_HOUSE_CONFIG && 
        vaultFromContract === VAULT) {
      console.log("✓ 合约配置验证成功");
    } else {
      console.log("✗ 合约配置验证失败");
      throw new Error("合约配置不匹配");
    }

    // 验证实现合约地址
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(collateralManager.address);
    console.log("实现合约地址:", implementationAddress);

    // 验证代理管理员地址
    const adminAddress = await upgrades.erc1967.getAdminAddress(collateralManager.address);
    console.log("代理管理员地址:", adminAddress);

    // 测试基本功能
    console.log("\n测试基本功能...");
    try {
      // 验证比率设置
      const validMmRatio = await collateralManager.requireValidCollateralMmRatio(MM_RATIO_BUFFER);
      console.log("✓ 基本功能测试通过");
      console.log("  验证 MM Ratio:", validMmRatio.toString());
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
        collateralManager: {
          proxy: collateralManager.address,
          implementation: implementationAddress,
          admin: adminAddress,
        },
        dependencies: {
          clearingHouseConfig: CLEARING_HOUSE_CONFIG,
          vault: VAULT,
        }
      },
      config: {
        clearingHouseConfig: CLEARING_HOUSE_CONFIG,
        vault: VAULT,
        maxCollateralTokensPerAccount: MAX_COLLATERAL_TOKENS_PER_ACCOUNT,
        debtNonSettlementTokenValueRatio: DEBT_NON_SETTLEMENT_TOKEN_VALUE_RATIO,
        liquidationRatio: LIQUIDATION_RATIO,
        mmRatioBuffer: MM_RATIO_BUFFER,
        clInsuranceFundFeeRatio: CL_INSURANCE_FUND_FEE_RATIO,
        debtThreshold: DEBT_THRESHOLD.toString(),
        collateralValueDust: COLLATERAL_VALUE_DUST.toString(),
      },
      deployer: deployer.address,
      note: "可升级部署 - 使用代理模式"
    };

    const networkName = (await ethers.provider.getNetwork()).name;
    const deploymentFile = path.join(deploymentsDir, `collateral-manager-upgradeable-${networkName}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n部署信息已保存到:", deploymentFile);

    console.log("\n🎉 部署完成!");
    console.log("==========================================");
    console.log("CollateralManager 代理地址:", collateralManager.address);
    console.log("实现合约地址:", implementationAddress);
    console.log("代理管理员地址:", adminAddress);
    console.log("部署网络:", networkName);
    console.log("部署类型: 可升级");
    console.log("==========================================");

    return {
      collateralManager,
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
      console.log("运行: npx hardhat run scripts/deploy-collateral-manager-non-upgradeable.ts --network localhost");
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

