import { NextResponse } from 'next/server';
import { auditNiche } from '@/lib/qaAuditor';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const collection = searchParams.get('collection');
    const segment = searchParams.get('segment');

    if (!category || !collection) {
      return NextResponse.json({ success: false, error: 'Category and collection are required' }, { status: 400 });
    }

    const report = auditNiche(category, collection, segment);

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error running audit:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { category, collection, segment, segmentName } = body;

    if (!category || !collection) {
      return NextResponse.json({ success: false, error: 'Category and collection are required' }, { status: 400 });
    }

    const report = auditNiche(category, collection, segment || segmentName);

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error running audit POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
