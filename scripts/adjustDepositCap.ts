// scripts/adjustDepositCap.ts
import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";
async function main() {
  console.log("=== 调整存款上限 ===");

  const [signer] = await ethers.getSigners();
  const clearingHouseConfigAddress = "0x9199f6848b189024807987Ee6Ab45EC905856B52";

  const ClearingHouseConfig = await ethers.getContractFactory("ClearingHouseConfig");
  const clearingHouseConfig = ClearingHouseConfig.attach(clearingHouseConfigAddress);

  // 检查当前上限
  const currentCap = await clearingHouseConfig.getSettlementTokenBalanceCap();
  console.log("当前结算代币余额上限:", currentCap);

  const USDC_DECIMALS = 6;
  // const UNI_FEE_TIER = 10000; // 1%
  const SETTLEMENT_TOKEN_BALANCE_CAP = parseUnits("1000000000", USDC_DECIMALS);
  console.log("目标结算代币余额上限:", SETTLEMENT_TOKEN_BALANCE_CAP);
  // 检查是否有权限修改
  try {
    const owner = await clearingHouseConfig.owner();
    console.log("合约所有者:", owner);
    console.log("当前调用者:", signer.address);

    if (owner.toLowerCase() === signer.address.toLowerCase()) {
      // 有权限，可以修改上限
      const newCap = ethers.utils.parseEther("1000000000");
      console.log(`设置新的上限: ${ethers.utils.formatEther(newCap)}`);

      const tx = await clearingHouseConfig.setSettlementTokenBalanceCap(SETTLEMENT_TOKEN_BALANCE_CAP);
      await tx.wait();
      
      console.log("✅ 存款上限更新成功");
      
      // 验证更新
      const updatedCap = await clearingHouseConfig.getSettlementTokenBalanceCap();
      console.log("更新后的上限:", updatedCap);
    } else {
      console.log("❌ 你不是合约所有者，无法修改上限");
    //   await suggestAlternativeSolutions(currentCap);
    }
  } catch (error) {
    console.log("修改上限失败:", error.message);
    // await suggestAlternativeSolutions(currentCap);
  }
}

// async function suggestAlternativeSolutions(currentCap: ethers.BigNumber) {
//   console.log("\n=== 替代解决方案 ===");
  
//   console.log("1. 分批存款:");
//   console.log("   - 将大额存款分成多笔小额存款");
//   console.log("   - 每次存款金额小于剩余额度");
  
//   console.log("2. 联系管理员调整上限:");
//   console.log("   当前上限:", ethers.utils.formatEther(currentCap));
//   console.log("   需要联系合约所有者调整 SettlementTokenBalanceCap");
  
//   console.log("3. 等待其他用户提款:");
//   console.log("   - 当其他用户从 Vault 提款时，会释放额度");
  
//   console.log("4. 检查其他 Vault:");
//   console.log("   - 如果系统有多个 Vault，可以尝试其他 Vault");
// }

main().catch(console.error);