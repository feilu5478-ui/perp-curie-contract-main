// open-position.ts
import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("=== 开仓准备脚本 ===");
  console.log("Taker:", deployer.address);

  // 合约地址（使用您部署的地址）
  const contractAddresses = {
    clearingHouse: "0x065536c3e366F28C4378A7939b4c540670ae4E43",
    vault: "0xa328b300dfEdf4d2062eC712D6BcC2be1c96bcD0",
    exchange: "0xc6325545732ab188084BbD35A495c0C42b148BD4",
    orderBook: "0x8EfE7E3C8153EE8B27d280AF206728FF713d9348",
    marketRegistry: "0xD0be37F945DdaEBf1Af60F0dE5C78e3A42f1F3cf",
    accountBalance: "0xD645C301A87255082e74052D449613d2D3A67c15",
    baseToken: "0x23383BA49A2D72fD3b617751A0efD3e7Df58Bf06",
    quoteToken: "0xE62CC8B89df2F354D4abB6e3cEFEe2d6fa091f3b",
    usdc: "0x727e7D4CaF9F7D89E8425458A2A1FbF06a35F65e",
    weth: "0x51Fd3eB1325A8d9091Ed32D1412B159e095558b0",
    pool: "0xc23d25eab268fd2099f5199a0c3f22393ccf9a4f"
  };

  // 获取合约实例
  const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
  const clearingHouse = ClearingHouse.attach(contractAddresses.clearingHouse);

  const Vault = await ethers.getContractFactory("Vault");
  const vault = Vault.attach(contractAddresses.vault);

  const TestERC20 = await ethers.getContractFactory("TestERC20");
  const usdc = TestERC20.attach(contractAddresses.usdc);
  const BaseToken = await ethers.getContractFactory("BaseToken");
  const baseToken = BaseToken.attach(contractAddresses.baseToken);
  const QuoteToken = await ethers.getContractFactory("QuoteToken");
  const quoteToken = QuoteToken.attach(contractAddresses.quoteToken);

  console.log("\n=== 1. 准备抵押物 ===");
  
  // 为taker铸造USDC
  const collateralAmount = parseUnits("1000000", 6); // 1,000,000 USDC


  console.log("为taker铸造USDC...");
//   await usdc.connect(deployer).mint("0x01afA79F7d3F08ccE8221Ce48d0A9D83973a95Ac", collateralAmount, {gasLimit: 500000});
  console.log("Taker USDC余额:", (await usdc.balanceOf("0x01afA79F7d3F08ccE8221Ce48d0A9D83973a95Ac")).toString());

  console.log("\n=== 2. 存款到金库 ===");
  
  // 授权Vault使用USDC
  console.log("授权Vault使用taker的USDC...");
  // await usdc.connect(deployer).approve(vault.address, collateralAmount);

  // 存款到金库
  console.log("Taker存款到金库...");
  // await vault.connect(deployer).deposit(usdc.address, parseUnits("1000", 6), { gasLimit: 500000 });
  console.log("Taker存款完成");

  console.log("\n=== 5. 开仓操作 ===");
  
  // 检查taker的免费抵押物
  const freeCollateral = await vault.getFreeCollateral(deployer.address);
  console.log("Taker免费抵押物:", freeCollateral.toString());

  // 开多头仓位（用QuoteToken买BaseToken）
  console.log("执行开多头仓位操作...");
  
  const openLongTx = await clearingHouse.connect(deployer).openPosition({
    baseToken: baseToken.address,
    isBaseToQuote: false,      // false = 用Quote买Base (开多)
    isExactInput: true,        // true = 精确输入Quote数量
    oppositeAmountBound: 0,    // 0 = 不设置滑点保护
    amount: parseEther("2000"), // 用100个QuoteToken买BaseToken
    sqrtPriceLimitX96: 0,      // 0 = 不限制价格
    deadline: ethers.constants.MaxUint256,
    referralCode: ethers.constants.HashZero
  }, { gasLimit: 1000000 });

  const longReceipt = await openLongTx.wait();
  console.log("开多头仓位成功！交易哈希:", longReceipt.transactionHash);

  // 获取开仓结果
  const positionChangedEvent = longReceipt.events?.find((e: any) => e.event === "PositionChanged");
  if (positionChangedEvent) {
    console.log("开仓详情:");
    console.log("  交易对:", positionChangedEvent.args.baseToken);
    console.log("  仓位变化:", positionChangedEvent.args.exchangedPositionSize.toString());
    console.log("  名义价值变化:", positionChangedEvent.args.exchangedPositionNotional.toString());
    console.log("  手续费:", positionChangedEvent.args.fee.toString());
    console.log("  未平仓名义价值:", positionChangedEvent.args.openNotional.toString());
    console.log("  已实现盈亏:", positionChangedEvent.args.realizedPnl.toString());
  }

  // 检查仓位信息
  console.log("\n=== 6. 检查仓位状态 ===");
  const AccountBalance = await ethers.getContractFactory("AccountBalance");
  const accountBalance = AccountBalance.attach(contractAddresses.accountBalance);
  const takerPositionSize = await accountBalance.getTakerPositionSize(deployer.address, baseToken.address);
  const takerOpenNotional = await accountBalance.getTakerOpenNotional(deployer.address, baseToken.address);
  
  console.log("Taker仓位大小:", takerPositionSize.toString());
  console.log("Taker未平仓名义价值:", takerOpenNotional.toString());

  // 检查账户价值
  const accountValue = await clearingHouse.getAccountValue(deployer.address);
  console.log("Taker账户价值:", accountValue.toString());

  // 可选：开空头仓位
//   console.log("\n=== 7. 开空头仓位操作 ===");
  
//   const openShortTx = await clearingHouse.connect(deployer).openPosition({
//     baseToken: baseToken.address,
//     isBaseToQuote: true,       // true = 卖Base换Quote (开空)
//     isExactInput: false,       // false = 精确输出Base数量
//     oppositeAmountBound: 0,
//     amount: parseEther("10"),  // 卖10个BaseToken
//     sqrtPriceLimitX96: 0,
//     deadline: ethers.constants.MaxUint256,
//     referralCode: ethers.constants.HashZero
//   });

//   const shortReceipt = await openShortTx.wait();
//   console.log("开空头仓位成功！交易哈希:", shortReceipt.transactionHash);

//   // 检查最终仓位状态
//   const finalPositionSize = await accountBalance.getTakerPositionSize(deployer.address, baseToken.address);
//   const finalOpenNotional = await accountBalance.getTakerOpenNotional(deployer.address, baseToken.address);
  
//   console.log("\n最终仓位状态:");
//   console.log("  仓位大小:", finalPositionSize.toString());
//   console.log("  未平仓名义价值:", finalOpenNotional.toString());

  console.log("\n=== 开仓脚本执行完成 ===");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("脚本执行错误:", error);
    process.exit(1);
  });