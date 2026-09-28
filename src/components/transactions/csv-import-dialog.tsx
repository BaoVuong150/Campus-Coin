"use client";

import { useId, useMemo, useState } from "react";
import { AlertCircle, Download, FileUp } from "lucide-react";
import { Amount } from "@/components/common/amount";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Select } from "@/components/ui/field";
import { useToast } from "@/context/ToastContext";
import { suggestCategories, useCategories } from "@/hooks/use-categories";
import { useTransactionMutations } from "@/hooks/use-transactions";
import { useI18n } from "@/i18n/provider";
import {
  hasRequiredColumns,
  mapHeaders,
  MAX_IMPORT_ROWS,
  parseRecords,
  type ParsedRow,
} from "@/lib/csv/transactions-csv";
import { normalizeText } from "@/lib/finance/categorize";
import { formatDate, ymdToStorageDate } from "@/lib/utils/date";
import type { CategoryDTO } from "@/types/finance";

interface PreviewRow {
  row: ParsedRow;
  categoryId: number | null;
}

type Step = { kind: "pick"; error?: string } | { kind: "busy"; message: string } | { kind: "preview"; rows: PreviewRow[] };

const TEMPLATE_HEADER = ["date", "description", "amount", "type", "category"];

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Danh mục theo tên trong file (so khớp không dấu với tên gốc hoặc tên đã dịch), cùng loại thu/chi. */
function matchCategory(categories: CategoryDTO[], name: string | null, type: string, localize: (n: string) => string) {
  if (!name) return null;
  const key = normalizeText(name);
  return categories.find((c) => c.type === type && (normalizeText(c.name) === key || normalizeText(localize(c.name)) === key))?.id ?? null;
}

