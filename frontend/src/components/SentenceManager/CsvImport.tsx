import { useRef, useState } from 'react'
import { useSentenceStore } from '../../stores/sentenceStore'
import type { ImportResult } from '../../lib/sentences'

export function CsvImport({ onClose }: { onClose: () => void }) {
  const importCsv = useSentenceStore((s) => s.importCsv)
  const fileRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    if (files.length === 0) return
    setImporting(true)
    setError(null)
    setResult(null)
    try {
      const res = await importCsv(files)
      setResult(res)
      if (res.failedFiles.length === 0) {
        setFiles([])
      } else {
        setFiles(res.failedFiles)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      if (fileRef.current) fileRef.current.value = ''
      setImporting(false)
    }
  }

  return (
    <div className="app-card-soft space-y-5 p-5">
      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-900">CSV インポート</h3>
        <p className="text-sm text-slate-500">
          ヘッダー行ありの CSV をまとめて読み込みます。<code className="font-mono text-[#1d4ed8]">text</code> 列は必須、
          <code className="font-mono text-[#1d4ed8]">note</code> 列は任意です。
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="app-button app-button-subtle cursor-pointer">
          {files.length === 0
            ? 'ファイルを選択'
            : files.length === 1
              ? files[0].name
              : `${files.length} 件のファイルを選択`}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </label>
        <button
          onClick={handleImport}
          disabled={files.length === 0 || importing}
          className="app-button app-button-primary"
        >
          {importing ? 'インポート中...' : 'インポート'}
        </button>
        <button
          onClick={onClose}
          className="app-button app-button-subtle"
        >
          閉じる
        </button>
      </div>

      {files.length > 1 && (
        <ul className="ml-1 space-y-0.5 text-xs text-slate-500">
          {files.map((f) => (
            <li key={`${f.name}-${f.lastModified}`}>{f.name}</li>
          ))}
        </ul>
      )}

      {error && <p className="whitespace-pre-line text-sm text-rose-600">{error}</p>}

      {result && (
        <div className="space-y-2 text-sm">
          <p className="text-emerald-600">
            作成: <strong>{result.created}</strong>件 / スキップ（重複）:{' '}
            <strong>{result.skipped}</strong>件
          </p>
          {result.errors.length > 0 && (
            <details className="app-banner app-banner-warning">
              <summary className="cursor-pointer">エラー {result.errors.length}件</summary>
              <ul className="mt-2 ml-4 list-disc space-y-1 text-xs text-amber-700">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
