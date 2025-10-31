// initialize-oracle.ts
import { ethers } from "hardhat";

async function initializeOracle() {
  const [deployer] = await ethers.getSigners();

  // Uniswap V3 Pool 地址
  const poolAddress = "0xc23d25eab268fd2099f5199a0c3f22393ccf9a4f";
  
  const IUniswapV3Pool = await ethers.getContractFactory("UniswapV3Pool");
  const pool = IUniswapV3Pool.attach(poolAddress);
  
  console.log("初始化Oracle观察点...");
  
  // 增加观察点基数，创建初始观察点
  const tx = await pool.increaseObservationCardinalityNext(2, {
    gasLimit: 200000
  });
  
  await tx.wait();
  console.log("Oracle观察点初始化完成！");
}

initializeOracle()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("初始化失败:", error);
    process.exit(1);
  });