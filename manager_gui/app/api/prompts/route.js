import { NextResponse } from 'next/server';
import { getContextualPrompts } from '@/lib/promptParser';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const collection = searchParams.get('collection') || '';
    const title = searchParams.get('title') || '';
    const stratPath = searchParams.get('stratPath') || searchParams.get('path') || '';
    const architecture = searchParams.get('architecture') || '';
    const segmentsParam = searchParams.get('segments');
    let segments = [];
    if (segmentsParam) {
      try {
        segments = JSON.parse(segmentsParam);
      } catch {
        segments = segmentsParam.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    let productsJson = null;
    const productsParam = searchParams.get('products') || searchParams.get('productsJson');
    if (productsParam) {
      try {
        productsJson = JSON.parse(productsParam);
      } catch {
        productsJson = productsParam;
      }
    }

    const prompts = getContextualPrompts(category, collection, title, {
      stratPath,
      architecture,
      segments,
      productsJson
    });

    return NextResponse.json({
      success: true,
      category,
      collection,
      architecture,
      count: prompts.length,
      prompts
    });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
