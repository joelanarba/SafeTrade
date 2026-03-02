import { ethers } from 'ethers';
import contractABI from './contract-abi.json';

const RPC_URL = process.env.BNB_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
const CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || '';
const WALLET_PRIVATE_KEY = process.env.ESCROW_WALLET_PRIVATE_KEY || '';

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
  const tx = await contract.createEscrow(dealId, vendorAddress, amountWei, {
    value: amountWei,
  });
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
