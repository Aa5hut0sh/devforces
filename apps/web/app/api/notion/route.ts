import { NextResponse } from 'next/server';
import { NotionAPI } from 'notion-client';

// Pass a browser User-Agent so Cloudflare doesn't block the request with a 403
const notion = new NotionAPI({
  ofetchOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    },
  },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get('id');

  if (!rawId) {
    return NextResponse.json({ error: 'Missing Notion page ID' }, { status: 400 });
  }

  // Extract the 32-character Notion ID whether it's a full URL or raw ID
  const match = rawId.match(/[a-f0-9]{32}/i);
  if (!match) {
    return NextResponse.json({ error: 'Invalid Notion ID or URL format' }, { status: 400 });
  }

  const pageId = match[0];

  try {
    const recordMap = await notion.getPage(pageId);
    return NextResponse.json(recordMap);
  } catch (error) {
    console.error("Notion fetch error:", error);
    return NextResponse.json({ error: 'Failed to fetch Notion page' }, { status: 500 });
  }
}