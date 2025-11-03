// open-position.ts
import { parseEther, parseUnits } from "ethers/lib/utils";
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("=== 开仓准备脚本 ===");
  console.log("Maker:", deployer.address);

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
  
  // 为maker铸造USDC
  const collateralAmount = parseUnits("1000000", 6); // 1,000,000 USDC
  
  console.log("为maker铸造USDC...");
  // await usdc.connect(deployer).mint(deployer.address, collateralAmount);
  console.log("Maker USDC余额:", (await usdc.balanceOf(deployer.address)).toString());

  console.log("\n=== 2. 存款到金库 ===");
  
  // 授权Vault使用USDC
  console.log("授权Vault使用maker的USDC...");
  // await usdc.connect(deployer).approve(vault.address, collateralAmount);

  // 存款到金库
  console.log("Maker存款到金库...");
  // await vault.connect(deployer).deposit(usdc.address, parseUnits("1000000", 6), {gasLimit: 1000000});
  console.log("Maker存款完成");
  const settlementToken = await vault.getSettlementToken();
  console.log("settlementToken为", settlementToken);

  console.log("4. 验证存款结果...");
    const vaultBalance = await vault.getBalanceByToken(deployer.address, usdc.address);
    console.log("Vault 中的余额:", vaultBalance.toString());
    
    const freeCollateral = await vault.getFreeCollateral(deployer.address);
    console.log("可用抵押品:", freeCollateral.toString());
    
    const accountValue = await vault.getAccountValue(deployer.address);
    console.log("账户价值:", accountValue.toString());

  console.log("\n=== 4. 添加流动性 ===");
  
  // 定义流动性范围
  const lowerTick = 0;
  const upperTick = 100000;
  
  console.log("添加流动性到池子...");
  const addLiquidityTx = await clearingHouse.connect(deployer).addLiquidity({
    baseToken: baseToken.address,
    base: parseEther("650.943787"),    // 约66个BaseToken
    quote: parseEther("100000"),       // 10,000个QuoteToken
    lowerTick: lowerTick,
    upperTick: upperTick,
    minBase: 0,
    minQuote: 0,
    useTakerBalance: false,
    deadline: ethers.constants.MaxUint256
  }, {gasLimit: 1000000});

  const receipt = await addLiquidityTx.wait();
  console.log("流动性添加成功！交易哈希:", receipt.transactionHash);

  // 获取添加流动性的结果
  const liquidityAddedEvent = receipt.events?.find((e: any) => e.event === "LiquidityChanged");
  if (liquidityAddedEvent) {
    console.log("流动性添加详情:");
    console.log("  Base数量:", liquidityAddedEvent.args.base.toString());
    console.log("  Quote数量:", liquidityAddedEvent.args.quote.toString());
    console.log("  手续费:", liquidityAddedEvent.args.quoteFee.toString());
  }
  console.log("添加流动性完成");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("脚本执行错误:", error);
    process.exit(1);
  });