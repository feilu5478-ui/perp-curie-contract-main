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

  // 3. 检查池子是否在 MarketRegistry 中注册
  console.log("\n3. 检查池子注册状态...");
  
  try {
    // 检查 baseToken 是否在 MarketRegistry 中注册
    const hasPool = await marketRegistry.hasPool(baseTokenAddress);
    console.log("BaseToken 是否在 MarketRegistry 中注册:", hasPool ? "✅" : "❌");

    if (hasPool) {
      // 获取池子地址
      const poolAddress = await marketRegistry.getPool(baseTokenAddress);
      console.log("MarketRegistry 中的池子地址:", poolAddress);
      
      // 检查池子状态
      if (poolAddress !== ethers.constants.AddressZero) {
        const Pool = await ethers.getContractFactory("UniswapV3Pool");
        const pool = Pool.attach(poolAddress);
        
        try {
          const slot0 = await pool.slot0();
          console.log("✅ 池子状态正常 - sqrtPriceX96:", slot0.sqrtPriceX96.toString());
          console.log("✅ 当前 tick:", slot0.tick.toString());
        } catch (error) {
          console.log("❌ 池子地址无效或无法访问");
        }
      } else {
        console.log("❌ MarketRegistry 返回的池子地址为零地址");
      }
    } else {
      console.log("❌ BaseToken 未在 MarketRegistry 中注册");
      
      // 检查可能的原因
      console.log("\n4. 检查池子注册失败的可能原因...");
      
      // 检查 baseToken decimals
      const BaseToken = await ethers.getContractFactory("BaseToken");
      const baseToken = BaseToken.attach(baseTokenAddress);
      
      try {
        const decimals = await baseToken.decimals();
        console.log("BaseToken decimals:", decimals);
        console.log("Decimals 是否为 18:", decimals === 18 ? "✅" : "❌ (需要18)");
      } catch (error) {
        console.log("无法获取 BaseToken decimals:", error.message);
      }
      
      // 检查 token 地址顺序 (baseToken < quoteToken)
      const quoteTokenAddress = await marketRegistry.getQuoteToken();
      console.log("QuoteToken 地址:", quoteTokenAddress);
      console.log("BaseToken < QuoteToken:", baseTokenAddress.toLowerCase() < quoteTokenAddress.toLowerCase() ? "✅" : "❌");
      
      // 检查 Uniswap V3 Factory
      const uniswapV3Factory = await marketRegistry.getUniswapV3Factory();
      console.log("Uniswap V3 Factory:", uniswapV3Factory);
    }
  } catch (error) {
    console.log("检查池子注册状态失败:", error.message);
  }

  // 4. 检查 Exchange 的其他配置
  console.log("\n5. 检查 Exchange 其他配置...");
  
  try {
    const exchangeClearingHouse = await exchange.getClearingHouse();
    console.log("Exchange 的 ClearingHouse:", exchangeClearingHouse);
    console.log("是否正确:", exchangeClearingHouse.toLowerCase() === clearingHouseAddress.toLowerCase() ? "✅" : "❌");

    const exchangeOrderBook = await exchange.getOrderBook();
    console.log("Exchange 的 OrderBook:", exchangeOrderBook);

    const exchangeAccountBalance = await exchange.getAccountBalance();
    console.log("Exchange 的 AccountBalance:", exchangeAccountBalance);

    // 检查 BaseToken 是否暂停
    const BaseToken = await ethers.getContractFactory("BaseToken");
    const baseToken = BaseToken.attach(baseTokenAddress);
    const isBaseTokenOpen = await baseToken.isOpen();
    console.log("BaseToken 是否开放交易:", isBaseTokenOpen ? "✅" : "❌ 已暂停");

  } catch (error) {
    console.log("检查 Exchange 配置失败:", error.message);
  }

  // 5. 获取市场信息
  console.log("\n6. 获取市场信息...");
  
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
    
    // 尝试获取基本市场信息（不带 trader 折扣）
    try {
      const marketInfoBasic = await marketRegistry.getMarketInfo(baseTokenAddress);
      console.log("基本市场信息（无折扣）:", {
        pool: marketInfoBasic.pool,
        exchangeFeeRatio: marketInfoBasic.exchangeFeeRatio.toString(),
        uniswapFeeRatio: marketInfoBasic.uniswapFeeRatio.toString(),
        insuranceFundFeeRatio: marketInfoBasic.insuranceFundFeeRatio.toString(),
        maxPriceSpreadRatio: marketInfoBasic.maxPriceSpreadRatio.toString()
      });
    } catch (error2) {
      console.log("获取基本市场信息也失败:", error2.message);
    }
  }

  // 6. 模拟开仓过程
  console.log("\n7. 模拟开仓过程...");
  
  try {
    // 使用 callStatic 模拟开仓，这会执行所有检查但不实际交易
    const openPositionParams = {
      baseToken: baseTokenAddress,
      isBaseToQuote: false,
      isExactInput: true,
      amount: ethers.utils.parseUnits("1", 18),
      oppositeAmountBound: 0,
      deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      sqrtPriceLimitX96: 0,
      referralCode: ethers.constants.HashZero
    };

    console.log("模拟开仓参数:", {
      ...openPositionParams,
      amount: openPositionParams.amount.toString()
    });
    
    const result = await clearingHouse.callStatic.openPosition(openPositionParams, { gasLimit: 100000000 });
    console.log("✅ 模拟开仓成功:", {
      base: result.base.toString(),
      quote: result.quote.toString(),
    //   exchangedPositionSize: result.exchangedPositionSize.toString(),
    //   exchangedPositionNotional: result.exchangedPositionNotional.toString()
    });
  } catch (error) {
    console.log("❌ 模拟开仓失败:", error.message);
    
    if (error.reason) {
      console.log("错误原因:", error.reason);
    }
    
    // 解析具体错误位置
    if (error.message.includes("MR_PNE")) {
      console.log("具体错误: MarketRegistry 中池子不存在 (MR_PNE)");
    } else if (error.message.includes("EX_MIP")) {
      console.log("具体错误: 市场已暂停 (EX_MIP)");
    } else if (error.message.includes("EX_BTNE")) {
      console.log("具体错误: BaseToken 不存在于 MarketRegistry (EX_BTNE)");
    } else if (error.message.includes("MR_BDN18")) {
      console.log("具体错误: BaseToken decimals 不是 18 (MR_BDN18)");
    } else if (error.message.includes("MR_IB")) {
      console.log("具体错误: BaseToken 地址顺序错误 (baseToken 必须 < quoteToken)");
    }
  }

  // 7. 检查是否需要调用 addPool
  console.log("\n8. 池子注册建议...");
  
  const hasPool = await marketRegistry.hasPool(baseTokenAddress);
  if (!hasPool) {
    console.log("⚠️  需要调用 MarketRegistry.addPool() 来注册池子");
    console.log("调用示例:");
    console.log(`await marketRegistry.addPool("${baseTokenAddress}", 3000); // 3000 是示例 feeRatio`);
    console.log("常见的 feeRatio: 500 (0.05%), 3000 (0.3%), 10000 (1%)");
  } else {
    console.log("✅ 池子已正确注册");
  }
}

debugExchangePoolLookup().catch(console.error);