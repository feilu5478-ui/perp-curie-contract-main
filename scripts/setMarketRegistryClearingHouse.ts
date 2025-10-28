// scripts/setMarketRegistryClearingHouse.ts
import { ethers } from "hardhat";

async function setMarketRegistryClearingHouse() {
  console.log("=== 设置 MarketRegistry 的 ClearingHouse 地址 ===");

  const [deployer] = await ethers.getSigners();
  
  const marketRegistryAddress = "0x91F83B0351b89194366a9b6986EE7887e6F7A0c5";
  const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";

  const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
  const marketRegistry = MarketRegistry.attach(marketRegistryAddress);

  console.log("部署者地址:", deployer.address);
  console.log("MarketRegistry 地址:", marketRegistryAddress);
  console.log("ClearingHouse 地址:", clearingHouseAddress);

  // 1. 检查当前状态
  console.log("\n1. 检查当前状态...");
  
  const currentClearingHouse = await marketRegistry.getClearingHouse();
  const owner = await marketRegistry.owner();
  
  console.log("当前 ClearingHouse 地址:", currentClearingHouse);
  console.log("MarketRegistry 所有者:", owner);
  console.log("部署者是否是所有者:", owner.toLowerCase() === deployer.address.toLowerCase());

  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    console.log("❌ 部署者不是 MarketRegistry 的所有者，无法设置 ClearingHouse");
    return false;
  }

  // 2. 设置 ClearingHouse 地址
  console.log("\n2. 设置 ClearingHouse 地址...");
  
  try {
    const tx = await marketRegistry.setClearingHouse(clearingHouseAddress);
    console.log("交易已发送:", tx.hash);
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log("✅ ClearingHouse 地址设置成功");
      
      // 验证设置
      const newClearingHouse = await marketRegistry.getClearingHouse();
      console.log("新的 ClearingHouse 地址:", newClearingHouse);
      
      return true;
    } else {
      console.log("❌ 设置失败");
      return false;
    }
  } catch (error) {
    console.log("设置失败:", error.message);
    
    if (error.reason) {
      console.log("错误原因:", error.reason);
    }
    
    return false;
  }
}

setMarketRegistryClearingHouse().catch(console.error);