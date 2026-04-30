const WORD_FILES = [
  { label: 'GRE Sample (25)', value: 'gre-sample' },
]

export default function Controls({ selectedFile, onFileChange, onCheck, onReset }) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={selectedFile}
        onChange={(e) => onFileChange(e.target.value)}
        className="bg-slate-800 text-slate-200 border border-slate-600 rounded px-3 py-2 text-sm"
      >
        {WORD_FILES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <button
        onClick={onCheck}
        className="bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded px-4 py-2 text-sm transition-colors"
      >
        Check
      </button>
      <button
        onClick={onReset}
        className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold rounded px-4 py-2 text-sm transition-colors"
      >
        Reset
      </button>
    </div>
  )
}

export { WORD_FILES }
