// 添加流动性脚本
import { ethers } from "hardhat";

async function addLiquidityFirst() {
    const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
    const baseTokenAddress = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
    
    const [signer] = await ethers.getSigners();
    const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
    const clearingHouse = ClearingHouse.attach(clearingHouseAddress);
    
    const addLiquidityParams = {
        baseToken: baseTokenAddress,
        base: ethers.utils.parseUnits("1", 18), // 提供 base token 流动性
        quote: ethers.utils.parseUnits("3800", 18), // 提供 quote token 流动性
        lowerTick: -887220,
        upperTick: 887220,
        minBase: 0,
        minQuote: 0,
        useTakerBalance: false,
        deadline: Math.floor(Date.now() / 1000) + 60 * 10
    };
    
    console.log("添加流动性...");
    const tx = await clearingHouse.addLiquidity(addLiquidityParams, { gasLimit: 1000000 });
    const receipt = await tx.wait();
    
    console.log("✅ 流动性添加成功!");
    console.log("交易哈希:", receipt.transactionHash);
}

addLiquidityFirst().catch(console.error);

// 添加流动性脚本 - 带授权逻辑
// import { ethers } from "hardhat";

// async function addLiquidityFirst() {
//     const clearingHouseAddress = "0x32fc2774A8aec3e6e208E2f371b93034D87cE5BB";
//     const baseTokenAddress = "0x15605CCB7e9a1D40F5c911abD03eaF43EF45326e";
//     const quoteTokenAddress = "0x945EC0dDA06834dD592Ad246e07B47f025B8611E"; // 需要替换为实际的 quoteToken 地址
    
//     const [signer] = await ethers.getSigners();
//     console.log("调用者地址:", signer.address);

//     // 获取合约实例
//     const ClearingHouse = await ethers.getContractFactory("ClearingHouse");
//     const clearingHouse = ClearingHouse.attach(clearingHouseAddress);

//     const BaseToken = await ethers.getContractFactory("BaseToken");
//     const baseToken = BaseToken.attach(baseTokenAddress);

//     const QuoteToken = await ethers.getContractFactory("QuoteToken");
//     const quoteToken = QuoteToken.attach(quoteTokenAddress);

//     // 1. 检查余额
//     console.log("\n1. 检查余额...");
//     const baseTokenBalance = await baseToken.balanceOf(signer.address);
//     const quoteTokenBalance = await quoteToken.balanceOf(signer.address);
    
//     console.log("BaseToken 余额:", ethers.utils.formatUnits(baseTokenBalance, 18));
//     console.log("QuoteToken 余额:", ethers.utils.formatUnits(quoteTokenBalance, 18));

//     const requiredBase = ethers.utils.parseUnits("100000", 18);
//     const requiredQuote = ethers.utils.parseUnits("100000", 18);

//     if (baseTokenBalance.lt(requiredBase)) {
//         console.log("❌ BaseToken 余额不足");
//         return;
//     }
//     if (quoteTokenBalance.lt(requiredQuote)) {
//         console.log("❌ QuoteToken 余额不足");
//         return;
//     }

//     // 2. 检查授权状态
//     console.log("\n2. 检查授权状态...");
//     const baseTokenAllowance = await baseToken.allowance(signer.address, clearingHouseAddress);
//     const quoteTokenAllowance = await quoteToken.allowance(signer.address, clearingHouseAddress);
    
//     console.log("BaseToken 当前授权额度:", ethers.utils.formatUnits(baseTokenAllowance, 18));
//     console.log("QuoteToken 当前授权额度:", ethers.utils.formatUnits(quoteTokenAllowance, 18));

//     // 3. 执行授权（如果需要）
//     if (baseTokenAllowance.lt(requiredBase)) {
//         console.log("\n3. 授权 BaseToken...");
//         try {
//             const approveBaseTx = await baseToken.connect(signer).approve(clearingHouseAddress, requiredBase);
//             console.log("BaseToken 授权交易已发送:", approveBaseTx.hash);
//             await approveBaseTx.wait();
//             console.log("✅ BaseToken 授权成功");
//         } catch (error) {
//             console.log("❌ BaseToken 授权失败:", error.message);
//             return;
//         }
//     } else {
//         console.log("✅ BaseToken 已有足够授权");
//     }

