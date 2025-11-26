// MockPriceFeed.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.7.6;

// contract MockPriceFeed {
//     uint8 public constant decimals = 8;
//     uint256 public constant price = 2000 * 10**8; // $2000 in 8 decimals
    
//     function getPrice(uint256) external pure returns (uint256) {
//         return price;
//     }
    
//     function cacheTwap(uint256) external pure {
//         // Do nothing for mock
//     }
// }
contract MockPriceFeed {
    uint8 public constant decimals = 8;
    uint256 public price;
    address public owner;
    
    constructor(uint256 _initialPrice) {
        price = _initialPrice;
        owner = msg.sender;
    }
    
    function setPrice(uint256 _newPrice) external {
        require(msg.sender == owner, "Only owner can set price");
        price = _newPrice;
    }
    
    function getPrice(uint256) external view returns (uint256) {
        return price;
    }
    
    function cacheTwap(uint256) external pure {
        // Do nothing for mock
    }
    
    function getPriceFeedDecimals() external pure returns (uint8) {
        return decimals;
    }
}