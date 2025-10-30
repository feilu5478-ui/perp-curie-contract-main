// scripts/addPoolToMarketRegistry.ts
import { ethers } from "hardhat";

async function main() {
  console.log("=== 添加池子到 MarketRegistry ===");

  const [signer] = await ethers.getSigners();
  
  // 合约地址
  const marketRegistryAddress = "0xA642F92c7Cdc362e376487D0519d0752Ee6CD183";
  const baseToken = "0x57e6345d14a30A554806b254D161A1694eb3bD83";

  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);

  // 添加池子
  console.log("添加池子...");
  await addPool(marketRegistry, baseToken, signer.address);

  console.log("✅ 池子添加完成!");
}

async function addPool(marketRegistry: any, baseToken: string, userAddress: string) {
  const [signer] = await ethers.getSigners();
  
  try {
    // 检查权限
    const owner = await marketRegistry.owner();
    console.log("MarketRegistry 所有者:", owner);
    console.log("当前调用者:", signer.address);

    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("❌ 你不是合约所有者，无法添加池子");
      return false;
    }

    // 添加池子
    const feeRatio = 500; // 0.05%
    console.log(`添加池子: BaseToken=${baseToken}, FeeRatio=${feeRatio}`);

    const tx = await marketRegistry.addPool(baseToken, feeRatio, { gasLimit: 500000 });
    
    console.log("添加池子交易已发送:", tx.hash);
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log("✅ 池子添加成功");
      
      // 获取池子地址
      const poolAddress = await marketRegistry.getPool(baseToken);
      console.log("新池子地址:", poolAddress);
      
      return true;
    } else {
      console.log("❌ 池子添加失败");
      return false;
    }

  } catch (error) {
    console.log("添加池子失败:", error.message);
    
    if (error.reason) {
      console.log("错误原因:", error.reason);
    }
    
    if (error.data) {
      console.log("错误数据:", error.data);
    }
    
    return false;
  }
}

main().catch(console.error);