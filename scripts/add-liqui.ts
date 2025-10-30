// 添加流动性脚本
import { ethers } from "hardhat";

async function addLiquidityFirst() {
    const clearingHouseAddress = "0xC6dAc2934c24789CB0a1bDa7118a0Bc8367d8Daf";
    const baseTokenAddress = "0x57e6345d14a30A554806b254D161A1694eb3bD83";
    
    const [signer] = await ethers.getSigners();
    const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
    const clearingHouse = ClearingHouse.attach(clearingHouseAddress);
    
    const addLiquidityParams = {
        baseToken: baseTokenAddress,
        base: ethers.utils.parseUnits("20", 18), // 提供 base token 流动性
        quote: ethers.utils.parseUnits("80000", 18), // 提供 quote token 流动性
        lowerTick: 81940,
        upperTick: 83940,
        minBase: 0,
        minQuote: 0,
        useTakerBalance: false,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10
    };
    
    console.log("添加流动性...");
    const tx = await clearingHouse.addLiquidity(addLiquidityParams, { gasLimit: 1500000 });
    const receipt = await tx.wait();
    
    console.log("✅ 流动性添加成功!");
    console.log("交易哈希:", receipt.transactionHash);
}

addLiquidityFirst().catch(console.error);

