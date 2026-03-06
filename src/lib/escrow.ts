import { ethers } from 'ethers';
import contractABI from './contract-abi.json';

const RPC_URLS = [
  process.env.BNB_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545',
  'https://data-seed-prebsc-2-s1.binance.org:8545',
  'https://bsc-testnet-rpc.publicnode.com',
  'https://data-seed-prebsc-1-s2.binance.org:8545',
];
const WALLET_PRIVATE_KEY = process.env.ESCROW_WALLET_PRIVATE_KEY || '';

// Safely normalize addresses — prevents EIP-55 checksum errors in ethers v6
function safeAddress(addr: string): string {
  if (!addr) return addr;
  try {
    return ethers.getAddress(addr.trim());
  } catch {
    return ethers.getAddress(addr.trim().toLowerCase());
  }
}

const CONTRACT_ADDRESS = safeAddress(process.env.ESCROW_CONTRACT_ADDRESS || '');

async function getProvider(): Promise<ethers.JsonRpcProvider> {
  for (const url of RPC_URLS) {
    try {
      const provider = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
      await provider.getBlockNumber();
      return provider;
    } catch {
      console.warn(`RPC ${url} failed, trying next...`);
    }
  }
  return new ethers.JsonRpcProvider(RPC_URLS[0]);
}

async function getWallet() {
  const provider = await getProvider();
  return new ethers.Wallet(WALLET_PRIVATE_KEY, provider);
}

async function getContract(signerOrProvider?: ethers.Signer | ethers.Provider) {
  const provider = signerOrProvider || await getProvider();
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
}

/**
 * Lock funds into escrow using native BNB.
 * The deployed contract requires msg.value to equal the amount parameter.
 */
export async function lockEscrow(
  dealId: string,
  vendorAddress: string,
  amountWei: bigint
): Promise<string> {
  const wallet = await getWallet();
  const contract = await getContract(wallet);
  const safeVendor = safeAddress(vendorAddress);

  // Send native BNB with the createEscrow call (contract requires msg.value == amount)
  const tx = await contract.createEscrow(dealId, safeVendor, amountWei, { value: amountWei });
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function releaseEscrow(dealId: string): Promise<string> {
  const wallet = await getWallet();
  const contract = await getContract(wallet);
  const tx = await contract.release(dealId);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function refundEscrow(dealId: string): Promise<string> {
  const wallet = await getWallet();
  const contract = await getContract(wallet);
  const tx = await contract.refund(dealId);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function getEscrowState(dealId: string) {
  const contract = await getContract();
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
