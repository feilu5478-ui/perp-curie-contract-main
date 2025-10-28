// 添加流动性脚本
import { ethers } from "hardhat";

async function addLiquidityFirst() {
    const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
    const baseTokenAddress = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
    
    const [signer] = await ethers.getSigners();
    const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
    const clearingHouse = ClearingHouse.attach(clearingHouseAddress);
    
    // 获取当前价格区间
    // const currentTick = await getCurrentTick(baseTokenAddress);
    // const tickSpacing = 10; // 通常为 60，取决于池子的 fee tier
    
    // 在当前价格上下设置流动性区间
    // const lowerTick = currentTick - tickSpacing * 10;
    // const upperTick = currentTick + tickSpacing * 10;
    
    const addLiquidityParams = {
        baseToken: baseTokenAddress,
        base: ethers.utils.parseUnits("1000", 18), // 提供 base token 流动性
        quote: ethers.utils.parseUnits("1000", 18), // 提供 quote token 流动性
        lowerTick: -887220,
        upperTick: 887220,
        minBase: 0,
        minQuote: 0,
        useTakerBalance: false,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10
    };
    
    console.log("添加流动性...");
    const tx = await clearingHouse.connect(signer).addLiquidity(addLiquidityParams, { gasLimit: 800000 });
    const receipt = await tx.wait();
    
    console.log("✅ 流动性添加成功!");
    console.log("交易哈希:", receipt.transactionHash);
}

// async function getCurrentTick(baseTokenAddress: string): Promise<number> {
//     // 通过 MarketRegistry 获取池子地址，然后查询当前 tick
//     const marketRegistryAddress = "0x91F83B0351b89194366a9b6986EE7887e6F7A0c5";
//     const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
//     const marketRegistry = MarketRegistry.attach(marketRegistryAddress);
    
//     const poolAddress = await marketRegistry.getPool(baseTokenAddress);
//     const Pool = await ethers.getContractFactory("UniswapV3Pool");
//     const pool = Pool.attach(poolAddress);
    
//     const slot0 = await pool.slot0();
//     return slot0.tick;
// }

addLiquidityFirst().catch(console.error);