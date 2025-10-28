// scripts/initializeFullSystem.ts
import { ethers } from "hardhat";

async function initializeFullSystem() {
  console.log("=== 完整系统初始化 ===");

  const [deployer] = await ethers.getSigners();
  
  // 合约地址
  const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
  const exchangeAddress = "0x891b4cb8743E3Ae419226068408dD00b225Cb46A"; // 你的 Exchange 地址
  const orderBookAddress = "0x269D854FF25dA67Cbe409820c742EB4600f0Cc43"; // 你的 OrderBook 地址
  const accountBalanceAddress = "0x347AAe8b046f4a75c1DE19733C5aef2baBe1fF4B"; // 你的 AccountBalance 地址
  const marketRegistryAddress = "0x91F83B0351b89194366a9b6986EE7887e6F7A0c5";

  // 1. 设置所有依赖合约的 ClearingHouse 地址
  console.log("1. 设置依赖合约的 ClearingHouse 地址...");
  
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = Exchange.attach(exchangeAddress);
  
  const OrderBook = await ethers.getContractFactory("OrderBook");
  const orderBook = OrderBook.attach(orderBookAddress);
  
  const AccountBalance = await ethers.getContractFactory("AccountBalance");
  const accountBalance = AccountBalance.attach(accountBalanceAddress);

  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);
  
//   // 设置 Exchange
//   await exchange.setClearingHouse(clearingHouseAddress);
//   console.log("✅ Exchange ClearingHouse 设置完成");
  
//   // 设置 OrderBook
//   await orderBook.setClearingHouse(clearingHouseAddress);
//   console.log("✅ OrderBook ClearingHouse 设置完成");
  
  // 设置 AccountBalance
  await accountBalance.setClearingHouse(clearingHouseAddress, { gasLimit: 500000 });
  console.log("✅ AccountBalance ClearingHouse 设置完成");

  // 2. 设置 MarketRegistry 的 ClearingHouse
//   await marketRegistry.setClearingHouse(clearingHouseAddress);
//   console.log("✅ MarketRegistry ClearingHouse 设置完成");

  // 3. 验证所有配置
  console.log("\n3. 验证所有配置...");
  
  const exchangeCH = await exchange.getClearingHouse();
  const orderBookCH = await orderBook.getClearingHouse();
  const accountBalanceCH = await accountBalance.getClearingHouse();
  const marketRegistryCH = await marketRegistry.getClearingHouse();
  
  console.log("Exchange ClearingHouse:", exchangeCH);
  console.log("OrderBook ClearingHouse:", orderBookCH);
  console.log("AccountBalance ClearingHouse:", accountBalanceCH);
  console.log("MarketRegistry ClearingHouse:", marketRegistryCH);
  
  const allCorrect = 
    exchangeCH.toLowerCase() === clearingHouseAddress.toLowerCase() &&
    orderBookCH.toLowerCase() === clearingHouseAddress.toLowerCase() &&
    accountBalanceCH.toLowerCase() === clearingHouseAddress.toLowerCase() &&
    marketRegistryCH.toLowerCase() === clearingHouseAddress.toLowerCase();
  
  console.log("所有配置正确:", allCorrect ? "✅" : "❌");

  if (allCorrect) {
    console.log("\n🎉 系统初始化完成！现在可以尝试开仓操作了");
  } else {
    console.log("\n❌ 系统初始化失败，请检查配置");
  }

  return allCorrect;
}

initializeFullSystem().catch(console.error);