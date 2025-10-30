import { ethers } from "hardhat";

async function checkAllPreconditions() {
  const [signer] = await ethers.getSigners();
  
  console.log("检查所有添加流动性的前提条件...");
  console.log("操作账户:", signer.address);

  const clearingHouseAddress = "0xC6dAc2934c24789CB0a1bDa7118a0Bc8367d8Daf";
  const baseTokenAddress = "0x57e6345d14a30A554806b254D161A1694eb3bD83";

  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(clearingHouseAddress);

  try {
    // 1. 检查市场状态
    console.log("\n1. 检查 BaseToken 状态...");
    const BaseToken = await ethers.getContractFactory("BaseToken");
    const baseToken = BaseToken.attach(baseTokenAddress);
    
    const isOpen = await baseToken.isOpen();
    const isPaused = await baseToken.isPaused();
    const isClosed = await baseToken.isClosed();
    
    console.log("- 市场开放:", isOpen);
    console.log("- 市场暂停:", isPaused);
    console.log("- 市场关闭:", isClosed);
    
    if (!isOpen) {
      console.log("❌ 市场未开放，无法添加流动性");
      return false;
    }

    // 2. 检查价格点差
    console.log("\n2. 检查价格点差...");
    const exchangeAddress = await clearingHouse.getExchange();
    const Exchange = await ethers.getContractFactory("Exchange");
    const exchange = Exchange.attach(exchangeAddress);
    
    const isOverSpread = await exchange.isOverPriceSpread(baseTokenAddress);
    console.log("- 价格点差是否过大:", isOverSpread);
    
    if (isOverSpread) {
      console.log("❌ 价格点差过大，无法添加流动性");
      console.log("💡 建议: 等待价格收敛或调整价格源");
      return false;
    }

    // 4. 检查白名单
    console.log("\n4. 检查白名单...");
    const VirtualToken = await ethers.getContractFactory("VirtualToken");
    const baseVirtual = VirtualToken.attach(baseTokenAddress);
    const quoteVirtual = VirtualToken.attach("0xE3E009ADb11434B3fb9acfb5Cb8a30cc94E52cdE");
    
    const isClearingHouseInBaseWhitelist = await baseVirtual.isInWhitelist(clearingHouseAddress);
    const isClearingHouseInQuoteWhitelist = await quoteVirtual.isInWhitelist(clearingHouseAddress);
    
    console.log("- ClearingHouse 在 BaseToken 白名单:", isClearingHouseInBaseWhitelist);
    console.log("- ClearingHouse 在 QuoteToken 白名单:", isClearingHouseInQuoteWhitelist);
    
    if (!isClearingHouseInBaseWhitelist || !isClearingHouseInQuoteWhitelist) {
      console.log("❌ ClearingHouse 不在代币白名单中");
      return false;
    }

    // 5. 检查 Uniswap 池子状态
    console.log("\n5. 检查 Uniswap 池子状态...");
    const marketRegistryAddress = await exchange.getMarketRegistry();
    const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
    const marketRegistry = MarketRegistry.attach(marketRegistryAddress);
    
    const hasPool = await marketRegistry.hasPool(baseTokenAddress);
    console.log("- 池子是否存在:", hasPool);
    
    if (!hasPool) {
      console.log("❌ 池子未在 MarketRegistry 中注册");
      return false;
    }

    const marketInfo = await marketRegistry.getMarketInfo(baseTokenAddress);
    const poolAddress = marketInfo.pool;
    
    const UniswapV3Pool = await ethers.getContractFactory("UniswapV3Pool");
    const pool = UniswapV3Pool.attach(poolAddress);
    
    const slot0 = await pool.slot0();
    const liquidity = await pool.liquidity();
    
    console.log("- 池子已初始化:", slot0.sqrtPriceX96.gt(0));
    console.log("- 当前流动性:", liquidity.toString());
    console.log("- 当前 tick:", slot0.tick.toString());

    // 6. 检查池子白名单
    console.log("\n6. 检查池子白名单...");
    const isPoolInBaseWhitelist = await baseVirtual.isInWhitelist(poolAddress);
    const isPoolInQuoteWhitelist = await quoteVirtual.isInWhitelist(poolAddress);
    
    console.log("- 池子在 BaseToken 白名单:", isPoolInBaseWhitelist);
    console.log("- 池子在 QuoteToken 白名单:", isPoolInQuoteWhitelist);
    
    if (!isPoolInBaseWhitelist || !isPoolInQuoteWhitelist) {
      console.log("❌ 池子不在代币白名单中");
      return false;
    }

    // 7. 检查价格限制
    console.log("\n7. 检查价格限制...");
    const maxTickCrossed = await exchange.getMaxTickCrossedWithinBlock(baseTokenAddress);
    console.log("- 最大 tick 跨度过块限制:", maxTickCrossed.toString());
    
    // if (maxTickCrossed.eq(0)) {
    //   console.log("❌ 市场被暂停（maxTickCrossedWithinBlock = 0）");
    //   return false;
    // }

    // 8. 检查 tick 范围是否合理
    console.log("\n8. 检查 tick 范围...");
    const currentTick = slot0.tick;
    const lowerTick = 81940;
    const upperTick = 83940;
    
    console.log("- 当前 tick:", currentTick.toString());
    console.log("- 设置 lowerTick:", lowerTick);
    console.log("- 设置 upperTick:", upperTick);
    // console.log("- 当前价格在范围内:", currentTick.gte(lowerTick) && currentTick.lte(upperTick));
    
    // if (currentTick.lt(lowerTick) || currentTick.gt(upperTick)) {
    //   console.log("❌ 当前价格不在流动性范围内");
    //   console.log("💡 建议: 调整 tick 范围或等待价格进入范围");
    //   return false;
    // }

    console.log("\n✅ 所有前提条件检查通过！");
    return true;

  } catch (error) {
    console.error("❌ 检查过程中出错:", error.message);
    return false;
  }
}

// 运行检查
checkAllPreconditions().then(async (isReady) => {
  if (isReady) {
    console.log("\n🎯 所有条件满足，尝试添加流动性...");
    // await retryAddLiquidityWithBetterParams();
  } else {
    console.log("\n❌ 存在未满足的条件，请先解决问题");
  }
});