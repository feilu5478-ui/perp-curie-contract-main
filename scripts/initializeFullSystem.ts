// scripts/initializeFullSystem.ts
import { ethers } from "hardhat";

async function initializeFullSystem() {
  console.log("=== 完整系统初始化 ===");

  const [deployer] = await ethers.getSigners();
  
  // 合约地址
  const clearingHouseAddress = "0xC6dAc2934c24789CB0a1bDa7118a0Bc8367d8Daf";
  const exchangeAddress = "0x163F449C0F4537fB0a99C8d28Fb5d99B6B7F09B2"; // 你的 Exchange 地址
  const orderBookAddress = "0x02f48aDD96235156ed24F84B19d9DF3a714b555d"; // 你的 OrderBook 地址
  const accountBalanceAddress = "0xC6A89EFcC84a32376E9350D8467A48234657fb9a"; // 你的 AccountBalance 地址
  const marketRegistryAddress = "0xA642F92c7Cdc362e376487D0519d0752Ee6CD183";

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
  
  // 设置 Exchange
  await exchange.setClearingHouse(clearingHouseAddress);
  console.log("✅ Exchange ClearingHouse 设置完成");
  
  // 设置 OrderBook
  await orderBook.setClearingHouse(clearingHouseAddress);
  console.log("✅ OrderBook ClearingHouse 设置完成");
  
  // 设置 AccountBalance
  await accountBalance.setClearingHouse(clearingHouseAddress, { gasLimit: 500000 });
  console.log("✅ AccountBalance ClearingHouse 设置完成");

  // 2. 设置 MarketRegistry 的 ClearingHouse
  await marketRegistry.setClearingHouse(clearingHouseAddress);
  console.log("✅ MarketRegistry ClearingHouse 设置完成");

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