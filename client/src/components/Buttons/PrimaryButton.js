export default function PrimaryBtn({ onClick, children, type = "button", disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2.5 rounded-xl text-white text-sm font-semibold transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
      style={{
        background: "linear-gradient(135deg, #2E93C7, #0D6D91)",
      }}
    >
      {children}
    </button>
  );
}
