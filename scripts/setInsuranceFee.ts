// scripts/checkClearingHouseConfig.ts
import { ethers } from "hardhat";

async function checkClearingHouseConfig() {
  console.log("=== 设置保险基金费率 ===");

  const marketRegistryAddress = "0xD0be37F945DdaEBf1Af60F0dE5C78e3A42f1F3cf"; // 需要替换为实际地址

  const marketRegistry = await ethers.getContractFactory("MarketRegistry");
  const market = marketRegistry.attach(marketRegistryAddress);

  try {
    const baseToken = "0x23383BA49A2D72fD3b617751A0efD3e7Df58Bf06";
    console.log("1. 设置保险金库费率:");
    const feeRatio = await market.setInsuranceFundFeeRatio(baseToken, 100000);
    console.log("保险基金费率已设置为10%", feeRatio);
  } catch (error) {
    console.log("设置失败:", error.message);
  }
}

checkClearingHouseConfig().catch(console.error);