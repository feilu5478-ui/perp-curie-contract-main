// scripts/fixClearingHouseDependencies.ts
import { ethers } from "hardhat";

async function fixClearingHouseDependencies() {
  console.log("=== 修复 ClearingHouse 依赖合约配置 ===");

  const [deployer] = await ethers.getSigners();
  const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";

  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(clearingHouseAddress);

  // 获取所有依赖合约地址
  const exchangeAddress = await clearingHouse.getExchange();
  const orderBookAddress = await clearingHouse.getOrderBook();
  const accountBalanceAddress = await clearingHouse.getAccountBalance();
  const vaultAddress = await clearingHouse.getVault();

  console.log("依赖合约地址:");
  console.log("Exchange:", exchangeAddress);
  console.log("OrderBook:", orderBookAddress);
  console.log("AccountBalance:", accountBalanceAddress);
  console.log("Vault:", vaultAddress);

  // 1. 修复 Exchange 合约
  console.log("\n1. 修复 Exchange 合约...");
  
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = Exchange.attach(exchangeAddress);
  
  try {
    const currentExchangeCH = await exchange.getClearingHouse();
    if (currentExchangeCH.toLowerCase() !== clearingHouseAddress.toLowerCase()) {
      console.log("设置 Exchange 的 ClearingHouse...");
      
      const exchangeOwner = await exchange.owner();
      if (exchangeOwner.toLowerCase() === deployer.address.toLowerCase()) {
        await exchange.setClearingHouse(clearingHouseAddress);
        console.log("✅ Exchange ClearingHouse 设置完成");
      } else {
        console.log("❌ 部署者不是 Exchange 的所有者");
      }
    } else {
      console.log("✅ Exchange ClearingHouse 已正确设置");
    }
  } catch (error) {
    console.log("修复 Exchange 失败:", error.message);
  }

  // 2. 修复 OrderBook 合约
  console.log("\n2. 修复 OrderBook 合约...");
  
  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = OrderBook.attach(orderBookAddress);
  
  try {
    const currentOrderBookCH = await orderBook.getClearingHouse();
    if (currentOrderBookCH.toLowerCase() !== clearingHouseAddress.toLowerCase()) {
      console.log("设置 OrderBook 的 ClearingHouse...");
      
      const orderBookOwner = await orderBook.owner();
      if (orderBookOwner.toLowerCase() === deployer.address.toLowerCase()) {
        await orderBook.setClearingHouse(clearingHouseAddress);
        console.log("✅ OrderBook ClearingHouse 设置完成");
      } else {
        console.log("❌ 部署者不是 OrderBook 的所有者");
      }
    } else {
      console.log("✅ OrderBook ClearingHouse 已正确设置");
    }
  } catch (error) {
    console.log("修复 OrderBook 失败:", error.message);
  }

  // 3. 修复 AccountBalance 合约
  console.log("\n3. 修复 AccountBalance 合约...");
  
  const AccountBalance = await ethers.getContractFactory("AccountBalance");
  const accountBalance = AccountBalance.attach(accountBalanceAddress);
  
  try {
    const currentAccountBalanceCH = await accountBalance.getClearingHouse();
    if (currentAccountBalanceCH.toLowerCase() !== clearingHouseAddress.toLowerCase()) {
      console.log("设置 AccountBalance 的 ClearingHouse...");
      
      const accountBalanceOwner = await accountBalance.owner();
      if (accountBalanceOwner.toLowerCase() === deployer.address.toLowerCase()) {
        await accountBalance.setClearingHouse(clearingHouseAddress);
        console.log("✅ AccountBalance ClearingHouse 设置完成");
      } else {
        console.log("❌ 部署者不是 AccountBalance 的所有者");
      }
    } else {
      console.log("✅ AccountBalance ClearingHouse 已正确设置");
    }
  } catch (error) {
    console.log("修复 AccountBalance 失败:", error.message);
  }

  // 4. 验证修复结果
  console.log("\n4. 验证修复结果...");
  
  const finalExchangeCH = await exchange.getClearingHouse();
  const finalOrderBookCH = await orderBook.getClearingHouse();
  const finalAccountBalanceCH = await accountBalance.getClearingHouse();
  
  console.log("Exchange ClearingHouse:", finalExchangeCH);
  console.log("OrderBook ClearingHouse:", finalOrderBookCH);
  console.log("AccountBalance ClearingHouse:", finalAccountBalanceCH);
  
  const allCorrect = 
    finalExchangeCH.toLowerCase() === clearingHouseAddress.toLowerCase() &&
    finalOrderBookCH.toLowerCase() === clearingHouseAddress.toLowerCase() &&
    finalAccountBalanceCH.toLowerCase() === clearingHouseAddress.toLowerCase();
  
  console.log("所有依赖合约配置正确:", allCorrect ? "✅" : "❌");

  return allCorrect;
}

fixClearingHouseDependencies().catch(console.error);