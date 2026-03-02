// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title EscrowFactory
 * @notice SafeTrade Ghana Escrow Contract — holds funds until buyer confirms delivery
 * @dev Deploy to BNB Smart Chain Testnet (chainId: 97)
 */
contract EscrowFactory {
    address public owner;

    struct Escrow {
        string dealId;
        address vendorAddress;
        uint256 amount;
        address buyer;
        bool funded;
        bool released;
        bool refunded;
    }

    // dealId => Escrow
    mapping(string => Escrow) public escrows;

    // Track all deal IDs
    string[] public dealIds;

    event EscrowCreated(string indexed dealId, address vendor, uint256 amount, address buyer);
    event EscrowReleased(string indexed dealId, address vendor, uint256 amount);
    event EscrowRefunded(string indexed dealId, address buyer, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @notice Create a new escrow for a deal
     * @param dealId Unique deal identifier
     * @param vendorAddress The vendor's wallet address
     * @param amount The amount in wei to be escrowed
     */
    function createEscrow(
        string calldata dealId,
        address vendorAddress,
        uint256 amount
    ) external payable {
        require(msg.value == amount, "Sent value must equal amount");
        require(amount > 0, "Amount must be greater than 0");
        require(!escrows[dealId].funded, "Escrow already exists for this deal");
        require(vendorAddress != address(0), "Invalid vendor address");

        escrows[dealId] = Escrow({
            dealId: dealId,
            vendorAddress: vendorAddress,
            amount: amount,
            buyer: msg.sender,
            funded: true,
            released: false,
            refunded: false
        });

        dealIds.push(dealId);

        emit EscrowCreated(dealId, vendorAddress, amount, msg.sender);
    }

    /**
     * @notice Release escrowed funds to the vendor
     * @param dealId The deal identifier
     */
    function release(string calldata dealId) external onlyOwner {
        Escrow storage escrow = escrows[dealId];
        require(escrow.funded, "Escrow not found");
        require(!escrow.released, "Already released");
        require(!escrow.refunded, "Already refunded");

        escrow.released = true;

        (bool sent, ) = payable(escrow.vendorAddress).call{value: escrow.amount}("");
        require(sent, "Transfer to vendor failed");

        emit EscrowReleased(dealId, escrow.vendorAddress, escrow.amount);
    }

    /**
     * @notice Refund escrowed funds to the buyer
     * @param dealId The deal identifier
     */
    function refund(string calldata dealId) external onlyOwner {
        Escrow storage escrow = escrows[dealId];
        require(escrow.funded, "Escrow not found");
        require(!escrow.released, "Already released");
        require(!escrow.refunded, "Already refunded");

        escrow.refunded = true;

        (bool sent, ) = payable(escrow.buyer).call{value: escrow.amount}("");
        require(sent, "Refund to buyer failed");

        emit EscrowRefunded(dealId, escrow.buyer, escrow.amount);
    }

    /**
     * @notice Get the escrow details for a deal
     * @param dealId The deal identifier
     * @return The escrow struct
     */
    function getEscrow(string calldata dealId) external view returns (Escrow memory) {
        return escrows[dealId];
    }

    /**
     * @notice Get total number of escrows created
     */
    function getTotalEscrows() external view returns (uint256) {
        return dealIds.length;
    }

    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}
