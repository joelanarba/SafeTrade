import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { ethers } from 'ethers';

const RPC_URL = process.env.BNB_TESTNET_RPC_URL || 'https://data-seed-prebsc-1-s1.binance.org:8545';
const CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { txHash, dealId, buyerName, buyerPhone, buyerEmail } = body;

    if (!txHash || !dealId) {
      return NextResponse.json({ error: 'Missing txHash or dealId' }, { status: 400 });
    }

    // Verify transaction on-chain
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Wait for the transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return NextResponse.json({ error: 'Transaction not found or unconfirmed' }, { status: 404 });
    }

    if (receipt.status !== 1) {
      return NextResponse.json({ error: 'Transaction failed on-chain' }, { status: 400 });
    }

    if (receipt.to?.toLowerCase() !== CONTRACT_ADDRESS.toLowerCase()) {
      return NextResponse.json({ error: 'Transaction not sent to Escrow Contract' }, { status: 400 });
    }

    // Check deal status in Firestore
    const dealRef = adminDb.collection('deals').doc(dealId);
    const dealSnap = await dealRef.get();

    if (!dealSnap.exists) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = dealSnap.data();

    if (deal?.status !== 'pending_payment') {
      return NextResponse.json({ error: 'Deal already paid or active' }, { status: 400 });
    }

    // Update Firestore to mark as paid securely
    await dealRef.update({
      status: 'in_escrow',
      escrowTxHash: txHash,
      buyerName: buyerName || deal?.buyerName,
      buyerPhone: buyerPhone || deal?.buyerPhone,
      buyerEmail: buyerEmail || deal?.buyerEmail,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, message: 'Web3 payment verified and deal activated' });
  } catch (error) {
    console.error('Web3 Verification Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
