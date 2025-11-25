// scripts/debugAddPoolFailure.ts
import { ethers } from "hardhat";

async function debugAddPoolFailure() {
  console.log("=== 调试 addPool 失败 ===");

  const baseTokenAddress = "0x14aA73eB98C623C8712c445847873AD0D29BD834";
  const marketRegistryAddress = "0x2911377369fA73F97125eF1816Ac6475cADea3b6";
  const clearingHouseAddress = "0xcdEa7bEF2E550eC317E4FEc80Fc59B00AE271fa3";

  const BaseToken = await ethers.getContractFactory("BaseToken");
  const baseToken = BaseToken.attach(baseTokenAddress);
  
  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);

  // 1. 检查 MarketRegistry 配置
  console.log("1. 检查 MarketRegistry 配置...");
  
  const marketRegistryQuoteToken = await marketRegistry.getQuoteToken();
  const marketRegistryUniswapFactory = await marketRegistry.getUniswapV3Factory();
  const marketRegistryClearingHouse = await marketRegistry.getClearingHouse();
  
  console.log("MarketRegistry QuoteToken:", marketRegistryQuoteToken);
  console.log("MarketRegistry UniswapFactory:", marketRegistryUniswapFactory);
  console.log("MarketRegistry ClearingHouse:", marketRegistryClearingHouse);
  console.log("实际 ClearingHouse 地址:", clearingHouseAddress);
  
  // 检查 ClearingHouse 地址是否匹配
  if (marketRegistryClearingHouse.toLowerCase() !== clearingHouseAddress.toLowerCase()) {
    console.log("❌ MarketRegistry 中的 ClearingHouse 地址不匹配!");
    console.log("需要设置正确的 ClearingHouse 地址");
  }

  // 2. 检查 BaseToken 余额
  console.log("\n2. 检查 BaseToken 余额...");
  
  const baseTokenBalance = await baseToken.balanceOf(clearingHouseAddress);
  const maxUint256 = ethers.constants.MaxUint256;
  
  console.log("ClearingHouse BaseToken 余额:", baseTokenBalance.toString());
  console.log("要求余额 (maxUint256):", maxUint256.toString());
  console.log("余额是否相等:", baseTokenBalance.eq(maxUint256));
  
  if (!baseTokenBalance.eq(maxUint256)) {
    console.log("❌ BaseToken 余额不足");
    console.log("差额:", maxUint256.sub(baseTokenBalance).toString());
  }

  // 3. 检查 QuoteToken 总供应量
  console.log("\n3. 检查 QuoteToken 总供应量...");
  
  const QuoteToken = await ethers.getContractFactory("QuoteToken");
  const quoteToken = QuoteToken.attach(marketRegistryQuoteToken);
  
  const quoteTokenTotalSupply = await quoteToken.totalSupply();
  console.log("QuoteToken 总供应量:", quoteTokenTotalSupply.toString());
  console.log("要求供应量 (maxUint256):", maxUint256.toString());
  console.log("供应量是否相等:", quoteTokenTotalSupply.eq(maxUint256));
  
  if (!quoteTokenTotalSupply.eq(maxUint256)) {
    console.log("❌ QuoteToken 总供应量不足");
  }

  // 4. 检查地址顺序
  console.log("\n4. 检查地址顺序...");
  
  const baseTokenAddr = baseTokenAddress.toLowerCase();
  const quoteTokenAddr = marketRegistryQuoteToken.toLowerCase();
  
  console.log("BaseToken 地址:", baseTokenAddr);
  console.log("QuoteToken 地址:", quoteTokenAddr);
  console.log("BaseToken < QuoteToken:", baseTokenAddr < quoteTokenAddr);
  
  if (baseTokenAddr >= quoteTokenAddr) {
    console.log("❌ 地址顺序不符合要求");
  }

  // 5. 检查 Uniswap 池子
  console.log("\n5. 检查 Uniswap 池子...");
  
  const feeRatio = 10000;
  
  // 使用 Uniswap V3 Factory 检查池子
  const UniswapV3Factory = await ethers.getContractAt(
    "IUniswapV3Factory",
    marketRegistryUniswapFactory
  );
  
  const poolAddress = await UniswapV3Factory.getPool(
    baseTokenAddress,
    marketRegistryQuoteToken,
    feeRatio
  );
  
  console.log("Uniswap 池子地址:", poolAddress);
  
  if (poolAddress === ethers.constants.AddressZero) {
    console.log("❌ Uniswap 池子不存在");
    console.log("参数:");
    console.log("  TokenA (BaseToken):", baseTokenAddress);
    console.log("  TokenB (QuoteToken):", marketRegistryQuoteToken);
    console.log("  Fee:", feeRatio);
  } else {
    // 检查池子状态
    const UniswapV3Pool = await ethers.getContractAt("IUniswapV3Pool", poolAddress);
    const slot0 = await UniswapV3Pool.slot0();
    console.log("池子 sqrtPriceX96:", slot0.sqrtPriceX96.toString());
    console.log("池子是否初始化:", slot0.sqrtPriceX96 !== "0" ? "✅ 是" : "❌ 否");
  }

  // 6. 检查白名单
  console.log("\n6. 检查白名单...");
  
  const clearingHouseInBaseWhitelist = await baseToken.isInWhitelist(clearingHouseAddress);
  const poolInBaseWhitelist = poolAddress !== ethers.constants.AddressZero ? 
    await baseToken.isInWhitelist(poolAddress) : false;
  
  console.log("ClearingHouse 在 BaseToken 白名单:", clearingHouseInBaseWhitelist);
  console.log("Pool 在 BaseToken 白名单:", poolInBaseWhitelist);
  
  if (!clearingHouseInBaseWhitelist) {
    console.log("❌ ClearingHouse 不在 BaseToken 白名单中");
  }
  if (!poolInBaseWhitelist && poolAddress !== ethers.constants.AddressZero) {
    console.log("❌ Pool 不在 BaseToken 白名单中");
  }

  // 7. 检查 QuoteToken 白名单
  console.log("\n7. 检查 QuoteToken 白名单...");
  
  const clearingHouseInQuoteWhitelist = await quoteToken.isInWhitelist(clearingHouseAddress);
  const poolInQuoteWhitelist = poolAddress !== ethers.constants.AddressZero ? 
    await quoteToken.isInWhitelist(poolAddress) : false;
  
  console.log("ClearingHouse 在 QuoteToken 白名单:", clearingHouseInQuoteWhitelist);
  console.log("Pool 在 QuoteToken 白名单:", poolInQuoteWhitelist);
  
  if (!clearingHouseInQuoteWhitelist) {
    console.log("❌ ClearingHouse 不在 QuoteToken 白名单中");
  }
  if (!poolInQuoteWhitelist && poolAddress !== ethers.constants.AddressZero) {
    console.log("❌ Pool 不在 QuoteToken 白名单中");
  }

  console.log("\n=== 检查完成 ===");
}

debugAddPoolFailure().catch(console.error);