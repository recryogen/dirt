interface Props {
  message: string;
  onClose: () => void;
}

export default function Toast({ message, onClose }: Props) {
  return (
    <div className="toast" role="alert">
      <span>{message}</span>
      <button type="button" className="toast__close" onClick={onClose} aria-label="Закрыть уведомление">
        X
      </button>
    </div>
  );
}
