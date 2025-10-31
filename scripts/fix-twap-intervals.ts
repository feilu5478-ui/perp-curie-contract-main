// fix-twap-intervals.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("=== 调整 TWAP 间隔以解决 'OLD' 错误 ===");

  const clearingHouseConfigAddress = "0x9199f6848b189024807987Ee6Ab45EC905856B52";
  
  const ClearingHouseConfig = await ethers.getContractFactory("ClearingHouseConfig");
  const clearingHouseConfig = ClearingHouseConfig.attach(clearingHouseConfigAddress);

  console.log("当前 TWAP 间隔:", (await clearingHouseConfig.getTwapInterval()).toString());
  
  // 临时设置为较小的值用于测试
  const tempTwapInterval = 0;
  
//   await clearingHouseConfig.setTwapInterval(tempTwapInterval);
//   console.log("TWAP 间隔已设置为:", tempTwapInterval, "秒");
  const tTwap = await clearingHouseConfig.getTwapInterval();
  console.log("twap间隔：",tTwap);
  // 同时调整标记价格配置
  
  await clearingHouseConfig.setMarkPriceMarketTwapInterval(tempTwapInterval, {gasLimit: 1000000});
  await clearingHouseConfig.setMarkPricePremiumInterval(tempTwapInterval, {gasLimit: 1000000});
  const [currentMarketTwap, currentPremiumTwap] = await clearingHouseConfig.getMarkPriceConfig();
  console.log("当前标记价格配置 - 市场TWAP:", currentMarketTwap.toString(), "溢价间隔:", currentPremiumTwap.toString());
  
  console.log("标记价格配置已更新");
  console.log("✅ TWAP 间隔调整完成，现在可以添加流动性");
}

main().catch(console.error);