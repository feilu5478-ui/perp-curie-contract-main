// fix-oracle-config.ts
import { ethers } from "hardhat";

async function fixOracleConfig() {
  const [deployer] = await ethers.getSigners();

  // Uniswap V3 Pool 地址
  const poolAddress = "0x2d7ad7a7b7021e681b697cdf955169c710c95cb1";
  
  const IUniswapV3Pool = await ethers.getContractFactory("UniswapV3Pool");
  const pool = IUniswapV3Pool.attach(poolAddress);
  
  console.log("增加Oracle观察点基数...");
  
  // 增加到100个观察点
//   const tx = await pool.increaseObservationCardinalityNext(300, {
//     gasLimit: 15000000
//   });
  
//   await tx.wait();
    const slot0 = await pool.slot0();
    console.log(`当前基数: ${slot0.observationCardinality}`);
    console.log(`目标基数: ${slot0.observationCardinalityNext}`);
    console.log("Oracle观察点基数增加到100完成！");

  // 同时建议更新ClearingHouseConfig的时间间隔
//   const ClearingHouseConfig = await ethers.getContractFactory("ClearingHouseConfig");
//   const config = ClearingHouseConfig.attach("您的ClearingHouseConfig地址");
  
//   // 设置合理的时间间隔
//   console.log("更新时间间隔配置...");
//   await config.setTwapInterval(900); // 15分钟
//   await config.setMarkPriceMarketTwapInterval(900); // 15分钟
//   await config.setMarkPricePremiumInterval(900); // 15分钟
  
  console.log("配置更新完成！");
}

fixOracleConfig()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("修复失败:", error);
    process.exit(1);
  });