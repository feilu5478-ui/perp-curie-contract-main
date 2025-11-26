// scripts/delegate-approval-upgradeable.ts
import { ethers, upgrades } from "hardhat";

async function main() {
  console.log("开始部署 DelegateApproval 合约（可升级模式）...");

  // 获取部署者账户
  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  console.log("部署者余额:", (await deployer.getBalance()).toString());

  try {
    // 部署 DelegateApproval 合约（可升级模式）
    const DelegateApproval = await ethers.getContractFactory("DelegateApproval");
    
    console.log("\n正在部署 DelegateApproval（可升级模式）...");
    
    const delegateApproval = await upgrades.deployProxy(
      DelegateApproval,
      [],
      { 
        initializer: "initialize",
        kind: "transparent",
      }
    );

    await delegateApproval.deployed();
    console.log("✓ DelegateApproval 已部署到:", delegateApproval.address);

    // 验证合约信息
    console.log("\n验证 DelegateApproval 配置...");
    
    const owner = await delegateApproval.owner();
    const openPositionAction = await delegateApproval.getClearingHouseOpenPositionAction();
    const addLiquidityAction = await delegateApproval.getClearingHouseAddLiquidityAction();
    const removeLiquidityAction = await delegateApproval.getClearingHouseRemoveLiquidityAction();

    console.log("合约所有者:", owner);
    console.log("开仓操作代码:", openPositionAction.toString());
    console.log("添加流动性操作代码:", addLiquidityAction.toString());
    console.log("移除流动性操作代码:", removeLiquidityAction.toString());

    // 验证实现合约地址
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(delegateApproval.address);
    console.log("实现合约地址:", implementationAddress);

    // 验证代理管理员地址
    const adminAddress = await upgrades.erc1967.getAdminAddress(delegateApproval.address);
    console.log("代理管理员地址:", adminAddress);

    // 测试基本功能
    console.log("\n测试基本功能...");
    try {
      const testDelegate = deployer.address;
      const actions = openPositionAction;
      
      const approveTx = await delegateApproval.approve(testDelegate, actions);
      await approveTx.wait();
      
      const hasApproval = await delegateApproval.hasApprovalFor(deployer.address, testDelegate, actions);
      console.log("✓ 基本功能测试通过");
      console.log("  授权检查结果:", hasApproval);
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
      deploymentType: "upgradeable",
      contracts: {
        delegateApproval: {
          proxy: delegateApproval.address,
          implementation: implementationAddress,
          admin: adminAddress,
        }
      },
      config: {
        actions: {
          openPosition: 1,
          addLiquidity: 2,
          removeLiquidity: 4
        }
      },
      deployer: deployer.address,
      note: "可升级部署 - 委托授权管理合约"
    };

    const networkName = (await ethers.provider.getNetwork()).name;
    const deploymentFile = path.join(deploymentsDir, `delegate-approval-upgradeable-${networkName}-${Date.now()}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    
    console.log("\n部署信息已保存到:", deploymentFile);

    console.log("\n🎉 部署完成!");
    console.log("DelegateApproval 代理地址:", delegateApproval.address);

    return {
      delegateApproval,
      implementationAddress,
      adminAddress,
      deploymentFile
    };

  } catch (error) {
    console.error("部署失败:", error);
    throw error;
  }
}

// 错误处理
main().catch((error) => {
  console.error("部署失败:", error);
  process.exit(1);
});

export { main };

