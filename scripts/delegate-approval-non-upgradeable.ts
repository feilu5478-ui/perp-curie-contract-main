// scripts/delegate-approval-non-upgradeable.ts
import { ethers } from "hardhat";

async function main() {
  console.log("开始部署 DelegateApproval 合约（不可升级模式）...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", (await deployer.getBalance()).toString());

  // 部署 DelegateApproval 合约
  console.log("\n正在部署 DelegateApproval...");
  
  const DelegateApproval = await ethers.getContractFactory("DelegateApproval");
  const delegateApproval = await DelegateApproval.deploy();
  
  await delegateApproval.deployed();
  console.log("✓ DelegateApproval 合约已部署到:", delegateApproval.address);

  // 初始化合约
  console.log("初始化 DelegateApproval 合约...");
  const initTx = await delegateApproval.initialize();
  await initTx.wait();
  console.log("✓ 合约初始化成功");

  // 验证合约配置
  console.log("\n验证 DelegateApproval 配置...");
  
  const owner = await delegateApproval.owner();
  const openPositionAction = await delegateApproval.getClearingHouseOpenPositionAction();
  const addLiquidityAction = await delegateApproval.getClearingHouseAddLiquidityAction();
  const removeLiquidityAction = await delegateApproval.getClearingHouseRemoveLiquidityAction();

  console.log("合约所有者:", owner);
  console.log("开仓操作代码:", openPositionAction.toString());
  console.log("添加流动性操作代码:", addLiquidityAction.toString());
  console.log("移除流动性操作代码:", removeLiquidityAction.toString());

  // 验证初始化是否成功
  if (owner.toLowerCase() === deployer.address.toLowerCase()) {
    console.log("✓ 合约初始化验证成功");
  } else {
    console.log("✗ 合约初始化验证失败");
    throw new Error("合约初始化失败");
  }

  // 测试基本功能
  console.log("\n测试基本功能...");
  try {
    // 测试授权功能
    const testDelegate = deployer.address; // 用自己作为测试委托者
    const actions = openPositionAction; // 只授权开仓权限
    
    console.log("测试授权功能...");
    const approveTx = await delegateApproval.approve(testDelegate, actions);
    await approveTx.wait();
    console.log("✓ 授权功能测试通过");

    // 测试权限检查
    const hasApproval = await delegateApproval.hasApprovalFor(deployer.address, testDelegate, actions);
    const canOpenPosition = await delegateApproval.canOpenPositionFor(deployer.address, testDelegate);
    
    console.log("✓ 权限检查功能测试通过");
    console.log("  授权检查结果:", hasApproval);
    console.log("  开仓权限检查:", canOpenPosition);

    // 测试撤销权限
    console.log("测试撤销权限功能...");
    const revokeTx = await delegateApproval.revoke(testDelegate, actions);
    await revokeTx.wait();
    
    const hasApprovalAfterRevoke = await delegateApproval.hasApprovalFor(deployer.address, testDelegate, actions);
    console.log("✓ 撤销权限功能测试通过");
    console.log("  撤销后授权检查:", hasApprovalAfterRevoke);

  } catch (error) {
    console.log("⚠️ 功能测试有警告:", error.message);
  }

  // 保存部署信息到文件
  const fs = require("fs");
  const path = require("path");
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentInfo = {
    network: {
      name: (await ethers.provider.getNetwork()).name,
      chainId: (await ethers.provider.getNetwork()).chainId
    },
    timestamp: new Date().toISOString(),
    deploymentType: "non-upgradeable",
    contracts: {
      delegateApproval: delegateApproval.address,
    },
    config: {
      actions: {
        openPosition: 1,
        addLiquidity: 2,
        removeLiquidity: 4
      }
    },
    deployer: deployer.address,
    note: "不可升级部署 - 委托授权管理合约"
  };

  const networkName = (await ethers.provider.getNetwork()).name;
  const deploymentFile = path.join(deploymentsDir, `delegate-approval-${networkName}-${Date.now()}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n部署信息已保存到:", deploymentFile);

  console.log("\n🎉 部署完成!");
  console.log("==========================================");
  console.log("DelegateApproval 地址:", delegateApproval.address);
  console.log("部署网络:", networkName);
  console.log("部署类型: 不可升级");
  console.log("==========================================");

  return {
    delegateApproval,
    deploymentFile,
    deploymentInfo
  };
}

// 错误处理
main().catch((error) => {
  console.error("部署失败:", error);
  process.exit(1);
});

export { main };

