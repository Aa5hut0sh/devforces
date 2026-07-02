"use client";

import { useState} from "react";
import dynamic from "next/dynamic";
import {
  VscFolder,
  VscFile,
  VscChevronDown,
  VscChevronRight,
} from "react-icons/vsc";


export default function FileTree({
  files,
  editableFiles,
  selected,
  onSelect,
}: {
  files: Record<string, string>;
  editableFiles: string[];
  selected: string;
  onSelect: (path: string) => void;
}) {
  // Group files by their directory
  const tree: Record<string, string[]> = { "/": [] };

  Object.keys(files)
    .sort()
    .forEach((path) => {
      const parts = path.split("/");
      if (parts.length === 1) {
        tree["/"].push(path);
      } else {
        const dir = parts.slice(0, -1).join("/");
        if (!tree[dir]) tree[dir] = [];
        tree[dir].push(path);
      }
    });

  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>(
    Object.keys(tree).reduce((acc, dir) => ({ ...acc, [dir]: true }), {}),
  );

  const toggleDir = (dir: string) => {
    setExpandedDirs((prev) => ({ ...prev, [dir]: !prev[dir] }));
  };

  const renderFile = (path: string, depth: number) => {
    const isEditable = editableFiles.includes(path);
    const isSelected = selected === path;
    const name = path.split("/").pop();

    return (
      <button
        key={path}
        onClick={() => onSelect(path)}
        style={{ paddingLeft: `${16 + depth * 12}px` }}
        className={`w-full flex items-center gap-2 py-1.5 pr-3 text-[13px] font-mono rounded-md transition-colors ${
          isSelected
            ? "bg-[#FF9FFC]/20 text-[#FF9FFC]"
            : isEditable
              ? "text-zinc-300 hover:bg-zinc-800/50"
              : "text-zinc-600 hover:bg-zinc-800/30 cursor-not-allowed"
        }`}
      >
        <VscFile
          className={isSelected ? "text-[#FF9FFC]" : "text-zinc-500"}
          size={14}
        />
        <span className="truncate">{name}</span>
        {!isEditable && (
          <span className="ml-auto text-[9px] uppercase tracking-widest opacity-40">
            R/O
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-0.5 py-3 px-2">
      {/* Root Files */}
      {tree["/"].map((path) => renderFile(path, 0))}

      {/* Directories */}
      {Object.keys(tree)
        .filter((d) => d !== "/")
        .map((dir) => (
          <div key={dir} className="flex flex-col">
            <button
              onClick={() => toggleDir(dir)}
              className="flex items-center gap-1.5 w-full text-left py-1.5 px-2 text-[13px] font-mono text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {expandedDirs[dir] ? (
                <VscChevronDown size={14} />
              ) : (
                <VscChevronRight size={14} />
              )}
              <VscFolder className="text-violet-400" size={14} />
              <span className="truncate">{dir}</span>
            </button>

            {expandedDirs[dir] && (
              <div className="flex flex-col gap-0.5 mt-0.5">
                {tree[dir].map((path) => renderFile(path, 1))}
              </div>
            )}
          </div>
        ))}
    </div>
  );
}