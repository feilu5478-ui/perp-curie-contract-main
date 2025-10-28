// scripts/debugExchangePoolLookup.ts
import { ethers } from "hardhat";

async function debugExchangePoolLookup() {
  console.log("=== 诊断 Exchange 池子查找问题 ===");

  const baseTokenAddress = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
  const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
  const marketRegistryAddress = "0x91F83B0351b89194366a9b6986EE7887e6F7A0c5";

  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(clearingHouseAddress);

  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);

  // 1. 获取 Exchange 地址
  console.log("1. 获取 Exchange 地址...");
  
  const exchangeAddress = await clearingHouse.getExchange();
  console.log("Exchange 地址:", exchangeAddress);

  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = Exchange.attach(exchangeAddress);

  // 2. 检查 Exchange 使用的 MarketRegistry
  console.log("\n2. 检查 Exchange 配置...");
  
  const exchangeMarketRegistry = await exchange.getMarketRegistry();
  console.log("Exchange 使用的 MarketRegistry:", exchangeMarketRegistry);
  console.log("是否正确:", exchangeMarketRegistry.toLowerCase() === marketRegistryAddress.toLowerCase() ? "✅" : "❌");

  // 3. 直接通过 MarketRegistry 获取池子
  console.log("\n3. 通过 MarketRegistry 获取池子...");
  
  try {
    // 直接调用 MarketRegistry.getPool()
    const poolFromMarketRegistry = await marketRegistry.getPool(baseTokenAddress);
    console.log("MarketRegistry 获取的池子地址:", poolFromMarketRegistry);
    console.log("是否正确:", poolFromMarketRegistry !== ethers.constants.AddressZero ? "✅" : "❌");

    // 检查池子是否存在
    if (poolFromMarketRegistry !== ethers.constants.AddressZero) {
      const Pool = await ethers.getContractFactory("UniswapV3Pool");
      const pool = Pool.attach(poolFromMarketRegistry);
      
      try {
        const slot0 = await pool.slot0();
        console.log("✅ 池子状态正常 - sqrtPriceX96:", slot0.sqrtPriceX96.toString());
      } catch (error) {
        console.log("❌ 池子地址无效或无法访问");
      }
    }
  } catch (error) {
    console.log("MarketRegistry 获取池子失败:", error.message);
  }

  // 4. 检查 Exchange 的其他配置
  console.log("\n4. 检查 Exchange 其他配置...");
  
  try {
    const exchangeClearingHouse = await exchange.getClearingHouse();
    console.log("Exchange 的 ClearingHouse:", exchangeClearingHouse);
    console.log("是否正确:", exchangeClearingHouse.toLowerCase() === clearingHouseAddress.toLowerCase() ? "✅" : "❌");

    const exchangeOrderBook = await exchange.getOrderBook();
    console.log("Exchange 的 OrderBook:", exchangeOrderBook);

    const exchangeAccountBalance = await exchange.getAccountBalance();
    console.log("Exchange 的 AccountBalance:", exchangeAccountBalance);

    // 检查 baseToken 是否在 MarketRegistry 中注册
    const hasPool = await marketRegistry.hasPool(baseTokenAddress);
    console.log("BaseToken 是否在 MarketRegistry 中注册:", hasPool ? "✅" : "❌");

    // 检查 BaseToken 是否暂停
    const BaseToken = await ethers.getContractFactory("BaseToken");
    const baseToken = BaseToken.attach(baseTokenAddress);
    const isBaseTokenOpen = await baseToken.isOpen();
    console.log("BaseToken 是否开放交易:", isBaseTokenOpen ? "✅" : "❌ 已暂停");

  } catch (error) {
    console.log("检查 Exchange 配置失败:", error.message);
  }

  // 5. 获取市场信息
  console.log("\n5. 获取市场信息...");
  
  try {
    // 使用一个测试地址作为trader参数
    const testTrader = "0x0000000000000000000000000000000000000001";
    const marketInfo = await marketRegistry.getMarketInfoByTrader(testTrader, baseTokenAddress);
    console.log("市场信息:", {
      pool: marketInfo.pool,
      exchangeFeeRatio: marketInfo.exchangeFeeRatio.toString(),
      uniswapFeeRatio: marketInfo.uniswapFeeRatio.toString(),
      insuranceFundFeeRatio: marketInfo.insuranceFundFeeRatio.toString(),
      maxPriceSpreadRatio: marketInfo.maxPriceSpreadRatio.toString()
    });
  } catch (error) {
    console.log("获取市场信息失败:", error.message);
  }
}

debugExchangePoolLookup().catch(console.error);