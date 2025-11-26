// open-position.ts
import { parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("=== 开仓准备脚本 ===");
  console.log("Taker:", deployer.address);

  // 合约地址（使用您部署的地址）
  const contractAddresses = {
    clearingHouse: "0xcdEa7bEF2E550eC317E4FEc80Fc59B00AE271fa3",
    vault: "0x42F2202120Af3217868fdB356F98d87c3ED0c123",
    exchange: "0x4EEe99beA14d52515A94463ca4D1d739Ad2a0F5F",
    orderBook: "0xBD7647440788BE523e7B9740D7f23B17b28c36a0",
    marketRegistry: "0x2911377369fA73F97125eF1816Ac6475cADea3b6",
    accountBalance: "0x8Eae24D537b9EC2535EC1F2AB8D1C54F481dC7e1",
    baseToken: "0x14aA73eB98C623C8712c445847873AD0D29BD834",
    quoteToken: "0xB736Ce12ee74345600aeDFb9c27B6A8822D4C892",
    usdc: "0x727e7D4CaF9F7D89E8425458A2A1FbF06a35F65e",
    weth: "0x51Fd3eB1325A8d9091Ed32D1412B159e095558b0",
    pool: "0x2d7ad7a7b7021e681b697cdf955169c710c95cb1"
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
  // await usdc.connect(deployer).mint("0x01afA79F7d3F08ccE8221Ce48d0A9D83973a95Ac", collateralAmount, {gasLimit: 500000});
  // console.log("Taker USDC余额:", (await usdc.balanceOf("0x01afA79F7d3F08ccE8221Ce48d0A9D83973a95Ac")).toString());

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
  
  // const openLongTx = await clearingHouse.connect(deployer).openPosition({
  //   baseToken: baseToken.address,
  //   isBaseToQuote: false,      // false = 用Quote买Base (开多)
  //   isExactInput: true,        // true = 精确输入Quote数量
  //   oppositeAmountBound: 0,    // 0 = 不设置滑点保护
  //   amount: parseEther("2000"), // 用100个QuoteToken买BaseToken
  //   sqrtPriceLimitX96: 0,      // 0 = 不限制价格
  //   deadline: ethers.constants.MaxUint256,
  //   referralCode: ethers.constants.HashZero
  // }, { gasLimit: 1000000 });

  // const longReceipt = await openLongTx.wait();
  // console.log("开多头仓位成功！交易哈希:", longReceipt.transactionHash);

  // // 获取开仓结果
  // const positionChangedEvent = longReceipt.events?.find((e: any) => e.event === "PositionChanged");
  // if (positionChangedEvent) {
  //   console.log("开仓详情:");
  //   console.log("  交易对:", positionChangedEvent.args.baseToken);
  //   console.log("  仓位变化:", positionChangedEvent.args.exchangedPositionSize.toString());
  //   console.log("  名义价值变化:", positionChangedEvent.args.exchangedPositionNotional.toString());
  //   console.log("  手续费:", positionChangedEvent.args.fee.toString());
  //   console.log("  未平仓名义价值:", positionChangedEvent.args.openNotional.toString());
  //   console.log("  已实现盈亏:", positionChangedEvent.args.realizedPnl.toString());
  // }

  // 检查仓位信息
  console.log("\n=== 6. 检查仓位状态 ===");
  // const AccountBalance = await ethers.getContractFactory("AccountBalance");
  // const accountBalance = AccountBalance.attach(contractAddresses.accountBalance);
  // const takerPositionSize = await accountBalance.getTakerPositionSize(deployer.address, baseToken.address);
  // const takerOpenNotional = await accountBalance.getTakerOpenNotional(deployer.address, baseToken.address);
  
  // console.log("Taker仓位大小:", takerPositionSize.toString());
  // console.log("Taker未平仓名义价值:", takerOpenNotional.toString());

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