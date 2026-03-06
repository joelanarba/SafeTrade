import { NextRequest, NextResponse } from 'next/server';
import { ethers } from 'ethers';

const RPC_URL = process.env.BNB_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';

export async function GET(req: NextRequest) {
  const txHash = req.nextUrl.searchParams.get('hash');

  if (!txHash) {
    return NextResponse.json({ exists: false, error: 'Missing hash parameter' }, { status: 400 });
  }

  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (receipt) {
      return NextResponse.json({
        exists: true,
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
      });
    }

    return NextResponse.json({ exists: false });
  } catch (error) {
    console.error('Error checking transaction:', error);
    return NextResponse.json({ exists: false, error: 'RPC error' }, { status: 500 });
  }
}
