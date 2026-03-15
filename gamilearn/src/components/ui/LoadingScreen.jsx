/**
 * Reusable full-page or inline loading state with spinner and friendly message.
 * Use for initial page load, auth check, or section loading.
 */
const LoadingScreen = ({
  message = "Loading…",
  subMessage = null,
  inline = false,
  className = "",
}) => {
  const content = (
    <>
      <div
        className="h-10 w-10 shrink-0 rounded-full border-2 border-[#4e9a8e] border-t-transparent animate-spin"
        aria-hidden
      />
      <p className="text-sm font-medium text-[#d8d0c4] mt-3">{message}</p>
      {subMessage && (
        <p className="text-xs text-[#706858] mt-1 max-w-xs text-center">
          {subMessage}
        </p>
      )}
    </>
  );

  if (inline) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-0 py-8 ${className}`}
        role="status"
        aria-live="polite"
        aria-label={message}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={`min-h-[50vh] flex flex-col items-center justify-center gap-0 text-center px-4 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {content}
    </div>
  );
};

export default LoadingScreen;