export function CsvImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, fmt } = useI18n();
  const l = t.csv;
  const { toast } = useToast();
  const { data: categories = [] } = useCategories();
  const { importRows } = useTransactionMutations();
  const inputId = useId();
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [importing, setImporting] = useState(false);

  const preview = useMemo(() => (step.kind === "preview" ? step.rows : []), [step]);
  const valid = useMemo(() => preview.filter((p) => p.row.errors.length === 0), [preview]);
  const ready = valid.filter((p) => p.categoryId !== null);

  const downloadTemplate = () => {
    const lines = [TEMPLATE_HEADER, ...l.templateRows].map((cols) => cols.map(csvEscape).join(","));
    const blob = new Blob([`﻿${lines.join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), { href: url, download: "campus-coin-template.csv" });
    link.click();
    URL.revokeObjectURL(url);
  };

  const readFile = async (file: File) => {
    setStep({ kind: "busy", message: l.parsing });
    try {
      const Papa = (await import("papaparse")).default;
      const parsed = await new Promise<{ data: Record<string, string>[]; fields: string[] }>((resolve, reject) =>
        Papa.parse<Record<string, string>>(file, {
          header: true,
          skipEmptyLines: "greedy",
          complete: (result) => resolve({ data: result.data, fields: result.meta.fields ?? [] }),
          error: reject,
        })
      );
      const mapping = mapHeaders(parsed.fields);
      if (!hasRequiredColumns(mapping)) return setStep({ kind: "pick", error: l.missingColumns });
      if (parsed.data.length > MAX_IMPORT_ROWS) return setStep({ kind: "pick", error: l.tooMany(MAX_IMPORT_ROWS) });

      const rows = parseRecords(parsed.data, mapping);
      const matched = rows.map((row) => matchCategory(categories, row.categoryName, row.type, fmt.category));
      const needSuggestion = rows
        .map((row, i) => ({ row, i }))
        .filter(({ row, i }) => row.errors.length === 0 && matched[i] === null);

      if (needSuggestion.length > 0) {
        setStep({ kind: "busy", message: l.suggesting });
        const suggestions = await suggestCategories(needSuggestion.map(({ row }) => ({ text: row.description, type: row.type })));
        needSuggestion.forEach(({ i }, k) => {
          matched[i] = suggestions[k]?.categoryId ?? null;
        });
      }
      setStep({ kind: "preview", rows: rows.map((row, i) => ({ row, categoryId: matched[i] })) });
    } catch {
      setStep({ kind: "pick", error: l.readFailed });
    }
  };

  const setCategory = (index: number, categoryId: number) => {
    if (step.kind !== "preview") return;
    setStep({ kind: "preview", rows: step.rows.map((p, i) => (i === index ? { ...p, categoryId } : p)) });
  };

  const submit = async () => {
    setImporting(true);
    try {
      const result = await importRows(
        ready.map(({ row, categoryId }) => ({
          date: row.date!,
          description: row.description,
          amount: row.amount,
          type: row.type,
          category_id: categoryId!,
        })),
        skipDuplicates
      );
      toast.success(l.done(result.imported, result.skipped));
      onClose();
    } catch (error) {
      toast.error(l.failed, fmt.error(error));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={l.title}
      description={l.description}
      footer={
        step.kind === "preview" ? (
          <>
            <Button variant="outline" onClick={() => setStep({ kind: "pick" })} disabled={importing}>
              {l.chooseAnother}
            </Button>
            <Button onClick={submit} loading={importing} disabled={ready.length === 0}>
              {l.submit(ready.length)}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>
            {t.common.cancel}
          </Button>
        )
      }
    >
      {step.kind !== "preview" ? (
        <div className="space-y-4">
          <label
            htmlFor={inputId}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-10 text-center transition-colors hover:bg-surface-hover"
          >
            <FileUp className="size-6 text-primary-ink" aria-hidden />
            <span className="text-sm font-medium text-foreground">{step.kind === "busy" ? step.message : l.chooseFile}</span>
            <span className="max-w-md text-[12px] text-muted">{l.dropHint}</span>
            <span className="max-w-md text-[12px] text-subtle">{l.formatHint}</span>
            <input
              id={inputId}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              disabled={step.kind === "busy"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void readFile(file);
              }}
            />
          </label>
          {step.kind === "pick" && step.error && (
            <p className="flex items-center gap-2 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger" role="alert">
              <AlertCircle className="size-4 shrink-0" aria-hidden /> {step.error}
            </p>
          )}
          <Button variant="ghost" size="sm" onClick={downloadTemplate}>
            <Download /> {l.downloadTemplate}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[13px] text-muted" aria-live="polite">
            {l.summary(valid.length, preview.length - valid.length)}
          </p>
          <div className="max-h-[50dvh] overflow-auto rounded-md border border-border">
            <table className="w-full min-w-[560px] text-[13px]">
              <thead className="sticky top-0 bg-surface-secondary text-left text-[12px] text-muted">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">{l.row}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t.transactions.table.date}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t.transactions.table.transaction}</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">{t.transactions.table.amount}</th>
                  <th scope="col" className="px-3 py-2 font-medium">{t.transactions.table.category}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map(({ row, categoryId }, index) => (
                  <tr key={row.line} className={row.errors.length ? "bg-danger-soft/40" : undefined}>
                    <td className="tabular px-3 py-2 text-subtle">{row.line}</td>
                    <td className="tabular px-3 py-2 whitespace-nowrap text-muted">{row.date ? formatDate(ymdToStorageDate(row.date)) : "—"}</td>
                    <td className="max-w-48 truncate px-3 py-2 text-foreground">{row.description || "—"}</td>
                    <td className="px-3 py-2 text-right">{row.amount > 0 ? <Amount value={row.amount} type={row.type} /> : "—"}</td>
                    <td className="px-3 py-2">
                      {row.errors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {row.errors.map((e) => (
                            <Badge key={e} tone="danger">
                              {l.rowErrors[e]}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Select
                          aria-label={`${t.transactions.table.category} – ${l.row} ${row.line}`}
                          value={categoryId ?? ""}
                          onChange={(e) => setCategory(index, Number(e.target.value))}
                          className="h-8 min-w-36 text-[13px]"
                        >
                          {categoryId === null && <option value="">—</option>}
                          {categories
                            .filter((c) => c.type === row.type)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {fmt.category(c.name)}
                              </option>
                            ))}
                        </Select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground">
            <input type="checkbox" checked={skipDuplicates} onChange={(e) => setSkipDuplicates(e.target.checked)} className="size-4 accent-primary" />
            {l.skipDuplicates}
          </label>
        </div>
      )}
    </Dialog>
  );
}
