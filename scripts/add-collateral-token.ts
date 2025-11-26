// scripts/add-collateral-token.ts
import { ethers } from "hardhat";

async function main() {
  // 配置参数 - 需要替换为实际地址
  const COLLATERAL_MANAGER_ADDRESS = "YOUR_COLLATERAL_MANAGER_ADDRESS";
  const TOKEN_ADDRESS = "YOUR_TOKEN_ADDRESS";
  const PRICE_FEED_ADDRESS = "YOUR_PRICE_FEED_ADDRESS";
  
  // 抵押品配置
  const COLLATERAL_RATIO = 800000; // 80% in 6 decimals (0.8 * 1e6)
  const DISCOUNT_RATIO = 100000; // 10% in 6 decimals (0.1 * 1e6)
  const DEPOSIT_CAP = ethers.utils.parseEther("1000000"); // 1,000,000 tokens

  console.log("添加抵押品代币...");
  console.log("CollateralManager 地址:", COLLATERAL_MANAGER_ADDRESS);
  console.log("代币地址:", TOKEN_ADDRESS);
  console.log("价格预言机地址:", PRICE_FEED_ADDRESS);
  console.log("抵押品比率:", COLLATERAL_RATIO);
  console.log("折扣比率:", DISCOUNT_RATIO);
  console.log("存款上限:", DEPOSIT_CAP.toString());

  const [deployer] = await ethers.getSigners();
  console.log("执行者地址:", deployer.address);

  const collateralManager = await ethers.getContractAt("CollateralManager", COLLATERAL_MANAGER_ADDRESS);

  // 检查当前所有者
  const owner = await collateralManager.owner();
  console.log("CollateralManager 所有者:", owner);

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("⚠️  警告: 当前账户不是合约所有者，可能无法执行设置");
    return;
  }

  // 检查代币是否已经是抵押品
  const isCollateral = await collateralManager.isCollateral(TOKEN_ADDRESS);
  if (isCollateral) {
    console.log("✓ 代币已经是抵押品，无需重复添加");
    return;
  }

  // 添加抵押品代币
  console.log("\n正在添加抵押品代币...");
  const tx = await collateralManager.addCollateral(TOKEN_ADDRESS, {
    priceFeed: PRICE_FEED_ADDRESS,
    collateralRatio: COLLATERAL_RATIO,
    discountRatio: DISCOUNT_RATIO,
    depositCap: DEPOSIT_CAP
  });
  const receipt = await tx.wait();

  console.log("✓ 抵押品代币添加成功");
  console.log("交易哈希:", tx.hash);
  console.log("Gas 消耗:", receipt.gasUsed.toString());

  // 验证添加
  const collateralConfig = await collateralManager.getCollateralConfig(TOKEN_ADDRESS);
  console.log("抵押品配置:");
  console.log("  价格预言机:", collateralConfig.priceFeed);
  console.log("  抵押品比率:", collateralConfig.collateralRatio.toString());
  console.log("  折扣比率:", collateralConfig.discountRatio.toString());
  console.log("  存款上限:", collateralConfig.depositCap.toString());

  if (collateralConfig.priceFeed === PRICE_FEED_ADDRESS) {
    console.log("✓ 验证成功: 抵押品代币已正确添加");
  } else {
    console.log("✗ 验证失败: 抵押品代币添加不正确");
  }
}

main().catch(console.error);