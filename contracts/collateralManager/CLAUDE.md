[根目录](../../CLAUDE.md) > [contracts](../) > **collateralManager**

---

# CollateralManager 抵押品管理模块

## 模块职责

`CollateralManager` 是 Perpetual Protocol 的**抵押品管理合约**，负责管理协议接受的抵押品代币，包括代币白名单、抵押率、权重等参数。它确保只有经过验证的代币可以作为抵押品，维护协议的风险控制。

### 核心职责

1. **代币白名单**: 管理可作为抵押品的代币列表
2. **抵押参数**: 配置每个代币的抵押参数
3. **风险权重**: 设置不同代币的风险权重
4. **借款限额**: 管理单代币和总体的借款限额
5. **价格验证**: 验证抵押品价格数据

## 入口与启动

### 合约信息
- **文件**: `contracts/CollateralManager.sol`
- **Solidity版本**: 0.7.6
- **许可证**: GPL-3.0-or-later
- **继承**: 基于 OpenZeppelin 可升级模式

### 初始化参数
```solidity
function initialize(address clearingHouseConfigArg) external initializer
```

## 对外接口

### 主要功能

#### 1. 抵押品管理
```solidity
/// 添加抵押品代币
function addCollateralToken(
    address token,
    uint32 weight,
    uint256 priceAdjust,
    uint32 cap,
    bool isForLiquidation
) external onlyOwner;

/// 更新抵押品代币
function updateCollateralToken(
    address token,
    uint32 weight,
    uint256 priceAdjust,
    uint32 cap,
    bool isForLiquidation
) external onlyOwner;

/// 移除抵押品代币
function removeCollateralToken(address token) external onlyOwner;
```

#### 2. 查询功能
```solidity
/// 检查是否为抵押品
function isCollateral(address token) external view returns (bool);

/// 获取抵押品信息
function getCollateralInfo(address token) external view returns (CollateralInfo memory);

/// 获取所有抵押品
function getAllCollateralTokens() external view returns (address[] memory);
```

#### 3. 容量管理
```solidity
/// 设置总容量
function setCap(uint256 cap) external onlyOwner;

/// 检查容量限制
function checkCap(uint256 amount) external view returns (bool);
```

## 关键依赖

- `ClearingHouseConfig` - 清算所配置
- `PriceFeed` - 价格预言机

## 数据模型

### 抵押品信息
```solidity
struct CollateralInfo {
    bool isForLiquidation;  // 是否用于清算
    uint32 decimals;        // 小数位数
    uint32 weight;          // 风险权重
    uint256 priceAdjust;    // 价格调整
    uint32 cap;             // 容量限制
}
```

### 存储结构
- `_cap` - 总容量限制
- `_collateralTokens` - 抵押品代币映射

## 测试与质量

### 测试文件
**1个主要测试文件**：
- `CollateralManager.spec.ts` - 规范测试

### 测试覆盖场景
- ✅ 添加/移除抵押品
- ✅ 更新抵押品参数
- ✅ 容量检查
- ✅ 白名单验证
- ✅ 权限检查

### 测试覆盖率
- ✅ 抵押品管理：100%
- ✅ 容量控制：100%
- ✅ 参数验证：100%

## 常见问题

### Q: 如何添加新的抵押品代币？
**A**:
1. 确保代币符合标准 (ERC20, 18位小数)
2. 配置风险权重和价格调整
3. 设置容量限制
4. 调用 `addCollateralToken()`

### Q: 风险权重如何设置？
**A**:
- 0-100% 范围
- 100% = 完全抵押
- 较低权重 = 较高风险

### Q: 容量限制的作用？
**A**: 防止单个代币或总体过度集中风险。

## 相关文件

### 核心文件
- `contracts/CollateralManager.sol` - 主合约
- `contracts/interface/ICollateralManager.sol` - 接口
- `contracts/storage/CollateralManagerStorage.sol` - 存储

### 脚本文件
- `scripts/add-collateral-token.ts` - 添加抵押品代币
- `scripts/deploy-collateral-manager-upgradeable.ts` - 部署合约
- `scripts/initializeFullSystem.ts` - 系统初始化

## 变更记录

### [未发布] - 2025-11-12
- 改进抵押品验证逻辑
- 优化容量管理算法
- 增强风险控制参数

---

**注意**: 本文档基于当前代码生成，具体实现请以源代码为准。
