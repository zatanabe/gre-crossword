const WORD_FILES = [
  { label: 'GRE Sample (25)', value: 'gre-sample' },
]

export default function Controls({ selectedFile, onFileChange, onCheck, onReset, onReveal }) {
  return (
    <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center text-sm">
      <select
        value={selectedFile}
        onChange={(e) => onFileChange(e.target.value)}
        className="bg-white text-gray-800 border border-gray-300 rounded px-2 py-1.5"
      >
        {WORD_FILES.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>
      <button
        onClick={onReveal}
        className="text-gray-600 hover:text-black border-b border-gray-400 hover:border-black pb-0.5 transition-colors"
      >
        Reveal
      </button>
      <button
        onClick={onReset}
        className="text-gray-600 hover:text-black border-b border-gray-400 hover:border-black pb-0.5 transition-colors"
      >
        Clear
      </button>
      <button
        onClick={onCheck}
        className="text-gray-600 hover:text-black border-b border-gray-400 hover:border-black pb-0.5 transition-colors"
      >
        Check
      </button>
    </div>
  )
}

export { WORD_FILES }
