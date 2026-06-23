import { NextResponse } from 'next/server';
import { NotionAPI } from 'notion-client';

const notion = new NotionAPI();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageId = searchParams.get('id');

  if (!pageId) {
    return NextResponse.json({ error: 'Missing Notion page ID' }, { status: 400 });
  }

  try {
    // This fetches the raw block data (recordMap) from a public Notion page
    const recordMap = await notion.getPage(pageId);
    return NextResponse.json(recordMap);
  } catch (error) {
    console.error("Notion fetch error:", error);
    return NextResponse.json({ error: 'Failed to fetch Notion page' }, { status: 500 });
  }
}