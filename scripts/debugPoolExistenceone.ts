// scripts/debugPoolExistence.ts
import { ethers } from "hardhat";

async function debugPoolExistence() {
  console.log("=== 深入诊断池子存在性问题 ===");

  const baseTokenAddress = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
  const marketRegistryAddress = "0x91F83B0351b89194366a9b6986EE7887e6F7A0c5";
  const exchangeAddress = "0x891b4cb8743E3Ae419226068408dD00b225Cb46A";

  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);

  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = Exchange.attach(exchangeAddress);

  // 1. 检查存储状态
  console.log("1. 检查 MarketRegistry 存储状态...");
  
  try {
    // 直接检查池子映射
    const poolAddress = await marketRegistry.getPool(baseTokenAddress);
    console.log("getPool() 返回:", poolAddress);
    
    const hasPool = await marketRegistry.hasPool(baseTokenAddress);
    console.log("hasPool() 返回:", hasPool);
    
    if (poolAddress === ethers.constants.AddressZero) {
      console.log("❌ 池子地址为零地址");
      return;
    }
  } catch (error) {
    console.log("检查存储状态失败:", error.message);
    return;
  }

  // 2. 检查池子在 Uniswap 中的实际状态
  console.log("\n2. 检查 Uniswap 池子状态...");
  
  try {
    const poolAddress = await marketRegistry.getPool(baseTokenAddress);
    const Pool = await ethers.getContractFactory("UniswapV3Pool");
    const pool = Pool.attach(poolAddress);
    
    const token0 = await pool.token0();
    const token1 = await pool.token1();
    const fee = await pool.fee();
    const liquidity = await pool.liquidity();
    
    console.log("Uniswap 池子详情:");
    console.log("  token0:", token0);
    console.log("  token1:", token1);
    console.log("  fee:", fee.toString());
    console.log("  liquidity:", liquidity.toString());
    
    // 验证 token 顺序
    const quoteToken = await marketRegistry.getQuoteToken();
    console.log("QuoteToken:", quoteToken);
    console.log("BaseToken 应为 token0:", baseTokenAddress.toLowerCase() === token0.toLowerCase() ? "✅" : "❌");
    console.log("QuoteToken 应为 token1:", quoteToken.toLowerCase() === token1.toLowerCase() ? "✅" : "❌");
    
  } catch (error) {
    console.log("检查 Uniswap 池子失败:", error.message);
  }

  // 3. 检查 Exchange 的调用上下文
  console.log("\n3. 检查 Exchange 调用上下文...");
  
  try {
    // 模拟 Exchange 内部调用 MarketRegistry 的方式
    const testTrader = "0x0000000000000000000000000000000000000001";
    
    console.log("模拟 Exchange 调用 getMarketInfoByTrader...");
    const marketInfo = await marketRegistry.getMarketInfoByTrader(testTrader, baseTokenAddress);
    console.log("✅ 调用成功");
    
    console.log("模拟 Exchange 调用 getPool...");
    const pool = await marketRegistry.getPool(baseTokenAddress);
    console.log("✅ 调用成功");
    
  } catch (error) {
    console.log("❌ Exchange 上下文调用失败:", error.message);
    console.log("错误原因:", error.reason);
  }

  // 4. 检查可能的合约状态问题
  console.log("\n4. 检查合约状态问题...");
  
  try {
    // 检查 MarketRegistry 是否暂停
    console.log("检查合约暂停状态...");
    
    // 检查 Exchange 的最大 tick 跨度过设置
    const maxTickCrossed = await exchange.getMaxTickCrossedWithinBlock(baseTokenAddress);
    console.log("Exchange MaxTickCrossed:", maxTickCrossed.toString());
    console.log("MaxTickCrossed 是否大于 0:", maxTickCrossed > 0 ? "✅" : "❌ (市场可能暂停)");
    
  } catch (error) {
    console.log("检查合约状态失败:", error.message);
  }

  // 5. 尝试直接调用 ClearingHouse 的内部方法
  console.log("\n5. 尝试直接调用...");
  
  try {
    const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
    const clearingHouse = ClearingHouse.attach("0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB");
    
    // 获取 AccountBalance
    const accountBalanceAddress = await clearingHouse.getAccountBalance();
    console.log("AccountBalance:", accountBalanceAddress);
    
    const AccountBalance = await ethers.getContractFactory("AccountBalance");
    const accountBalance = AccountBalance.attach(accountBalanceAddress);
    
    // 检查 baseToken 是否在 AccountBalance 中注册
    // const sqrtPriceX96 = await accountBalance.getSqrtMarkTwapX96(baseTokenAddress, 0);
    // console.log("AccountBalance 获取的 sqrtPriceX96:", sqrtPriceX96.toString());
    console.log("✅ AccountBalance 可以访问池子价格");
    
  } catch (error) {
    console.log("直接调用失败:", error.message);
  }

  // 6. 检查交易重放
  console.log("\n6. 检查交易重放问题...");
  
  try {
    // 使用不同的 gas 设置
    const openPositionParams = {
      baseToken: baseTokenAddress,
      isBaseToQuote: false,
      isExactInput: true,
      amount: ethers.utils.parseUnits("0.1", 18), // 更小的数量
      oppositeAmountBound: 0,
      deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      sqrtPriceLimitX96: 0,
      referralCode: ethers.constants.HashZero
    };

    const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
    const clearingHouse = ClearingHouse.attach("0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB");
    
    // 尝试使用更高的 gas limit
    const result = await clearingHouse.callStatic.openPosition(openPositionParams, {
      gasLimit: 5000000
    });
    console.log("✅ 使用更高 gas limit 模拟成功");
    
  } catch (error) {
    console.log("❌ 交易重放仍然失败:", error.message);
    
    // 分析错误数据
    if (error.data) {
      console.log("错误数据:", error.data);
    }
    
    if (error.reason) {
      console.log("错误原因:", error.reason);
      
      // 特别检查 MR_PNE 错误
      if (error.reason.includes("MR_PNE")) {
        console.log("\n🔍 MR_PNE 错误分析:");
        console.log("1. 检查 MarketRegistry 存储布局是否改变");
        console.log("2. 检查代理模式下的实现合约");
        console.log("3. 检查合约是否被重新初始化");
        console.log("4. 检查调用链中的上下文问题");
      }
    }
  }

  // 7. 最终建议
  console.log("\n7. 解决方案建议...");
  
  console.log("基于诊断结果，建议:");
  console.log("1. 检查 MarketRegistry 是否使用了代理模式");
  console.log("2. 验证所有相关合约的地址是否正确");
  console.log("3. 检查合约的存储布局是否一致");
  console.log("4. 尝试重新添加池子到 MarketRegistry");
  
  console.log("\n重新添加池子命令:");
  console.log(`await marketRegistry.addPool("${baseTokenAddress}", 500);`);
}

debugPoolExistence().catch(console.error);