// close-position.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("=== 平仓脚本 ===");
  console.log("Taker:", deployer.address);

  // 合约地址
  const contractAddresses = {
    clearingHouse: "0x065536c3e366F28C4378A7939b4c540670ae4E43",
    vault: "0xa328b300dfEdf4d2062eC712D6BcC2be1c96bcD0",
    accountBalance: "0xD645C301A87255082e74052D449613d2D3A67c15",
    baseToken: "0x23383BA49A2D72fD3b617751A0efD3e7Df58Bf06",
    quoteToken: "0xE62CC8B89df2F354D4abB6e3cEFEe2d6fa091f3b",
    usdc: "0x727e7D4CaF9F7D89E8425458A2A1FbF06a35F65e",
  };

  // 获取合约实例
  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(contractAddresses.clearingHouse);

  const Vault = await ethers.getContractFactory("Vault");
  const vault = Vault.attach(contractAddresses.vault);

  const AccountBalance = await ethers.getContractFactory("AccountBalance");
  const accountBalance = AccountBalance.attach(contractAddresses.accountBalance);

  console.log("\n=== 1. 检查当前仓位状态 ===");
  
  // 检查当前仓位
  const takerPositionSize = await accountBalance.getTakerPositionSize(deployer.address, contractAddresses.baseToken);
  const takerOpenNotional = await accountBalance.getTakerOpenNotional(deployer.address, contractAddresses.baseToken);
  
  console.log("当前仓位大小:", takerPositionSize.toString());
  console.log("当前未平仓名义价值:", takerOpenNotional.toString());
  console.log("仓位方向:", takerPositionSize.gt(0) ? "多头" : "空头");

  if (takerPositionSize.eq(0)) {
    console.log("❌ 没有可平仓的仓位");
    return;
  }

  // 检查账户价值
  const accountValue = await clearingHouse.getAccountValue(deployer.address);
  console.log("当前账户价值:", accountValue.toString());

  // 检查免费抵押物
  const freeCollateral = await vault.getFreeCollateral(deployer.address);
  console.log("当前免费抵押物:", freeCollateral.toString());

  console.log("\n=== 2. 执行平仓操作 ===");
  
  // 平仓参数
  // 对于多头仓位，平仓就是卖出BaseToken换回QuoteToken
  console.log("执行平仓操作...");
  
  try {
    const closePositionTx = await clearingHouse.connect(deployer).closePosition({
      baseToken: contractAddresses.baseToken,
      sqrtPriceLimitX96: 0,           // 0 = 不限制价格
      oppositeAmountBound: 0,          // 0 = 不设置滑点保护
      deadline: ethers.constants.MaxUint256,
      referralCode: ethers.constants.HashZero
    }, { gasLimit: 1000000 });

    const closeReceipt = await closePositionTx.wait();
    console.log("✅ 平仓成功！交易哈希:", closeReceipt.transactionHash);

    // 获取平仓结果
    const positionChangedEvent = closeReceipt.events?.find((e: any) => e.event === "PositionChanged");
    if (positionChangedEvent) {
      console.log("\n平仓详情:");
      console.log("  交易对:", positionChangedEvent.args.baseToken);
      console.log("  仓位变化:", positionChangedEvent.args.exchangedPositionSize.toString());
      console.log("  名义价值变化:", positionChangedEvent.args.exchangedPositionNotional.toString());
      console.log("  手续费:", positionChangedEvent.args.fee.toString());
      console.log("  未平仓名义价值:", positionChangedEvent.args.openNotional.toString());
      console.log("  已实现盈亏:", positionChangedEvent.args.realizedPnl.toString());
    }

    // 查找资金支付事件
    const fundingPaymentEvent = closeReceipt.events?.find((e: any) => e.event === "FundingPaymentSettled");
    if (fundingPaymentEvent) {
      console.log("  资金支付:", fundingPaymentEvent.args.fundingPayment.toString());
    }

  } catch (error: any) {
    console.error("❌ 平仓失败:", error);
    if (error.reason) {
      console.error("错误原因:", error.reason);
    }
    return;
  }

  console.log("\n=== 3. 验证平仓结果 ===");
  
  // 再次检查仓位状态
  const newTakerPositionSize = await accountBalance.getTakerPositionSize(deployer.address, contractAddresses.baseToken);
  const newTakerOpenNotional = await accountBalance.getTakerOpenNotional(deployer.address, contractAddresses.baseToken);
  
  console.log("平仓后仓位大小:", newTakerPositionSize.toString());
  console.log("平仓后未平仓名义价值:", newTakerOpenNotional.toString());

  // 检查账户价值变化
  const newAccountValue = await clearingHouse.getAccountValue(deployer.address);
  console.log("平仓后账户价值:", newAccountValue.toString());

  // 检查免费抵押物变化
  const newFreeCollateral = await vault.getFreeCollateral(deployer.address);
  console.log("平仓后免费抵押物:", newFreeCollateral.toString());

  // 计算盈亏
  const pnl = newAccountValue.sub(accountValue);
  console.log("本次交易盈亏:", pnl.toString());

  console.log("\n=== 4. 提取资金（可选） ===");
  
  // 如果需要提取资金回钱包
  const vaultBalance = await vault.getBalanceByToken(deployer.address, contractAddresses.usdc);
  console.log("Vault中USDC余额:", vaultBalance.toString());
  
  if (vaultBalance.gt(0)) {
    console.log("可以调用 vault.withdraw() 提取资金到钱包");
  }

  console.log("\n=== 平仓脚本执行完成 ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("脚本执行错误:", error);
    process.exit(1);
  });