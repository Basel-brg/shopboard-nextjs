import { NextRequest, NextResponse } from 'next/server';
import { API_PRODUCTS_RAW } from '@/modules/products/products.api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const delayParam = searchParams.get('delay');
  const failParam = searchParams.get('fail');
  const emptyParam = searchParams.get('empty');
  const categoryParam = searchParams.get('category');

  if (delayParam && Number(delayParam) > 0) {
    const ms = Math.min(Number(delayParam), 10000);
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  if (failParam && Number(failParam) >= 400) {
    const code = Number(failParam);
    return NextResponse.json(
      { error: `Simulated server error (${code})`, statusCode: code },
      { status: code }
    );
  }

  if (emptyParam === 'true' || emptyParam === '1') {
    return NextResponse.json({ items: [], total: 0 });
  }

  let items = [...API_PRODUCTS_RAW];
  if (categoryParam && categoryParam !== 'الكل') {
    items = items.filter((p) => p.category_name === categoryParam);
  }

  return NextResponse.json({
    items,
    total: items.length,
  });
}
