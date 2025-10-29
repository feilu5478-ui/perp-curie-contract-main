// import { ethers } from "hardhat";

// async function getCurrentTickAndSetRange(clearingHouse: any, baseToken: string) {
//   try {
//     // 获取 Exchange 合约
//     const exchangeAddress = await clearingHouse.getExchange();
//     const Exchange = await ethers.getContractFactory("Exchange");
//     const exchange = Exchange.attach(exchangeAddress);
    
//     // 获取 MarketRegistry
//     const marketRegistryAddress = await exchange.getMarketRegistry();
//     const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
//     const marketRegistry = MarketRegistry.attach(marketRegistryAddress);
    
//     // 获取市场信息
//     const marketInfo = await marketRegistry.getMarketInfo(baseToken);
//     const poolAddress = marketInfo.pool;
    
//     // 获取当前价格 tick
//     const UniswapV3Pool = await ethers.getContractFactory("UniswapV3Pool");
//     const pool = UniswapV3Pool.attach(poolAddress);
//     const slot0 = await pool.slot0();
//     const currentTick = slot0.tick;
    
//     console.log("当前价格 tick:", currentTick);
    
//     // 设置一个较宽的价格范围来确保包含当前价格
//     // 使用较大的范围 (±1000 ticks) 来避免价格点差问题
//     const tickSpacing = 10; // Uniswap V3 通常的 tick 间距
//     const range = 1000; // 较大的范围
    
//     // 计算符合 tickSpacing 的边界
//     const lowerTick = Math.floor((currentTick - range) / tickSpacing) * tickSpacing;
//     const upperTick = Math.floor((currentTick + range) / tickSpacing) * tickSpacing;
    
//     console.log("设置的流动性范围:");
//     console.log("Lower Tick:", lowerTick);
//     console.log("Upper Tick:", upperTick);
//     console.log("范围宽度:", upperTick - lowerTick, "ticks");
    
//     return { lowerTick, upperTick, currentTick };
//   } catch (error) {
//     console.error("获取价格信息失败:", error);
//     // 如果获取失败，使用一个很宽的范围作为后备方案
//     console.log("使用默认的宽范围");
//     return { lowerTick: -887220, upperTick: 887220, currentTick: 0 };
//   }
// }

// async function main() {
//   const [signer] = await ethers.getSigners();
//   const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
//   const baseToken = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e"; // vETH
//   const quoteToken = "0x945EC0dDA06834dD592Ad246e07B47f025B8611E"; // vUSDC

//   const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
//   const clearingHouse = ClearingHouse.attach(clearingHouseAddress).connect(signer);

//   console.log("操作账户:", signer.address);
//   console.log("开始添加流动性...");

//   try {
//     // 1. 获取当前价格并设置合理的 tick 范围
//     const { lowerTick, upperTick, currentTick } = await getCurrentTickAndSetRange(clearingHouse, baseToken);
    
//     // 2. 设置流动性参数 - 使用较小的金额进行测试
//     const baseAmount = ethers.utils.parseUnits("0.1", 18); // 0.1 vETH (减少金额)
//     const quoteAmount = ethers.utils.parseUnits("200", 18); // 200 vUSDC (减少金额)
    
//     // 设置较小的最小接受值，提高成功率
//     const minBase = baseAmount.mul(80).div(100); // 允许20%滑点
//     const minQuote = quoteAmount.mul(80).div(100);
    
//     const deadline = Math.floor(Date.now() / 1000) + 1200; // 20分钟截止时间

//     const params = {
//       baseToken: baseToken,
//       base: baseAmount,
//       quote: quoteAmount,
//       lowerTick: lowerTick,
//       upperTick: upperTick,
//       minBase: minBase,
//       minQuote: minQuote,
//       useTakerBalance: false,
//       deadline: deadline
//     };

//     console.log("添加流动性参数:");
//     console.log("- Base Token:", baseToken);
//     console.log("- Base Amount:", ethers.utils.formatUnits(baseAmount, 18), "vETH");
//     console.log("- Quote Amount:", ethers.utils.formatUnits(quoteAmount, 18), "vUSDC");
//     console.log("- Tick Range:", `[${lowerTick}, ${upperTick}]`);
//     console.log("- Min Base:", ethers.utils.formatUnits(minBase, 18));
//     console.log("- Min Quote:", ethers.utils.formatUnits(minQuote, 18));

