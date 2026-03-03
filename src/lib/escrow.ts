import { ethers } from 'ethers';
import contractABI from './contract-abi.json';

const RPC_URL = process.env.BNB_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
const CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || '';
const WALLET_PRIVATE_KEY = process.env.ESCROW_WALLET_PRIVATE_KEY || '';
const USDT_ADDRESS = process.env.MOCK_USDT_ADDRESS || '';

// Minimal ERC20 ABI for approving token transfers
const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

function getProvider() {
  return new ethers.JsonRpcProvider(RPC_URL);
}

function getWallet() {
  const provider = getProvider();
  return new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
}

function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const provider = signerOrProvider || getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
}

export async function lockEscrow(
  dealId: string,
  vendorAddress: string,
  amountWei: bigint
): Promise<string> {
  const wallet = getWallet();
  const contract = getContract(wallet);

  // Approve USDT for EscrowFactory
  if (USDT_ADDRESS) {
    const usdt = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, wallet);
    const allowance = await usdt.allowance(wallet.address, CONTRACT_ADDRESS);
    
    if (allowance < amountWei) {
      console.log(`Approving USDT allowance for escrow contract: ${amountWei.toString()}`);
      const appTx = await usdt.approve(CONTRACT_ADDRESS, amountWei);
      await appTx.wait();
    }
  }

  // Use createEscrow without `value` since we're using ERC20 now
  const tx = await contract.createEscrow(dealId, vendorAddress, amountWei);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function releaseEscrow(dealId: string): Promise<string> {
  const wallet = getWallet();
  const contract = getContract(wallet);
  const tx = await contract.release(dealId);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function refundEscrow(dealId: string): Promise<string> {
  const wallet = getWallet();
  const contract = getContract(wallet);
  const tx = await contract.refund(dealId);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function getEscrowState(dealId: string) {
  const contract = getContract();
  const escrow = await contract.getEscrow(dealId);
  return {
    dealId: escrow.dealId,
    vendorAddress: escrow.vendorAddress,
    amount: escrow.amount,
    funded: escrow.funded,
    released: escrow.released,
    refunded: escrow.refunded,
  };
}
