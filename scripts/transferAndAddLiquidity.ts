// scripts/transferAndAddLiquidity.ts
import { ethers } from "hardhat";

async function transferAndAddLiquidity() {
    console.log("=== 从 ClearingHouse 转移代币并添加流动性 ===");

    const baseTokenAddress = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
    const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
    const [signer] = await ethers.getSigners();

    console.log("调用者地址:", signer.address);

    // 获取合约实例
    const BaseToken = await ethers.getContractFactory("BaseToken");
    const baseToken = BaseToken.attach(baseTokenAddress);

    const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
    const clearingHouse = ClearingHouse.attach(clearingHouseAddress);

    // 1. 获取 quoteToken 地址
    console.log("\n1. 获取 QuoteToken 地址...");
    let quoteTokenAddress: string;
    try {
        quoteTokenAddress = await clearingHouse.getQuoteToken();
        console.log("QuoteToken 地址:", quoteTokenAddress);
    } catch (error) {
        console.log("从 ClearingHouse 获取 QuoteToken 失败:", error.message);
        // 备用方案：从 MarketRegistry 获取
        const marketRegistryAddress = "0x91F83B0351b89194366a9b6986EE7887e6F7A0c5";
        const MarketRegistry = await ethers.getContractFactory("MarketRegistry");
        const marketRegistry = MarketRegistry.attach(marketRegistryAddress);
        quoteTokenAddress = await marketRegistry.getQuoteToken();
        console.log("从 MarketRegistry 获取 QuoteToken 地址:", quoteTokenAddress);
    }

    const QuoteToken = await ethers.getContractFactory("QuoteToken");
    const quoteToken = QuoteToken.attach(quoteTokenAddress);

    // 2. 检查当前余额
    console.log("\n2. 检查当前余额...");
    const baseTokenBalance = await baseToken.balanceOf(signer.address);
    const quoteTokenBalance = await quoteToken.balanceOf(signer.address);
    const clearingHouseBaseBalance = await baseToken.balanceOf(clearingHouseAddress);
    
    console.log("我的 BaseToken 余额:", ethers.utils.formatUnits(baseTokenBalance, 18));
    console.log("我的 QuoteToken 余额:", ethers.utils.formatUnits(quoteTokenBalance, 18));
    console.log("ClearingHouse BaseToken 余额:", ethers.utils.formatUnits(clearingHouseBaseBalance, 18));

    const requiredBase = ethers.utils.parseUnits("100", 18);
    const requiredQuote = ethers.utils.parseUnits("100", 18);

    // 3. 如果 BaseToken 不足，从 ClearingHouse 转移
    if (baseTokenBalance.lt(requiredBase)) {
        console.log("\n3. BaseToken 不足，从 ClearingHouse 转移...");
        await transferBaseTokenFromClearingHouse(baseToken, clearingHouseAddress, signer, requiredBase);
    } else {
        console.log("\n✅ BaseToken 余额充足");
    }

    // 4. 检查授权状态
    console.log("\n4. 检查授权状态...");
    await checkAndApproveTokens(baseToken, quoteToken, clearingHouseAddress, signer, requiredBase, requiredQuote);

    // 5. 添加流动性
    console.log("\n5. 添加流动性...");
    await addLiquidity(clearingHouse, baseTokenAddress, signer, requiredBase, requiredQuote);
}

async function transferBaseTokenFromClearingHouse(
    baseToken: any, 
    clearingHouseAddress: string, 
    signer: any, 
    amount: any
) {
    console.log(`尝试从 ClearingHouse 转移 ${ethers.utils.formatUnits(amount, 18)} BaseToken...`);

    // 方法1: 检查是否是 owner
    const owner = await baseToken.owner();
    const isOwner = owner.toLowerCase() === signer.address.toLowerCase();
    
    console.log("BaseToken Owner:", owner);
    console.log("您是否是 Owner:", isOwner ? "✅" : "❌");

    if (isOwner) {
        // 作为 owner，我们可以使用特殊方法
        await transferAsOwner(baseToken, clearingHouseAddress, signer, amount);
    } else {
        // 不是 owner，尝试其他方法
        await transferAsNonOwner(baseToken, clearingHouseAddress, signer, amount);
    }
}

