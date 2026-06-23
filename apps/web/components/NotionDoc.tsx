"use client";

import { useEffect, useState } from 'react';
import { NotionRenderer } from 'react-notion-x';
import 'react-notion-x/src/styles.css';


export default function NotionDoc({ pageId }: { pageId: string }) {
  const [recordMap, setRecordMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!pageId || pageId === "placeholder") {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/notion?id=${pageId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        setRecordMap(data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [pageId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-5 h-5 rounded-full border-2 border-[#4d2562] border-t-[#FF9FFC] animate-spin" />
        <p className="text-xs font-mono text-zinc-500">Decrypting problem statement...</p>
      </div>
    );
  }

  if (error || !recordMap) {
    return (
      <div className="text-center py-20 text-red-400 bg-red-400/10 rounded-2xl border border-red-400/20">
        <p className="font-mono text-sm">Failed to load problem statement.</p>
        <p className="text-xs mt-2 text-zinc-500">Check if the Notion page is public.</p>
      </div>
    );
  }

  return (
    <div className="notion-devforces-theme">
      {/* Custom styles injected directly to override Notion's defaults */}
      <style dangerouslySetInnerHTML={{__html: `
        .notion-devforces-theme {
          --notion-font: 'Inter', sans-serif;
          color: #e4e4e7; /* text-zinc-200 */
        }
        .notion-devforces-theme .notion-text {
          line-height: 1.7;
          font-size: 15px;
        }
        .notion-devforces-theme .notion-h1, 
        .notion-devforces-theme .notion-h2, 
        .notion-devforces-theme .notion-h3 {
          color: #ffffff;
          font-weight: 700;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .notion-devforces-theme .notion-code {
          background: #0a0a0c !important;
          border: 1px solid rgba(77, 37, 98, 0.4);
          border-radius: 8px;
          color: #FF9FFC;
        }
        .notion-devforces-theme .notion-asset-wrapper {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
        }
      `}} />
      <NotionRenderer 
        recordMap={recordMap} 
        fullPage={false} 
        darkMode={true} 
      />
    </div>
  );
}