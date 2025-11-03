import "@nomiclabs/hardhat-ethers"
import "@nomiclabs/hardhat-waffle"
import "@openzeppelin/hardhat-upgrades"
import "@typechain/hardhat"
import "hardhat-contract-sizer"
import "hardhat-dependency-compiler"
import "hardhat-gas-reporter"
import { HardhatUserConfig } from "hardhat/config"
import "solidity-coverage"
import "./mocha-test"

const config: HardhatUserConfig = {
    solidity: {
        version: "0.7.6",
        settings: {
            optimizer: { enabled: true, runs: 100 },
            evmVersion: "berlin",
            // for smock to mock contracts
            outputSelection: {
                "*": {
                    "*": ["storageLayout"],
                },
            },
        },
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
        },
        sepolia: {
            url: "https://eth-sepolia.g.alchemy.com/v2/0bUfpME8H-FSwi7tfsVrs1sGnRZpkghY",
            // accounts: ["0xaf23466f8e2a384181058e79627ec05efbf36b158d186d15f50245607675cb94"],
            accounts: ["0xb6eed9bc23ff2d6ad46fb4af4d8f99c7a5988e51130af461298c4805109f0515"],
            chainId: 11155111,
        },
    },
    dependencyCompiler: {
        // We have to compile from source since UniswapV3 doesn't provide artifacts in their npm package
        paths: [
            "@uniswap/v3-core/contracts/UniswapV3Factory.sol",
            "@uniswap/v3-core/contracts/UniswapV3Pool.sol",
            "@perp/perp-oracle-contract/contracts/PriceFeedDispatcher.sol",
            "@perp/perp-oracle-contract/contracts/ChainlinkPriceFeedV2.sol",
            "@perp/perp-oracle-contract/contracts/ChainlinkPriceFeedV3.sol",
            "@perp/voting-escrow/contracts/SurplusBeneficiary.sol",
        ],
    },
    contractSizer: {
        // max bytecode size is 24.576 KB
        alphaSort: true,
        runOnCompile: true,
        disambiguatePaths: true,
        except: ["@openzeppelin/", "@uniswap/", "@perp/perp-oracle-contract/", "@perp/voting-escrow/", "test/"],
    },
    gasReporter: {
        excludeContracts: ["test"],
    },
    mocha: {
        require: ["ts-node/register/files"],
        jobs: 4,
        timeout: 120000,
        color: true,
    },
}

export default config
