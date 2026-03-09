"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { THESIS_FIELDS } from "@/types/thesis";

interface ThesisFormValues {
  title: string;
  abstract?: string;
  field?: string;
}

interface ThesisFormProps {
  onSubmit: (values: ThesisFormValues) => void;
  isPending?: boolean;
  submitLabel?: string;
  initialTitle?: string;
  initialAbstract?: string;
  initialField?: string;
}

export function ThesisForm({
  onSubmit,
  isPending,
  submitLabel = "등록하기",
  initialTitle = "",
  initialAbstract = "",
  initialField = "",
}: ThesisFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [abstract, setAbstract] = useState(initialAbstract);
  const [field, setField] = useState(initialField);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      abstract: abstract.trim() || undefined,
      field: field || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="논문 제목을 입력하세요"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="field">분야</Label>
        <select
          id="field"
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <option value="">분야 선택 (선택사항)</option>
          {THESIS_FIELDS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="abstract">초록</Label>
        <Textarea
          id="abstract"
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          placeholder="논문 초록을 입력하세요 (선택사항)"
          rows={6}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!title.trim() || isPending}>
          {isPending ? "저장 중..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
