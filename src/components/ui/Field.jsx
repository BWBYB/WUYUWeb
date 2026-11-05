// 表单字段：只负责 label / hint / error 的结构，控件本身用 .control 类。
export default function Field({ label, hint, error, className = '', children }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span className="field__label">{label}</span>
      {children}
      {error
        ? <span className="field__error">{error}</span>
        : hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}