async function transferAsOwner(baseToken: any, clearingHouseAddress: string, signer: any, amount: any) {
    console.log("作为 Owner 执行转移...");

    try {
        // 方法1: 直接使用 transferFrom（需要 ClearingHouse 已授权）
        console.log("方法1: 尝试直接 transferFrom...");
        await baseToken.connect(signer).approve(clearingHouseAddress, amount);
        const allowance = await baseToken.allowance(clearingHouseAddress, signer.address);
        console.log("ClearingHouse 给您的授权额度:", ethers.utils.formatUnits(allowance, 18));

        if (allowance.gte(amount)) {
            const tx = await baseToken.connect(signer).transferFrom(clearingHouseAddress, signer.address, amount);
            await tx.wait();
            console.log("✅ 直接转移成功");
            return;
        } else {
            console.log("❌ 授权额度不足");
        }
    } catch (error) {
        console.log("直接转移失败:", error.message);
    }

    // 方法2: 使用代理合约
    console.log("方法2: 使用代理合约...");
    // await useProxyContract(baseToken, clearingHouseAddress, signer, amount);
}

// async function useProxyContract(baseToken: any, clearingHouseAddress: string, signer: any, amount: any) {
//     console.log("部署代理合约...");

//     try {
//         // 代理合约代码
//         const proxyContractCode = `
//             // SPDX-License-Identifier: MIT
//             pragma solidity ^0.7.6;
            
//             interface IBaseToken {
//                 function transferFrom(address from, address to, uint256 amount) external returns (bool);
//                 function allowance(address owner, address spender) external view returns (uint256);
//             }
            
//             contract TransferProxy {
//                 function transferFrom(address token, address from, address to, uint256 amount) external {
//                     IBaseToken(token).transferFrom(from, to, amount);
//                 }
//             }
//         `;

//         // 编译并部署代理合约
//         const TransferProxyFactory = await ethers.getContractFactory("TransferProxy");
//         const proxy = await TransferProxyFactory.deploy();
//         await proxy.deployed();
//         console.log("代理合约部署成功，地址:", proxy.address);

//         // 检查代理合约的授权
//         const proxyAllowance = await baseToken.allowance(clearingHouseAddress, proxy.address);
//         console.log("ClearingHouse 给代理合约的授权额度:", ethers.utils.formatUnits(proxyAllowance, 18));

//         if (proxyAllowance.gte(amount)) {
//             // 通过代理合约转移
//             const tx = await proxy.connect(signer).transferFrom(baseToken.address, clearingHouseAddress, signer.address, amount);
//             await tx.wait();
//             console.log("✅ 通过代理合约转移成功");
//         } else {
//             console.log("❌ 代理合约授权额度不足");
//             console.log("需要 ClearingHouse 先授权给代理合约");
//         }

//     } catch (error) {
//         console.log("代理合约方案失败:", error.message);
//     }
// }

async function transferAsNonOwner(baseToken: any, clearingHouseAddress: string, signer: any, amount: any) {
    console.log("作为非 Owner 执行转移...");

    // 检查白名单状态
    const isWhitelisted = await baseToken.isInWhitelist(signer.address);
    console.log("您是否在白名单中:", isWhitelisted ? "✅" : "❌");

    if (!isWhitelisted) {
        console.log("❌ 您不在白名单中，无法接收 BaseToken");
        console.log("请联系 BaseToken Owner 将您的地址添加到白名单");
        return;
    }

    // 检查授权
    const allowance = await baseToken.allowance(clearingHouseAddress, signer.address);
    console.log("ClearingHouse 给您的授权额度:", ethers.utils.formatUnits(allowance, 18));

    if (allowance.gte(amount)) {
        try {
            const tx = await baseToken.connect(signer).transferFrom(clearingHouseAddress, signer.address, amount);
            await tx.wait();
            console.log("✅ 转移成功");
        } catch (error) {
            console.log("转移失败:", error.message);
        }
    } else {
        console.log("❌ 授权额度不足");
        console.log("需要 ClearingHouse 先授权给您的地址");
    }
}

