// scripts/checkTokenStatus.ts
import { ethers } from "hardhat";

async function main() {
  console.log("=== 检查代币状态 ===");

  const [signer] = await ethers.getSigners();
  
  // 合约地址
  const vaultAddress = "0x2EE8E5374a8A89f4B3B98018703F6d131B1de013";
  const quoteTokenAddress = "0x41cffBcE944DDcb71769Dec7C7628a4Cf88Bad9F";
  const baseTokenAddress = "0x118Eb3F0d7c0aE4056328851B3eE7510108AA230";

  const Vault = await ethers.getContractFactory("Vault");
  const vault = Vault.attach(vaultAddress);

  // 1. 检查结算代币
  console.log("1. 检查结算代币...");
  await checkSettlementToken(vault, quoteTokenAddress, baseTokenAddress);

  // 2. 检查抵押代币
  console.log("2. 检查抵押代币...");
  await checkCollateralTokens(vault, signer.address);

  // 3. 检查特定代币状态
  console.log("3. 检查特定代币状态...");
  await checkSpecificTokenStatus(vault, quoteTokenAddress, "QuoteToken");
  await checkSpecificTokenStatus(vault, baseTokenAddress, "BaseToken");
}

async function checkSettlementToken(vault: any, quoteTokenAddress: string, baseTokenAddress: string) {
  try {
    // 获取 Vault 的结算代币地址
    const settlementToken = await vault.getSettlementToken();
    console.log("Vault 结算代币地址:", settlementToken);
    console.log("我们的 QuoteToken 地址:", quoteTokenAddress);
    console.log("是否匹配:", settlementToken.toLowerCase() === quoteTokenAddress.toLowerCase());

    // 检查代币信息
    const QuoteToken = await ethers.getContractFactory("QuoteToken");
    const quoteToken = QuoteToken.attach(quoteTokenAddress);
    
    const name = await quoteToken.name();
    const symbol = await quoteToken.symbol();
    const decimals = await quoteToken.decimals();
    
    console.log("QuoteToken 信息:");
    console.log("- 名称:", name);
    console.log("- 符号:", symbol);
    console.log("- 小数位:", decimals);

    // 检查 BaseToken 是否被误认为是结算代币
    console.log("BaseToken 地址:", baseTokenAddress);
    console.log("BaseToken 是否是结算代币:", baseTokenAddress.toLowerCase() === settlementToken.toLowerCase());

  } catch (error) {
    console.log("检查结算代币时出错:", error.message);
  }
}

async function checkCollateralTokens(vault: any, userAddress: string) {
  try {
    // 获取用户的抵押代币列表
    const collateralTokens = await vault.getCollateralTokens(userAddress);
    console.log("用户的抵押代币列表:", collateralTokens);

    // 获取抵押管理器地址
    const collateralManagerAddress = await vault.getCollateralManager();
    console.log("抵押管理器地址:", collateralManagerAddress);

    if (collateralManagerAddress !== ethers.constants.AddressZero) {
      const CollateralManager = await ethers.getContractFactory("CollateralManager");
      const collateralManager = CollateralManager.attach(collateralManagerAddress);

      // 检查支持的抵押代币
      const maxCollateralTokens = await collateralManager.getMaxCollateralTokensPerAccount();
      console.log("最大抵押代币数量:", maxCollateralTokens.toString());

    } else {
      console.log("⚠️  未设置抵押管理器");
    }

  } catch (error) {
    console.log("检查抵押代币时出错:", error.message);
  }
}

async function checkSpecificTokenStatus(vault: any, tokenAddress: string, tokenName: string) {
  console.log(`\n检查 ${tokenName} (${tokenAddress}) 状态:`);

  try {
    // 检查是否为结算代币
    const settlementToken = await vault.getSettlementToken();
    const isSettlementToken = settlementToken.toLowerCase() === tokenAddress.toLowerCase();
    console.log("- 是否为结算代币:", isSettlementToken);

    // 检查是否为抵押代币
    let isCollateral = false;
    const collateralManagerAddress = await vault.getCollateralManager();
    
    if (collateralManagerAddress !== ethers.constants.AddressZero) {
      const CollateralManager = await ethers.getContractFactory("CollateralManager");
      const collateralManager = CollateralManager.attach(collateralManagerAddress);
      
      try {
        isCollateral = await collateralManager.isCollateral(tokenAddress);
        console.log("- 是否为抵押代币:", isCollateral);

        if (isCollateral) {
          const collateralConfig = await collateralManager.getCollateralConfig(tokenAddress);
          console.log("- 抵押比率:", collateralConfig.collateralRatio.toString());
          console.log("- 折扣比率:", collateralConfig.discountRatio.toString());
          console.log("- 存款上限:", collateralConfig.depositCap.toString());
        }
      } catch (error) {
        console.log("- 检查抵押状态失败，可能不是抵押代币");
      }
    }

    // 总结代币状态
    if (isSettlementToken) {
      console.log(`✅ ${tokenName} 是结算代币`);
    } else if (isCollateral) {
      console.log(`✅ ${tokenName} 是抵押代币`);
    } else {
      console.log(`❌ ${tokenName} 既不是结算代币也不是抵押代币`);
    }

  } catch (error) {
    console.log(`检查 ${tokenName} 状态时出错:`, error.message);
  }
}

main().catch(console.error);