import { useRef, useState } from 'react'
import { useSentenceStore } from '../../stores/sentenceStore'
import type { ImportResult } from '../../lib/sentences'

export function CsvImport({ onClose }: { onClose: () => void }) {
  const importCsv = useSentenceStore((s) => s.importCsv)
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setError(null)
    setResult(null)
    try {
      const res = await importCsv(file)
      setResult(res)
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-3">
      <p className="text-gray-400 text-sm">
        CSV フォーマット: ヘッダー行あり、<code className="text-indigo-400">text</code> 列必須、
        <code className="text-indigo-400">note</code> 列任意
      </p>
      <div className="flex items-center gap-3">
        <label className="cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors">
          {file ? file.name : 'ファイルを選択...'}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {importing ? 'インポート中...' : 'インポート'}
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
        >
          閉じる
        </button>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {result && (
        <div className="text-sm space-y-1">
          <p className="text-green-400">
            作成: <strong>{result.created}</strong>件 / スキップ（重複）:{' '}
            <strong>{result.skipped}</strong>件
          </p>
          {result.errors.length > 0 && (
            <details className="text-yellow-400">
              <summary className="cursor-pointer">エラー {result.errors.length}件</summary>
              <ul className="mt-1 ml-4 list-disc space-y-1 text-xs text-yellow-300">
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