async function checkAndApproveTokens(
    baseToken: any, 
    quoteToken: any, 
    clearingHouseAddress: string, 
    signer: any, 
    requiredBase: any, 
    requiredQuote: any
) {
    console.log("检查并授权代币...");

    // 检查 BaseToken 授权
    const baseTokenAllowance = await baseToken.allowance(signer.address, clearingHouseAddress);
    console.log("BaseToken 当前授权额度:", ethers.utils.formatUnits(baseTokenAllowance, 18));

    if (baseTokenAllowance.lt(requiredBase)) {
        console.log("授权 BaseToken...");
        try {
            const tx = await baseToken.connect(signer).approve(clearingHouseAddress, requiredBase);
            await tx.wait();
            console.log("✅ BaseToken 授权成功");
        } catch (error) {
            console.log("❌ BaseToken 授权失败:", error.message);
        }
    } else {
        console.log("✅ BaseToken 已有足够授权");
    }

    // 检查 QuoteToken 授权
    const quoteTokenAllowance = await quoteToken.allowance(signer.address, clearingHouseAddress);
    console.log("QuoteToken 当前授权额度:", ethers.utils.formatUnits(quoteTokenAllowance, 18));

    if (quoteTokenAllowance.lt(requiredQuote)) {
        console.log("授权 QuoteToken...");
        try {
            const tx = await quoteToken.connect(signer).approve(clearingHouseAddress, requiredQuote);
            await tx.wait();
            console.log("✅ QuoteToken 授权成功");
        } catch (error) {
            console.log("❌ QuoteToken 授权失败:", error.message);
        }
    } else {
        console.log("✅ QuoteToken 已有足够授权");
    }
}

async function addLiquidity(
    clearingHouse: any, 
    baseTokenAddress: string, 
    signer: any, 
    requiredBase: any, 
    requiredQuote: any
) {
    console.log("执行添加流动性...");

    const addLiquidityParams = {
        baseToken: baseTokenAddress,
        base: requiredBase,
        quote: requiredQuote,
        lowerTick: -887220,
        upperTick: 887220,
        minBase: 0,
        minQuote: 0,
        useTakerBalance: false,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10
    };

    console.log("流动性参数:", {
        baseToken: addLiquidityParams.baseToken,
        base: ethers.utils.formatUnits(addLiquidityParams.base, 18),
        quote: ethers.utils.formatUnits(addLiquidityParams.quote, 18),
        lowerTick: addLiquidityParams.lowerTick,
        upperTick: addLiquidityParams.upperTick
    });

    try {
        // 检查最终余额
        const BaseToken = await ethers.getContractFactory("BaseToken");
        const baseToken = BaseToken.attach(baseTokenAddress);
        
        const finalBaseBalance = await baseToken.balanceOf(signer.address);
        const finalQuoteBalance = await (await ethers.getContractFactory("QuoteToken")).attach(await clearingHouse.getQuoteToken()).balanceOf(signer.address);
        
        console.log("最终 BaseToken 余额:", ethers.utils.formatUnits(finalBaseBalance, 18));
        console.log("最终 QuoteToken 余额:", ethers.utils.formatUnits(finalQuoteBalance, 18));

        if (finalBaseBalance.lt(requiredBase) || finalQuoteBalance.lt(requiredQuote)) {
            console.log("❌ 余额不足，无法添加流动性");
            return;
        }

        // 执行添加流动性
        const tx = await clearingHouse.connect(signer).addLiquidity(addLiquidityParams, { 
            gasLimit: 1500000 
        });
        console.log("流动性添加交易已发送:", tx.hash);
        
        const receipt = await tx.wait();
        console.log("✅ 流动性添加成功!");
        console.log("交易哈希:", receipt.transactionHash);
        console.log("Gas 使用量:", receipt.gasUsed.toString());

        // 检查事件日志
        if (receipt.events) {
            const liquidityEvent = receipt.events.find((e: any) => e.event === 'LiquidityChanged');
            if (liquidityEvent) {
                console.log("流动性添加详情:", {
                    maker: liquidityEvent.args.maker,
                    base: liquidityEvent.args.base.toString(),
                    quote: liquidityEvent.args.quote.toString(),
                    liquidity: liquidityEvent.args.liquidity.toString()
                });
            }
        }

    } catch (error) {
        console.log("❌ 流动性添加失败:", error.message);
        if (error.reason) {
            console.log("错误原因:", error.reason);
        }
    }
}

// 运行主函数
transferAndAddLiquidity().catch(console.error);