// scripts/checkDepositCap.ts
import { ethers } from "hardhat";

async function main() {
  console.log("=== 检查存款上限 ===");

  const [signer] = await ethers.getSigners();
  
  // 合约地址
  const vaultAddress = "0x42F2202120Af3217868fdB356F98d87c3ED0c123";
  const quoteTokenAddress = "0xB736Ce12ee74345600aeDFb9c27B6A8822D4C892";
  const clearingHouseConfigAddress = "0x9199f6848b189024807987Ee6Ab45EC905856B52";

  const Vault = await ethers.getContractFactory("Vault");
  const vault = Vault.attach(vaultAddress);

  const ClearingHouseConfig = await ethers.getContractFactory("ClearingHouseConfig");
  const clearingHouseConfig = ClearingHouseConfig.attach(clearingHouseConfigAddress);

  const QuoteToken = await ethers.getContractFactory("QuoteToken");
  const quoteToken = QuoteToken.attach(quoteTokenAddress);

  // 1. 检查存款上限
  console.log("1. 检查存款上限...");
  await checkDepositCap(vault, clearingHouseConfig, quoteToken);

  // 2. 检查当前余额
  console.log("2. 检查当前余额...");
  await checkCurrentBalances(vault, quoteToken);

  // 3. 测试小金额存款
  console.log("3. 测试小金额存款...");
  await testSmallDeposit(vault, quoteToken);
}

async function checkDepositCap(vault: any, clearingHouseConfig: any, quoteToken: any) {
  try {
    // 获取结算代币余额上限
    const settlementTokenBalanceCap = await clearingHouseConfig.getSettlementTokenBalanceCap();
    console.log("结算代币余额上限:", ethers.utils.formatEther(settlementTokenBalanceCap));

    // 获取 Vault 中当前的结算代币余额
    const vaultTokenBalance = await quoteToken.balanceOf(vault.address);
    console.log("Vault 中当前结算代币余额:", ethers.utils.formatEther(vaultTokenBalance));

    // 计算剩余可存款额度
    const remainingCapacity = settlementTokenBalanceCap.sub(vaultTokenBalance);
    console.log("剩余可存款额度:", ethers.utils.formatEther(remainingCapacity));

    // 检查是否超过上限
    if (vaultTokenBalance.gte(settlementTokenBalanceCap)) {
      console.log("❌ Vault 余额已达到上限，无法存款");
    } else if (remainingCapacity.lt(ethers.utils.parseEther("1"))) {
      console.log("⚠️  剩余额度很小，可能无法存款大金额");
    } else {
      console.log("✅ 仍有充足存款额度");
    }

    return remainingCapacity;

  } catch (error) {
    console.log("检查存款上限时出错:", error.message);
    return ethers.BigNumber.from(0);
  }
}

async function checkCurrentBalances(vault: any, quoteToken: any) {
  const [signer] = await ethers.getSigners();

  try {
    // 检查用户在 Vault 中的余额
    const userVaultBalance = await vault.getBalanceByToken(signer.address, quoteToken.address);
    console.log("用户在 Vault 中的余额:", ethers.utils.formatEther(userVaultBalance.toString()));

    // 检查用户钱包余额
    const userWalletBalance = await quoteToken.balanceOf(signer.address);
    console.log("用户钱包余额:", ethers.utils.formatEther(userWalletBalance));

    // 检查授权额度
    const allowance = await quoteToken.allowance(signer.address, vault.address);
    console.log("授权额度:", ethers.utils.formatEther(allowance));

  } catch (error) {
    console.log("检查余额时出错:", error.message);
  }
}

async function testSmallDeposit(vault: any, quoteToken: any) {
  const [signer] = await ethers.getSigners();
  
  // 尝试非常小的金额
  const testAmount = ethers.utils.parseEther("0.001"); // 0.001 个代币

  console.log(`尝试存款 ${ethers.utils.formatEther(testAmount)} 代币...`);

  try {
    // 检查余额是否足够
    const balance = await quoteToken.balanceOf(signer.address);
    if (balance.lt(testAmount)) {
      console.log("❌ 余额不足进行测试");
      return;
    }

    // 授权
    const approveTx = await quoteToken.approve(vault.address, testAmount, {
      gasLimit: 100000
    });
    await approveTx.wait();

    // 存款
    const depositTx = await vault.deposit(quoteToken.address, testAmount, {
      gasLimit: 300000
    });
    
    console.log("测试存款交易已发送:", depositTx.hash);
    const receipt = await depositTx.wait();
    
    if (receipt.status === 1) {
      console.log("✅ 小金额存款成功!");
      console.log("说明问题确实与存款金额或上限有关");
      
      // 检查存款后的余额
      const newBalance = await vault.getBalanceByToken(signer.address, quoteToken.address);
      console.log("存款后用户在 Vault 中的余额:", ethers.utils.formatEther(newBalance.toString()));
    } else {
      console.log("❌ 小金额存款也失败");
    }

  } catch (error) {
    console.log("测试存款失败:", error.message);
    
    // 提供详细的错误信息
    if (error.reason) {
      console.log("错误原因:", error.reason);
    }
    if (error.data) {
      console.log("错误数据:", error.data);
      await decodeErrorData(error.data);
    }
  }
}

async function decodeErrorData(errorData: string) {
  console.log("尝试解码错误数据...");
  
  const errorInterface = new ethers.utils.Interface([
    "error V_ZA()", // Zero amount
    "error V_OSCT()", // Only settlement or collateral token
    "error V_GTSTBC()", // Greater than settlement token balance cap
    "error V_GTDC()", // Greater than deposit cap
    "error V_IBA()", // Inconsistent balance amount
    "error VT_NW()" // Not whitelisted
  ]);

  try {
    const decodedError = errorInterface.parseError(errorData);
    console.log("解码后的错误:", decodedError.name);
    
    switch(decodedError.name) {
      case "V_GTSTBC":
        console.log("❌ 错误原因: 超过结算代币余额上限");
        break;
      case "V_ZA":
        console.log("❌ 错误原因: 存款金额为零");
        break;
      case "V_OSCT":
        console.log("❌ 错误原因: 代币不是结算代币或抵押代币");
        break;
      case "VT_NW":
        console.log("❌ 错误原因: 不在白名单中");
        break;
      default:
        console.log("❌ 错误原因: 其他错误");
    }
  } catch (decodeError) {
    console.log("无法解码错误数据");
  }
}

main().catch(console.error);