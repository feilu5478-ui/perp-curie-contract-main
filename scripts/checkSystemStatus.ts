// scripts/checkSystemStatus.ts
import { ethers } from "hardhat";

async function checkSystemStatus() {
  console.log("=== 检查系统状态 ===");

  const [deployer] = await ethers.getSigners();
  const userAddress = "0x7c6332D587B13E38A677f1556809301D5A2E1B60";
  const baseTokenAddress = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
  const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
  const marketRegistryAddress = "0x91F83B0351b89194366a9b6986EE7887e6F7A0c5";

  const BaseToken = await ethers.getContractFactory("BaseToken");
  const baseToken = BaseToken.attach(baseTokenAddress);
  
  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(clearingHouseAddress);
  
  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);

  console.log("用户地址:", userAddress);
  console.log("BaseToken 地址:", baseTokenAddress);
  console.log("ClearingHouse 地址:", clearingHouseAddress);

  // 1. 检查 BaseToken 状态
  console.log("\n1. 检查 BaseToken 状态...");
  try {
    const isOpen = await baseToken.isOpen();
    const isPaused = await baseToken.isPaused();
    const isClosed = await baseToken.isClosed();
    console.log("BaseToken 状态 - 开放:", isOpen, "暂停:", isPaused, "关闭:", isClosed);
    
    if (!isOpen) {
      console.log("❌ BaseToken 未开放交易");
    }
  } catch (error) {
    console.log("检查 BaseToken 状态失败:", error.message);
  }

  // 2. 检查池子是否存在
  console.log("\n2. 检查池子状态...");
  try {
    const hasPool = await marketRegistry.hasPool(baseTokenAddress);
    console.log("市场是否有池子:", hasPool);
    
    if (hasPool) {
      const poolAddress = await marketRegistry.getPool(baseTokenAddress);
      console.log("池子地址:", poolAddress);
      
      const marketInfo = await marketRegistry.getMarketInfo(baseTokenAddress);
      console.log("市场信息:", {
        pool: marketInfo.pool,
        exchangeFeeRatio: marketInfo.exchangeFeeRatio,
        uniswapFeeRatio: marketInfo.uniswapFeeRatio,
        insuranceFundFeeRatio: marketInfo.insuranceFundFeeRatio,
        maxPriceSpreadRatio: marketInfo.maxPriceSpreadRatio
      });
    } else {
      console.log("❌ 市场没有池子，需要先添加池子");
    }
  } catch (error) {
    console.log("检查池子状态失败:", error.message);
  }

  // 3. 检查白名单
  console.log("\n3. 检查白名单...");
  try {
    const userInBaseWhitelist = await baseToken.isInWhitelist(userAddress);
    const userInQuoteWhitelist = await baseToken.isInWhitelist(userAddress); // 需要 QuoteToken 地址
    const clearingHouseInBaseWhitelist = await baseToken.isInWhitelist(clearingHouseAddress);
    
    console.log("用户在 BaseToken 白名单:", userInBaseWhitelist);
    console.log("ClearingHouse 在 BaseToken 白名单:", clearingHouseInBaseWhitelist);
    
    if (!userInBaseWhitelist) {
      console.log("❌ 用户不在 BaseToken 白名单中");
    }
    if (!clearingHouseInBaseWhitelist) {
      console.log("❌ ClearingHouse 不在 BaseToken 白名单中");
    }
  } catch (error) {
    console.log("检查白名单失败:", error.message);
  }

  // 4. 检查用户余额
  console.log("\n4. 检查用户余额...");
  try {
    // 需要检查用户是否有足够的 QuoteToken 余额
    // 因为 isBaseToQuote: false 表示用 QuoteToken 购买 BaseToken
    
    const quoteTokenAddress = await marketRegistry.getQuoteToken();
    console.log("QuoteToken 地址:", quoteTokenAddress);
    
    const QuoteToken = await ethers.getContractFactory("QuoteToken");
    const quoteToken = QuoteToken.attach(quoteTokenAddress);
    
    const userQuoteBalance = await quoteToken.balanceOf(userAddress);
    console.log("用户 QuoteToken 余额:", ethers.utils.formatEther(userQuoteBalance));
    
    const amount = ethers.utils.parseEther("100"); // 100个代币
    if (userQuoteBalance.lt(amount)) {
      console.log("❌ 用户 QuoteToken 余额不足");
    }
  } catch (error) {
    console.log("检查用户余额失败:", error.message);
  }

  // 5. 检查 ClearingHouse 状态
  console.log("\n5. 检查 ClearingHouse 状态...");
  try {
    const isPaused = await clearingHouse.paused();
    console.log("ClearingHouse 是否暂停:", isPaused);
    
    if (isPaused) {
      console.log("❌ ClearingHouse 已暂停，无法交易");
    }
  } catch (error) {
    console.log("检查 ClearingHouse 状态失败:", error.message);
  }
}

checkSystemStatus().catch(console.error);