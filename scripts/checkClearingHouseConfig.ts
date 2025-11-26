// scripts/checkClearingHouseConfig.ts
import { ethers } from "hardhat";

async function checkClearingHouseConfig() {
  console.log("=== 检查 ClearingHouseConfig 设置 ===");

  const clearingHouseConfigAddress = "0x9199f6848b189024807987Ee6Ab45EC905856B52"; // 需要替换为实际地址

  const ClearingHouseConfig = await ethers.getContractFactory("ClearingHouseConfig");
  const config = ClearingHouseConfig.attach(clearingHouseConfigAddress);

  try {
    console.log("1. 保证金参数:");
    const imRatio = await config.getImRatio();
    const mmRatio = await config.getMmRatio();
    const liquidationPenaltyRatio = await config.getLiquidationPenaltyRatio();
    
    console.log(`   初始保证金率: ${imRatio / 10000}%`);
    console.log(`   维持保证金率: ${mmRatio / 10000}%`);
    console.log(`   清算惩罚率: ${liquidationPenaltyRatio / 10000}%`);

    console.log("\n2. 价格参数:");
    const twapInterval = await config.getTwapInterval();
    const [marketTwapInterval, premiumInterval] = await config.getMarkPriceConfig();
    
    console.log(`   TWAP 间隔: ${twapInterval} 秒`);
    console.log(`   市场 TWAP 间隔: ${marketTwapInterval} 秒`);
    console.log(`   溢价间隔: ${premiumInterval} 秒`);

    console.log("\n3. 其他参数:");
    const maxMarketsPerAccount = await config.getMaxMarketsPerAccount();
    const maxFundingRate = await config.getMaxFundingRate();
    const settlementTokenBalanceCap = await config.getSettlementTokenBalanceCap();
    
    console.log(`   每账户最大市场数: ${maxMarketsPerAccount}`);
    console.log(`   最大资金费率: ${maxFundingRate / 10000}%`);
    console.log(`   结算代币余额上限: ${settlementTokenBalanceCap.toString()}`);

    // 检查参数是否合理
    console.log("\n4. 参数合理性检查:");
    
    if (imRatio > 0.2e6) {
      console.log("   ⚠️  初始保证金率可能过高");
    }
    
    if (twapInterval < 300) { // 5分钟
      console.log("   ⚠️  TWAP 间隔可能过短");
    }
    
    if (maxFundingRate > 0.5e6) {
      console.log("   ⚠️  最大资金费率可能过高");
    }

  } catch (error) {
    console.log("检查配置失败:", error.message);
  }
}

checkClearingHouseConfig().catch(console.error);