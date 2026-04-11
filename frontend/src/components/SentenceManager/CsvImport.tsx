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
      // failedFiles = HTTPレベルで失敗したファイルのみ（行レベルエラーは部分的に保存済みのため除外）
      if (res.failedFiles.length === 0) {
        setFiles([])
      } else {
        // リクエスト失敗したファイルのみ選択状態に残して再試行しやすくする
        setFiles(res.failedFiles)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      // throwされた場合も含め常にinputをクリアして同名ファイルの再選択でonChangeが発火するようにする
      if (fileRef.current) fileRef.current.value = ''
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
          {files.length === 0
            ? 'ファイルを選択...'
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
      {files.length > 1 && (
        <ul className="text-xs text-gray-400 ml-1 space-y-0.5">
          {files.map((f) => (
            <li key={`${f.name}-${f.lastModified}`}>{f.name}</li>
          ))}
        </ul>
      )}
      {error && <p className="text-red-400 text-sm whitespace-pre-line">{error}</p>}
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
