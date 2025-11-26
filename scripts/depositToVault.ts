// scripts/depositToVault.ts
import { ethers } from "hardhat";

async function main() {
  console.log("开始向 Vault 合约存款...");

  // 合约地址 - 替换为实际地址
  const vaultAddress = "0xf12285fF19c58bD751dA4f604ebefc0C9Df00A10"; // 你的 Vault 合约地址
  const quoteTokenAddress = "0xE3E009ADb11434B3fb9acfb5Cb8a30cc94E52cdE"; // QuoteToken 地址
  
  // 存款金额 - 根据你的需求调整
  const depositAmount = ethers.utils.parseUnits("100000", 18); // 存入 1000 个 QuoteToken

  // 获取签名器
  const [signer] = await ethers.getSigners();
  console.log("存款人地址:", signer.address);
  console.log("存款金额:", ethers.utils.formatEther(depositAmount), "QuoteToken");

  // 获取 Vault 合约实例
  const Vault = await ethers.getContractFactory("Vault");
  const vault = Vault.attach(vaultAddress);

  // 获取 QuoteToken 合约实例
  const QuoteToken = await ethers.getContractFactory("QuoteToken");
  const quoteToken = QuoteToken.attach(quoteTokenAddress);

  // 1. 检查当前余额
  console.log("1. 检查余额...");
  const currentBalance = await quoteToken.balanceOf(signer.address);
  console.log("当前 QuoteToken 余额:", ethers.utils.formatEther(currentBalance));

  if (currentBalance.lt(depositAmount)) {
    console.log("❌ 余额不足，无法存款");
    return;
  }

  // 2. 授权 Vault 合约使用代币
  console.log("2. 授权 Vault 合约使用代币...");
  try {
    const approveTx = await quoteToken.approve(vaultAddress, depositAmount);
    await approveTx.wait();
    console.log("✅ 授权成功");
  } catch (error) {
    console.log("⚠️  授权可能已存在，继续执行...");
  }

  // 3. 执行存款
  console.log("3. 执行存款...");
  try {
    const depositTx = await vault.deposit(quoteTokenAddress, depositAmount, {gasLimit: 500000});
    console.log("存款交易已发送，哈希:", depositTx.hash);
    
    const receipt = await depositTx.wait();
    console.log("✅ 存款成功，区块:", receipt.blockNumber);
    
    // 4. 验证存款结果
    console.log("4. 验证存款结果...");
    const vaultBalance = await vault.getBalanceByToken(signer.address, quoteTokenAddress);
    console.log("Vault 中的余额:", ethers.utils.formatEther(vaultBalance.toString()));
    
    const freeCollateral = await vault.getFreeCollateral(signer.address);
    console.log("可用抵押品:", ethers.utils.formatEther(freeCollateral.toString()));
    
    const accountValue = await vault.getAccountValue(signer.address);
    console.log("账户价值:", ethers.utils.formatEther(accountValue.toString()));
    
  } catch (error) {
    console.error("❌ 存款失败:", error);
    
    // 解析可能的错误
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