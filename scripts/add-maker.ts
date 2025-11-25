// open-position.ts
import { parseEther } from "ethers/lib/utils";
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("=== 开仓准备脚本 ===");
  console.log("Maker:", deployer.address);

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
  
  // 为maker铸造USDC
  // const collateralAmount = parseUnits("1000000", 6); // 1,000,000 USDC
  
  console.log("为maker铸造USDC...");
  // await usdc.connect(deployer).mint(deployer.address, collateralAmount);
  // console.log("Maker USDC余额:", (await usdc.balanceOf(deployer.address)).toString());

  console.log("\n=== 2. 存款到金库 ===");
  
  // 授权Vault使用USDC
  console.log("授权Vault使用maker的USDC...");
  // await usdc.connect(deployer).approve(vault.address, collateralAmount);

  // 存款到金库
  console.log("Maker存款到金库...");
  // await vault.connect(deployer).deposit(usdc.address, parseUnits("1000000", 6), { gasLimit: 500000 });
  console.log("Maker存款完成");
  // const settlementToken = await vault.getSettlementToken();
  // console.log("settlementToken为", settlementToken);

  // console.log("4. 验证存款结果...");
  //   const vaultBalance = await vault.getBalanceByToken(deployer.address, usdc.address);
  //   console.log("Vault 中的余额:", vaultBalance.toString());
    
  //   const freeCollateral = await vault.getFreeCollateral(deployer.address);
  //   console.log("可用抵押品:", freeCollateral.toString());
    
  //   const accountValue = await vault.getAccountValue(deployer.address);
  //   console.log("账户价值:", accountValue.toString());

  console.log("\n=== 4. 添加流动性 ===");
  
  // 定义流动性范围
  const lowerTick = 100000;
  const upperTick = 102000;
  
  console.log("添加流动性到池子...");
  const addLiquidityTx = await clearingHouse.connect(deployer).addLiquidity({
    baseToken: baseToken.address,
    base: parseEther("100"),
    quote: parseEther("28277"),
    lowerTick: lowerTick,
    upperTick: upperTick,
    minBase: 0,
    minQuote: 0,
    useTakerBalance: false,
    deadline: ethers.constants.MaxUint256
  }, {gasLimit: 1500000});

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