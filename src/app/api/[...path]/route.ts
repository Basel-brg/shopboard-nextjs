import { NextRequest, NextResponse } from 'next/server';
import { API_PRODUCTS_RAW } from '@/modules/products/products.api';

interface Switches {
  delayMs: number;
  failStatus: number | null;
  empty: boolean;
}

function readSwitches(pathSegments: string[]): { switches: Switches; rest: string[] } {
  const switches: Switches = { delayMs: 0, failStatus: null, empty: false };
  let rest = [...pathSegments];

  while (rest.length > 0) {
    const [name, value] = rest;
    if (name === 'delay' && Number(value) > 0) {
      switches.delayMs = Math.min(Number(value), 10000);
      rest = rest.slice(2);
    } else if (name === 'fail' && Number(value) >= 400) {
      switches.failStatus = Number(value);
      rest = rest.slice(2);
    } else if (name === 'empty') {
      switches.empty = true;
      rest = rest.slice(1);
    } else {
      break;
    }
  }

  return { switches, rest };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path = [] } = await context.params;
  const { switches, rest } = readSwitches(path);

  // Apply simulated delay if requested (e.g. /api/delay/3000/products)
  if (switches.delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, switches.delayMs));
  }

  // Apply simulated error if requested (e.g. /api/fail/500/products)
  if (switches.failStatus) {
    return NextResponse.json(
      {
        error: `Simulated error state (${switches.failStatus}) for testing error boundaries and retry logic.`,
        statusCode: switches.failStatus,
      },
      { status: switches.failStatus }
    );
  }

  // Handle route targets
  const target = rest.join('/');

  if (target === 'products' || target === '') {
    if (switches.empty) {
      return NextResponse.json({
        items: [],
        total: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    let items = [...API_PRODUCTS_RAW];
    if (category && category !== 'الكل') {
      items = items.filter((p) => p.category_name === category);
    }

    return NextResponse.json({
      items,
      total: items.length,
    });
  }

  return NextResponse.json(
    { error: `Endpoint /api/${target} not found` },
    { status: 404 }
  );
}
