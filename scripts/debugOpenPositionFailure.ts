// scripts/debugOpenPositionFailure.ts
import { ethers } from "hardhat";

async function debugOpenPositionFailure() {
  console.log("=== 诊断开仓失败问题 ===");

  const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
  const baseTokenAddress = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";

  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(clearingHouseAddress);

  // 1. 检查 ClearingHouse 的依赖合约配置
  console.log("1. 检查 ClearingHouse 依赖合约配置...");
  
  const exchangeAddress = await clearingHouse.getExchange();
  const orderBookAddress = await clearingHouse.getOrderBook();
  const accountBalanceAddress = await clearingHouse.getAccountBalance();
  const vaultAddress = await clearingHouse.getVault();
  const clearingHouseConfigAddress = await clearingHouse.getClearingHouseConfig();
  
  console.log("Exchange 地址:", exchangeAddress);
  console.log("OrderBook 地址:", orderBookAddress);
  console.log("AccountBalance 地址:", accountBalanceAddress);
  console.log("Vault 地址:", vaultAddress);
  console.log("ClearingHouseConfig 地址:", clearingHouseConfigAddress);

  // 2. 检查 Exchange 合约的 ClearingHouse 配置
  console.log("\n2. 检查 Exchange 合约配置...");
  
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = Exchange.attach(exchangeAddress);
  
  try {
    const exchangeClearingHouse = await exchange.getClearingHouse();
    console.log("Exchange 中的 ClearingHouse 地址:", exchangeClearingHouse);
    console.log("是否正确:", exchangeClearingHouse.toLowerCase() === clearingHouseAddress.toLowerCase() ? "✅" : "❌");
    
    if (exchangeClearingHouse.toLowerCase() !== clearingHouseAddress.toLowerCase()) {
      console.log("❌ Exchange 中的 ClearingHouse 地址不匹配!");
    }
  } catch (error) {
    console.log("检查 Exchange 失败:", error.message);
  }

  // 3. 检查 OrderBook 合约的 ClearingHouse 配置
  console.log("\n3. 检查 OrderBook 合约配置...");
  
  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = OrderBook.attach(orderBookAddress);
  
  try {
    const orderBookClearingHouse = await orderBook.getClearingHouse();
    console.log("OrderBook 中的 ClearingHouse 地址:", orderBookClearingHouse);
    console.log("是否正确:", orderBookClearingHouse.toLowerCase() === clearingHouseAddress.toLowerCase() ? "✅" : "❌");
    
    if (orderBookClearingHouse.toLowerCase() !== clearingHouseAddress.toLowerCase()) {
      console.log("❌ OrderBook 中的 ClearingHouse 地址不匹配!");
    }
  } catch (error) {
    console.log("检查 OrderBook 失败:", error.message);
  }

  // 4. 检查其他关键配置
  console.log("\n4. 检查其他配置...");
  
  try {
    const quoteToken = await clearingHouse.getQuoteToken();
    console.log("QuoteToken 地址:", quoteToken);
    
    const marketRegistryAddress = await exchange.getMarketRegistry();
    console.log("MarketRegistry 地址:", marketRegistryAddress);
    
    // 检查池子是否存在
    const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
    const marketRegistry = MarketRegistry.attach(marketRegistryAddress);
    
    const hasPool = await marketRegistry.hasPool(baseTokenAddress);
    console.log("池子是否存在:", hasPool ? "✅" : "❌");
    
    if (hasPool) {
      const poolAddress = await marketRegistry.getPool(baseTokenAddress);
      console.log("池子地址:", poolAddress);
    }
  } catch (error) {
    console.log("检查其他配置失败:", error.message);
  }

  // 5. 检查合约状态
  console.log("\n5. 检查合约状态...");
  
  try {
    const isPaused = await clearingHouse.paused();
    console.log("ClearingHouse 是否暂停:", isPaused ? "❌ 是" : "✅ 否");
  } catch (error) {
    console.log("检查暂停状态失败:", error.message);
  }

  console.log("\n=== 诊断完成 ===");
}

debugOpenPositionFailure().catch(console.error);