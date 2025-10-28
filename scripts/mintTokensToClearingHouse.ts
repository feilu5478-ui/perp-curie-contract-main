// scripts/mintTokensToClearingHouse.ts
import { ethers } from "hardhat";

async function mintTokensToClearingHouse() {
  console.log("=== 给 ClearingHouse 铸造代币 ===");

  const [deployer] = await ethers.getSigners();
  
  // 合约地址
  const baseTokenAddress = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
  const quoteTokenAddress = "0x945EC0dDA06834dD592Ad246e07B47f025B8611E"; // 你的 QuoteToken 地址
  const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";

  const BaseToken = await ethers.getContractFactory("BaseToken");
  const baseToken = BaseToken.attach(baseTokenAddress);
  
  const QuoteToken = await ethers.getContractFactory("QuoteToken");
  const quoteToken = QuoteToken.attach(quoteTokenAddress);

  console.log("BaseToken 地址:", baseTokenAddress);
  console.log("QuoteToken 地址:", quoteTokenAddress);
  console.log("ClearingHouse 地址:", clearingHouseAddress);

  // 1. 检查当前余额
  console.log("\n1. 检查当前余额...");
  
  const currentBaseBalance = await baseToken.balanceOf(clearingHouseAddress);
  const currentQuoteSupply = await quoteToken.totalSupply();
  
  console.log("ClearingHouse BaseToken 当前余额:", currentBaseBalance.toString());
  console.log("QuoteToken 当前总供应量:", currentQuoteSupply.toString());

  const maxUint256 = ethers.constants.MaxUint256;

  // 2. 给 ClearingHouse 铸造 BaseToken
  if (!currentBaseBalance.eq(maxUint256)) {
    console.log("\n2. 给 ClearingHouse 铸造 BaseToken...");
    
    // 首先确保部署者有足够的权限
    const owner = await baseToken.owner();
    console.log("BaseToken 所有者:", owner);
    
    if (owner.toLowerCase() === deployer.address.toLowerCase()) {
      await baseToken.mintMaximumTo(clearingHouseAddress, { gasLimit: 500000 });
      console.log("✅ BaseToken 铸造完成");
    } else {
      console.log("❌ 部署者不是 BaseToken 所有者，无法铸造");
      return false;
    }
  } else {
    console.log("✅ ClearingHouse 已有足够的 BaseToken 余额");
  }

  // 3. 确保 QuoteToken 总供应量是最大值
  if (!currentQuoteSupply.eq(maxUint256)) {
    console.log("\n3. 铸造 QuoteToken 最大供应量...");
    
    const quoteTokenOwner = await quoteToken.owner();
    console.log("QuoteToken 所有者:", quoteTokenOwner);
    
    if (quoteTokenOwner.toLowerCase() === deployer.address.toLowerCase()) {
      // 给部署者铸造最大供应量
      await quoteToken.mintMaximumTo(deployer.address, { gasLimit: 500000 });
      console.log("✅ QuoteToken 最大供应量铸造完成");
    } else {
      console.log("❌ 部署者不是 QuoteToken 所有者，无法铸造");
      return false;
    }
  } else {
    console.log("✅ QuoteToken 已有最大供应量");
  }

  // 4. 验证最终状态
  console.log("\n4. 验证最终状态...");
  
  const finalBaseBalance = await baseToken.balanceOf(clearingHouseAddress);
  const finalQuoteSupply = await quoteToken.totalSupply();
  
  console.log("ClearingHouse BaseToken 最终余额:", finalBaseBalance.toString());
  console.log("QuoteToken 最终总供应量:", finalQuoteSupply.toString());
  
  console.log("BaseToken 余额检查:", finalBaseBalance.eq(maxUint256) ? "✅ 通过" : "❌ 失败");
  console.log("QuoteToken 供应量检查:", finalQuoteSupply.eq(maxUint256) ? "✅ 通过" : "❌ 失败");

  return finalBaseBalance.eq(maxUint256) && finalQuoteSupply.eq(maxUint256);
}

mintTokensToClearingHouse().catch(console.error);