//     // 3. 执行添加流动性
//     console.log("发送交易...");
//     const tx = await clearingHouse.addLiquidity(params, { 
//       gasLimit: 500000, // 适当的 gas limit
//       gasPrice: ethers.utils.parseUnits("10", "gwei") // 设置合适的 gas price
//     });
    
//     console.log("交易哈希:", tx.hash);
//     console.log("等待交易确认...");
    
//     const receipt = await tx.wait();
//     console.log("✓ 交易确认，区块:", receipt.blockNumber);

//     // 4. 解析结果
//     const liquidityChangedEvent = receipt.events?.find((e: any) => e.event === 'LiquidityChanged');
//     if (liquidityChangedEvent) {
//       console.log("✓ 流动性添加成功!");
//       console.log("添加结果:");
//       console.log("- Base:", ethers.utils.formatUnits(liquidityChangedEvent.args.base.toString(), 18));
//       console.log("- Quote:", ethers.utils.formatUnits(liquidityChangedEvent.args.quote.toString(), 18));
//       console.log("- Liquidity:", liquidityChangedEvent.args.liquidity.toString());
//       console.log("- Fee:", ethers.utils.formatUnits(liquidityChangedEvent.args.quoteFee.toString(), 18));
//     } else {
//       console.log("⚠ 未找到 LiquidityChanged 事件，但交易成功");
//     }

//   } catch (error: any) {
//     console.error("❌ 添加流动性失败:");
    
//     if (error.message) {
//       console.error("错误信息:", error.message);
//     }
    
//     if (error.reason) {
//       console.error("失败原因:", error.reason);
//     }
    
//     if (error.code) {
//       console.error("错误代码:", error.code);
//     }
    
//     // 提供一些调试建议
//     console.log("\n调试建议:");
//     console.log("1. 检查 baseToken 地址是否正确");
//     console.log("2. 确保账户有足够的代币余额");
//     console.log("3. 尝试更小的流动性金额");
//     console.log("4. 检查网络状态和 gas 设置");
//   }
// }

// main().catch(error => {
//   console.error("脚本执行失败:", error);
//   process.exit(1);
// });

import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
  const baseToken = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e"; // vETH
  const quoteToken = "0x945EC0dDA06834dD592Ad246e07B47f025B8611E"; // vUSDC

  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(clearingHouseAddress).connect(signer);

  // 计算 tick（假设价格范围 1500-2500 USDC/ETH）
  const lowerTick = -887220; // 调整为实际 tick (使用 Uniswap tick spacing)
  const upperTick = 887220;
  const baseAmount = ethers.utils.parseUnits("1", 18); // 1 vETH
  const quoteAmount = ethers.utils.parseUnits("4017", 18); // 2000 vUSDC
  const minBase = 0; // 最小预期
  const minQuote = 0;
  const deadline = Math.floor(Date.now() / 1000) + 3600;

  const params = {
    baseToken: baseToken,
    base: baseAmount,
    quote: quoteAmount,
    lowerTick: lowerTick,
    upperTick: upperTick,
    minBase: minBase,
    minQuote: minQuote,
    useTakerBalance: false,
    deadline: deadline
  };

  console.log("添加流动性参数:", params);

  try {
    const tx = await clearingHouse.addLiquidity(params, { gasLimit: 1000000 });
    console.log("交易哈希:", tx.hash);
    const receipt = await tx.wait();
    console.log("交易确认，区块:", receipt.blockNumber);

    // 解析响应
    const response = receipt.events?.find(e => e.event === 'LiquidityChanged')?.args;
    console.log("添加结果:", {
      base: response?.base.toString(),
      quote: response?.quote.toString(),
      liquidity: response?.liquidity.toString(),
      fee: response?.quoteFee.toString()
    });
  } catch (error) {
    console.error("添加流动性失败:", error);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});