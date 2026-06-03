"use client";

import { useState } from "react";
import { Link2, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EvidenceLinksInputProps {
  value: string[];
  onChange: (links: string[]) => void;
}

export function EvidenceLinksInput({ value, onChange }: EvidenceLinksInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addLink() {
    const url = inputValue.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      setError("Enter a valid URL (e.g. https://...)");
      return;
    }
    if (value.includes(url)) {
      setError("Link already added");
      return;
    }
    onChange([...value, url]);
    setInputValue("");
    setError(null);
  }

  function removeLink(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3 rounded-3xl border border-dashed border-slate-900/15 bg-slate-50/90 p-5 dark:border-white/15 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
          <Link2 className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Evidence links</div>
          <div className="text-sm text-slate-500 dark:text-slate-400">Add news articles, social media posts, or any public URL as evidence.</div>
        </div>
      </div>

      <div className="flex gap-2">
        <Input
          type="url"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLink(); } }}
          placeholder="https://example.com/article"
          className="h-10 flex-1 rounded-2xl border-slate-900/10 bg-white/90 dark:border-white/10 dark:bg-white/5"
        />
        <Button type="button" onClick={addLink} variant="outline" className="h-10 rounded-2xl px-3">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((link, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-slate-900/10 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/5">
              <Link2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="flex-1 truncate text-xs text-slate-700 dark:text-slate-300">{link}</span>
              <button type="button" onClick={() => removeLink(i)} className="shrink-0 text-slate-400 hover:text-rose-600">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
