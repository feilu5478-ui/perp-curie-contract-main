import { ethers } from "hardhat";

async function main() {
  console.log("开始调用 ClearingHouse openPosition 函数...");

  // 合约地址 - 替换为实际部署的 ClearingHouse 地址
  const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
  
  // 基础代币地址
  const baseToken = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
  
  // 获取签名器
  const [signer] = await ethers.getSigners();
  console.log("调用者地址:", signer.address);

  // 获取 ClearingHouse 合约实例
  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(clearingHouseAddress);

  // 设置开仓参数
  const openPositionParams = {
    baseToken: baseToken,
    isBaseToQuote: false, // false: 做多 (quoteToBase), true: 做空 (baseToQuote)
    isExactInput: true,   // true: 精确输入, false: 精确输出
    amount: ethers.utils.parseUnits("100", 18), // 交易数量，根据实际情况调整
    oppositeAmountBound: 0, // 对边数量边界，0表示不限制
    deadline: Math.floor(Date.now() / 1000) + 60 * 10, // 10分钟后过期
    sqrtPriceLimitX96: 0, // 不设置价格限制
    referralCode: ethers.constants.HashZero // 推荐码，没有则为0
  };

  console.log("开仓参数:", {
    baseToken: openPositionParams.baseToken,
    isBaseToQuote: openPositionParams.isBaseToQuote,
    isExactInput: openPositionParams.isExactInput,
    amount: openPositionParams.amount.toString(),
    oppositeAmountBound: openPositionParams.oppositeAmountBound,
    deadline: openPositionParams.deadline,
    sqrtPriceLimitX96: openPositionParams.sqrtPriceLimitX96,
    referralCode: openPositionParams.referralCode
  });

  try {
    // 调用 openPosition 函数
    console.log("发送开仓交易...");
    const tx = await clearingHouse.connect(signer).openPosition(openPositionParams, { gasLimit: 500000 });
    
    console.log("交易已发送，哈希:", tx.hash);
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log("交易已确认，区块:", receipt.blockNumber);
    
    // 解析事件日志获取返回值
    const base = receipt.events?.find((e: any) => e.event === 'PositionChanged')?.args?.exchangedPositionSize;
    const quote = receipt.events?.find((e: any) => e.event === 'PositionChanged')?.args?.exchangedPositionNotional;
    
    console.log("开仓结果:");
    console.log("Base 数量:", base?.toString());
    console.log("Quote 数量:", quote?.toString());
    
  } catch (error) {
    console.error("开仓失败:", error);
    
    // 解析可能的错误信息
    if (error.data) {
      console.log("错误数据:", error.data);
    }
    if (error.reason) {
      console.log("错误原因:", error.reason);
    }
  }
}

// 错误处理
main().catch((error) => {
  console.error("脚本执行失败:", error);
  process.exit(1);
});