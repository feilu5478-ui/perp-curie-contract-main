// scripts/debugPoolExistence.ts
import { ethers } from "hardhat";

async function debugPoolExistence() {
  console.log("=== 诊断池子存在性问题 ===");

  const baseTokenAddress = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
  const marketRegistryAddress = "0x91F83B0351b89194366a9b6986EE7887e6F7A0c5";
  const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";

  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);

  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(clearingHouseAddress);

  // 1. 检查池子是否存在
  console.log("1. 检查池子是否存在...");
  
  try {
    const hasPool = await marketRegistry.hasPool(baseTokenAddress);
    console.log("MarketRegistry 中池子是否存在:", hasPool ? "✅ 存在" : "❌ 不存在");

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
      console.log("❌ 池子不存在，需要重新添加");
    }
  } catch (error) {
    console.log("检查池子失败:", error.message);
  }

  // 2. 检查 ClearingHouse 使用的 MarketRegistry
  console.log("\n2. 检查 ClearingHouse 配置...");
  
  try {
    const exchangeAddress = await clearingHouse.getExchange();
    console.log("Exchange 地址:", exchangeAddress);
    
    const Exchange = await ethers.getContractFactory("Exchange");
    const exchange = Exchange.attach(exchangeAddress);
    
    const clearingHouseMarketRegistry = await exchange.getMarketRegistry();
    console.log("ClearingHouse 使用的 MarketRegistry:", clearingHouseMarketRegistry);
    console.log("是否正确:", clearingHouseMarketRegistry.toLowerCase() === marketRegistryAddress.toLowerCase() ? "✅" : "❌");
    
    if (clearingHouseMarketRegistry.toLowerCase() !== marketRegistryAddress.toLowerCase()) {
      console.log("❌ MarketRegistry 地址不匹配!");
    }
  } catch (error) {
    console.log("检查 ClearingHouse 配置失败:", error.message);
  }

  // 3. 检查 Uniswap 池子状态
  console.log("\n3. 检查 Uniswap 池子状态...");
  
  try {
    const uniswapV3Factory = await marketRegistry.getUniswapV3Factory();
    const quoteToken = await marketRegistry.getQuoteToken();
    
    console.log("Uniswap V3 Factory:", uniswapV3Factory);
    console.log("QuoteToken:", quoteToken);
    console.log("BaseToken:", baseTokenAddress);
    
    const UniswapV3Factory = await ethers.getContractAt(
      "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)",
      uniswapV3Factory
    );

    const poolAddress = await UniswapV3Factory.getPool(
      baseTokenAddress,
      quoteToken,
      500 // 0.05% fee
    );

    console.log("Uniswap 池子地址:", poolAddress);
    console.log("Uniswap 池子是否存在:", poolAddress !== ethers.constants.AddressZero ? "✅ 存在" : "❌ 不存在");

    if (poolAddress !== ethers.constants.AddressZero) {
      const UniswapV3Pool = await ethers.getContractAt(
        [
          "function token0() external view returns (address)",
          "function token1() external view returns (address)",
          "function fee() external view returns (uint24)",
          "function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)"
        ],
        poolAddress
      );

      const token0 = await UniswapV3Pool.token0();
      const token1 = await UniswapV3Pool.token1();
      const fee = await UniswapV3Pool.fee();
      const slot0 = await UniswapV3Pool.slot0();

      console.log("Uniswap 池子详情:");
      console.log("  token0:", token0);
      console.log("  token1:", token1);
      console.log("  fee:", fee);
      console.log("  sqrtPriceX96:", slot0.sqrtPriceX96.toString());
      console.log("  是否初始化:", slot0.sqrtPriceX96 !== "0" ? "✅ 是" : "❌ 否");
    }
  } catch (error) {
    console.log("检查 Uniswap 池子失败:", error.message);
  }

  // 4. 验证地址顺序
  console.log("\n4. 验证地址顺序...");
  
  const baseTokenLower = baseTokenAddress.toLowerCase();
  const quoteToken = await marketRegistry.getQuoteToken();
  const quoteTokenLower = quoteToken.toLowerCase();
  
  console.log("BaseToken 地址:", baseTokenLower);
  console.log("QuoteToken 地址:", quoteTokenLower);
  console.log("BaseToken < QuoteToken:", baseTokenLower < quoteTokenLower ? "✅ 正确" : "❌ 错误");
}

debugPoolExistence().catch(console.error);