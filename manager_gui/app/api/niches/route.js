import { NextResponse } from 'next/server';
import { getAllNiches } from '@/lib/nicheScanner';

export async function GET() {
  try {
    const niches = getAllNiches();
    return NextResponse.json({
      success: true,
      count: niches.length,
      niches
    });
  } catch (error) {
    console.error('Error fetching niches:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
