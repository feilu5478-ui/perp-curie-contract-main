// scripts/checkClearingHouseConfig.ts
import { ethers } from "hardhat";

async function checkClearingHouseConfig() {
  console.log("=== 检查 ClearingHouseConfig 设置 ===");

  const marketRegistryAddress = "0xD0be37F945DdaEBf1Af60F0dE5C78e3A42f1F3cf"; // 需要替换为实际地址

  const marketRegistry = await ethers.getContractFactory("MarketRegistry");
  const config = marketRegistry.attach(marketRegistryAddress);

  try {
    const baseToken = "0x23383BA49A2D72fD3b617751A0efD3e7Df58Bf06";
    console.log("1. 保证金参数:");
    const imRatio = await config.getFeeRatio(baseToken);
    const mmRatio = await config.getInsuranceFundFeeRatio(baseToken);
    const mm = await config.getMarketMaxPriceSpreadRatio(baseToken);
    
    console.log(`   交易手续费率: ${imRatio / 10000}%`);
    console.log(`   保险基金费率: ${mmRatio / 10000}%`);
    console.log(`   最大价格差率: ${mm / 10000}%`);
  } catch (error) {
    console.log("检查配置失败:", error.message);
  }
}

checkClearingHouseConfig().catch(console.error);