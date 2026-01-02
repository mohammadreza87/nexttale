interface ErrorAlertProps {
  title: string;
  message: string;
  onDismiss: () => void;
}

export function ErrorAlert({ title, message, onDismiss }: ErrorAlertProps) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-500/50 bg-red-900/30 p-4">
      <div className="font-semibold text-red-400">{title}:</div>
      <div className="flex-1 text-red-300">{message}</div>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-300">
        ✕
      </button>
    </div>
  );
}
