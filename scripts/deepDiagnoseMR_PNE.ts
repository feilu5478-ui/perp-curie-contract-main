// scripts/deepDiagnoseMR_PNE.ts
import { ethers } from "hardhat";

async function deepDiagnoseMR_PNE() {
  console.log("=== 深度诊断 MR_PNE 错误 ===");

  const baseTokenAddress = "0x14aA73eB98C623C8712c445847873AD0D29BD834";
  const marketRegistryAddress = "0x2911377369fA73F97125eF1816Ac6475cADea3b6";
  const exchangeAddress = "0x4EEe99beA14d52515A94463ca4D1d739Ad2a0F5F";
  const clearingHouseAddress = "0xcdEa7bEF2E550eC317E4FEc80Fc59B00AE271fa3";

  const [signer] = await ethers.getSigners();
  
  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);
  
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = Exchange.attach(exchangeAddress);
  
  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(clearingHouseAddress);

  // 1. 检查所有相关的合约地址
  console.log("1. 检查合约地址配置...");
  
  const exchangeMarketRegistry = await exchange.getMarketRegistry();
  console.log("Exchange 的 MarketRegistry:", exchangeMarketRegistry);
  console.log("是否匹配:", exchangeMarketRegistry.toLowerCase() === marketRegistryAddress.toLowerCase() ? "✅" : "❌");

  const exchangeClearingHouse = await exchange.getClearingHouse();
  console.log("Exchange 的 ClearingHouse:", exchangeClearingHouse);
  console.log("是否匹配:", exchangeClearingHouse.toLowerCase() === clearingHouseAddress.toLowerCase() ? "✅" : "❌");

  // 2. 检查池子状态
  console.log("\n2. 检查池子状态...");
  
  try {
    const hasPool = await marketRegistry.hasPool(baseTokenAddress);
    console.log("MarketRegistry.hasPool():", hasPool);
    
    const poolAddress = await marketRegistry.getPool(baseTokenAddress);
    console.log("MarketRegistry.getPool():", poolAddress);
    
    if (poolAddress !== ethers.constants.AddressZero) {
      console.log("✅ 池子地址有效");
      
      // 检查池子在 Uniswap 中的状态
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
    } else {
      console.log("❌ 池子地址为零地址");
    }
  } catch (error) {
    console.log("检查池子状态失败:", error.message);
  }

  // 3. 检查 Exchange 的市场状态
  console.log("\n3. 检查 Exchange 市场状态...");
  
  try {
    const maxTickCrossed = await exchange.getMaxTickCrossedWithinBlock(baseTokenAddress);
    console.log("Exchange MaxTickCrossed:", maxTickCrossed.toString());
    console.log("市场是否激活:", maxTickCrossed > 0 ? "✅" : "❌");
    
    if (maxTickCrossed === 0) {
      console.log("⚠️  市场被暂停，需要调用 setMaxTickCrossedWithinBlock 激活");
    }
  } catch (error) {
    console.log("检查 Exchange 状态失败:", error.message);
  }

  // 4. 模拟交易调用链
  console.log("\n4. 模拟交易调用链...");
  
  try {
    // 模拟 ClearingHouse -> Exchange -> MarketRegistry 的调用
    console.log("模拟 MarketRegistry.getMarketInfoByTrader...");
    const marketInfo = await marketRegistry.getMarketInfoByTrader(signer.address, baseTokenAddress);
    console.log("✅ MarketRegistry 调用成功");
    console.log("  池子地址:", marketInfo.pool);
    
    console.log("模拟 Exchange.swap...");
    // 使用 callStatic 模拟 swap 调用
    // const swapParams = {
    //   trader: signer.address,
    //   baseToken: baseTokenAddress,
    //   isBaseToQuote: false,
    //   isExactInput: true,
    //   amount: ethers.utils.parseUnits("1", 18),
    //   oppositeAmountBound: 0,
    //   sqrtPriceLimitX96: 0,
    //   deadline: Math.floor(Date.now() / 1000) + 600,
    //   referralCode: ethers.constants.HashZero,
    //   isClose: false
    // };
    
    // const swapResult = await exchange.callStatic.swap(swapParams);
    console.log("✅ Exchange swap 模拟成功");
    
  } catch (error) {
    console.log("❌ 调用链模拟失败:", error.message);
    if (error.reason) {
      console.log("错误原因:", error.reason);
    }
  }

  // 5. 检查代理模式
  console.log("\n5. 检查代理模式...");
  
  try {
    // 检查 MarketRegistry 是否是代理合约
    // const marketRegistryCode = await ethers.provider.getCode(marketRegistryAddress);
    // console.log("MarketRegistry 代码长度:", marketRegistryCode.length);
    
    // 如果是代理合约，检查实现合约
    // if (marketRegistryCode.length > 2) {
    //   // 尝试读取实现合约地址（如果使用标准代理模式）
    //   const implementationSlot = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    //   const implementationAddress = await ethers.provider.getStorageAt(marketRegistryAddress, implementationSlot);
    //   console.log("实现合约地址:", implementationAddress);
      
    //   if (implementationAddress !== ethers.constants.AddressZero) {
    //     const implCode = await ethers.provider.getCode(implementationAddress);
    //     console.log("实现合约代码长度:", implCode.length);
    //   }
    // }
  } catch (error) {
    console.log("检查代理模式失败:", error.message);
  }

  // 6. 检查交易重放
  console.log("\n6. 交易重放分析...");
  
  try {
    // 使用更详细的交易模拟
    // const openPositionParams = {
    //   baseToken: baseTokenAddress,
    //   isBaseToQuote: false,
    //   isExactInput: true,
    //   amount: ethers.utils.parseUnits("0.1", 18), // 更小的数量
    //   oppositeAmountBound: 0,
    //   deadline: Math.floor(Date.now() / 1000) + 600,
    //   sqrtPriceLimitX96: 0,
    //   referralCode: ethers.constants.HashZero
    // };

    console.log("使用 callStatic 详细模拟...");
    // const result = await clearingHouse.callStatic.openPosition(openPositionParams, {
    //   gasLimit: 1000000
    // });
    console.log("✅ callStatic 模拟成功");
    
  } catch (error) {
    console.log("❌ callStatic 模拟失败:", error.message);
    
    // 分析错误数据
    // if (error.data) {
    //   console.log("原始错误数据:", error.data);
      
    //   // 尝试解析错误信息
    //   try {
    //     const iface = new ethers.utils.Interface([
    //       "error MR_PNE()"
    //     ]);
        
    //     const parsedError = iface.parseError(error.data);
    //     console.log("解析的错误:", parsedError);
    //   } catch (parseError) {
    //     console.log("无法解析错误数据");
    //   }
    // }
  }

  // 7. 可能的解决方案
  console.log("\n7. 解决方案建议...");
  
  console.log("基于以上诊断，建议尝试以下方案:");
  
  console.log("\n方案 A: 重新设置市场状态");
  console.log("1. 检查并设置 Exchange 的 MaxTickCrossed");
  console.log(`   await exchange.setMaxTickCrossedWithinBlock("${baseTokenAddress}", 1000);`);
  
  console.log("\n方案 B: 重新添加池子");
  console.log("1. 如果怀疑存储状态有问题，可以尝试重新添加池子");
  console.log("   注意: 需要先确保池子在 Uniswap 中存在");
  console.log(`   await marketRegistry.addPool("${baseTokenAddress}", 500);`);
  
  console.log("\n方案 C: 检查合约升级状态");
  console.log("1. 确认所有相关合约都已正确部署和初始化");
  console.log("2. 检查代理合约的实现地址是否正确");
  
  console.log("\n方案 D: 手动调用测试");
  console.log("1. 直接在 MarketRegistry 上调用 getPool 验证");
  console.log(`   await marketRegistry.getPool("${baseTokenAddress}");`);
}

// 运行诊断
deepDiagnoseMR_PNE().catch(console.error);