//     if (quoteTokenAllowance.lt(requiredQuote)) {
//         console.log("\n4. 授权 QuoteToken...");
//         try {
//             const approveQuoteTx = await quoteToken.connect(signer).approve(clearingHouseAddress, requiredQuote);
//             console.log("QuoteToken 授权交易已发送:", approveQuoteTx.hash);
//             await approveQuoteTx.wait();
//             console.log("✅ QuoteToken 授权成功");
//         } catch (error) {
//             console.log("❌ QuoteToken 授权失败:", error.message);
//             return;
//         }
//     } else {
//         console.log("✅ QuoteToken 已有足够授权");
//     }

//     // 4. 检查白名单状态
//     console.log("\n5. 检查白名单状态...");
//     try {
//         const isBaseTokenWhitelisted = await baseToken.isInWhitelist(clearingHouseAddress);
//         const isQuoteTokenWhitelisted = await quoteToken.isInWhitelist(clearingHouseAddress);
        
//         console.log("ClearingHouse 在 BaseToken 白名单:", isBaseTokenWhitelisted ? "✅" : "❌");
//         console.log("ClearingHouse 在 QuoteToken 白名单:", isQuoteTokenWhitelisted ? "✅" : "❌");

//         if (!isBaseTokenWhitelisted || !isQuoteTokenWhitelisted) {
//             console.log("⚠️  ClearingHouse 不在代币白名单中，需要先添加白名单");
//             return;
//         }
//     } catch (error) {
//         console.log("检查白名单失败:", error.message);
//     }

//     // 5. 添加流动性
//     console.log("\n6. 添加流动性...");
//     const addLiquidityParams = {
//         baseToken: baseTokenAddress,
//         base: requiredBase,
//         quote: requiredQuote,
//         lowerTick: -887220,
//         upperTick: 887220,
//         minBase: 0,
//         minQuote: 0,
//         useTakerBalance: false,
//         deadline: Math.floor(Date.now() / 1000) + 60 * 10
//     };

//     console.log("流动性参数:", {
//         baseToken: addLiquidityParams.baseToken,
//         base: ethers.utils.formatUnits(addLiquidityParams.base, 18),
//         quote: ethers.utils.formatUnits(addLiquidityParams.quote, 18),
//         lowerTick: addLiquidityParams.lowerTick,
//         upperTick: addLiquidityParams.upperTick
//     });

//     try {
//         // 使用更高的 gas limit
//         const tx = await clearingHouse.connect(signer).addLiquidity(addLiquidityParams, { 
//             gasLimit: 1000000 
//         });
//         console.log("流动性添加交易已发送:", tx.hash);
        
//         const receipt = await tx.wait();
//         console.log("✅ 流动性添加成功!");
//         console.log("交易哈希:", receipt.transactionHash);
//         console.log("Gas 使用量:", receipt.gasUsed.toString());

//         // 检查事件日志
//         if (receipt.events) {
//             const liquidityEvent = receipt.events.find((e: any) => e.event === 'LiquidityChanged');
//             if (liquidityEvent) {
//                 console.log("流动性添加详情:", {
//                     maker: liquidityEvent.args.maker,
//                     base: liquidityEvent.args.base.toString(),
//                     quote: liquidityEvent.args.quote.toString(),
//                     liquidity: liquidityEvent.args.liquidity.toString()
//                 });
//             }
//         }

//     } catch (error) {
//         console.log("❌ 流动性添加失败:", error.message);
//         if (error.reason) {
//             console.log("错误原因:", error.reason);
//         }
//         if (error.data) {
//             console.log("错误数据:", error.data);
//         }
//     }
// }

// // 主执行函数
// async function main() {
//     console.log("=== 开始添加流动性流程 ===");
//     try {
//         // 执行添加流动性
//         await addLiquidityFirst();
//     } catch (error) {
//         console.log("❌ 流程执行失败:", error.message);
//     }
// }

// // 如果直接运行此脚本
// main().catch(console.error);


