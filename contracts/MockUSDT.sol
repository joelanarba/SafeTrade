// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDT
 * @notice A mock ERC20 token for testing SafeTrade Escrow
 */
contract MockUSDT is ERC20 {
    constructor() ERC20("Mock Tether", "USDT") {
        // Mint 1 billion tokens to the deployer
        _mint(msg.sender, 1_000_000_000 * 10 ** decimals());
    }

    // Allow anyone to mint for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
