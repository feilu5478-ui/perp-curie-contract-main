import { ethers } from "hardhat";

// 获取当前池子价格并计算合理 tick 范围
async function calculateReasonableTicks(baseToken: string) {
  const [deployer] = await ethers.getSigners();
  
  // 获取 Exchange 合约
  const clearingHouseAddress = "0xC6dAc2934c24789CB0a1bDa7118a0Bc8367d8Daf";
  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(clearingHouseAddress);
  
  const exchangeAddress = await clearingHouse.getExchange();
  const Exchange = await ethers.getContractFactory("Exchange");
  const exchange = Exchange.attach(exchangeAddress);
  
  // 获取当前价格 tick
  const marketRegistryAddress = await exchange.getMarketRegistry();
  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);
  
  const marketInfo = await marketRegistry.getMarketInfo(baseToken);
  const poolAddress = marketInfo.pool;
  
  // 获取 Uniswap V3 池子当前状态
  const UniswapV3Pool = await ethers.getContractFactory("UniswapV3Pool");
  const pool = UniswapV3Pool.attach(poolAddress);
  
  const slot0 = await pool.slot0();
  const currentTick = slot0.tick;
  const currentSqrtPriceX96 = slot0.sqrtPriceX96;
  
  console.log("当前池子状态:");
  console.log("- 当前 tick:", currentTick);
  console.log("- 当前 sqrtPriceX96:", currentSqrtPriceX96.toString());
  
  // 计算当前价格
  const currentPrice = Math.pow(1.0001, currentTick);
  console.log("- 当前价格:", currentPrice.toFixed(4));
  
  // 获取 tick spacing（根据费率）
  const fee = await pool.fee();
  const tickSpacing = getTickSpacingByFee(fee);
  console.log("- 费率:", fee);
  console.log("- Tick Spacing:", tickSpacing);
  
//   return calculateTicksBasedOnStrategy(currentTick, tickSpacing, "MODERATE");
}

// 根据费率获取 tick spacing
function getTickSpacingByFee(fee: number): number {
  const feeToTickSpacing: { [key: number]: number } = {
    100: 1,     // 0.01%
    500: 10,    // 0.05% 
    3000: 60,   // 0.3%
    10000: 200  // 1%
  };
  
  return feeToTickSpacing[fee] || 10; // 默认 60
}

calculateReasonableTicks("0x57e6345d14a30A554806b254D161A1694eb3bD83").catch((error) => {
  console.error("计算合理 tick 范围失败:", error);
});