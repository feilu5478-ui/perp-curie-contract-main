// 检查合约配置脚本
import { ethers } from "hardhat";

async function checkContractConfig() {
  console.log("=== 检查合约配置 ===");

  const [signer] = await ethers.getSigners();
  
  // 合约地址
  const clearingHouseAddress = "0x2F925bF3C24dd2677D8064938d3FC8317E1636a4"; // 你的 ClearingHouse 合约地址
  const marketRegistryAddress = "0x09EDAC3c1a7547c865ecDac2E8B9C63d00b8b6B8";
  const exchangeAddress = "0x00c8f23c3e497FD3Ed5af36471cc29dD96028883"; // Exchange 合约地址
  const orderBookAddress = "0xB913E25d56C2ab388862B06274B71179C98b45E9"; // OrderBook 合约地址

  // 检查 MarketRegistry 的 ClearingHouse 配置
  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);
  
  const marketRegistryCH = await marketRegistry.getClearingHouse();
  console.log("MarketRegistry ClearingHouse:", marketRegistryCH);
  
  // 检查 Exchange 的 ClearingHouse 配置
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = Exchange.attach(exchangeAddress);
  
  const exchangeCH = await exchange.getClearingHouse();
  console.log("Exchange ClearingHouse:", exchangeCH);

  // 如果配置不正确，需要设置正确的 ClearingHouse 地址
//   if (marketRegistryCH !== clearingHouseAddress) {
//     console.log("设置 MarketRegistry 的 ClearingHouse...");
//     const tx = await marketRegistry.setClearingHouse(clearingHouseAddress);
//     await tx.wait();
//     console.log("✅ MarketRegistry ClearingHouse 设置完成");
//   }

//   if (exchangeCH !== clearingHouseAddress) {
//     console.log("设置 Exchange 的 ClearingHouse...");
//     const tx = await exchange.setClearingHouse(clearingHouseAddress);
//     await tx.wait();
//     console.log("✅ Exchange ClearingHouse 设置完成");
//   }
}

checkContractConfig().catch(console.error);