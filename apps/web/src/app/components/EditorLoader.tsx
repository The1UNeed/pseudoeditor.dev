type EditorLoaderProps = {
  fullScreen?: boolean;
};

/** The single loading indicator shown while the workspace, editor, or flowchart loads. */
export function EditorLoader({ fullScreen = false }: EditorLoaderProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`flex items-center justify-center bg-[var(--bg)] ${
        fullScreen ? "min-h-dvh" : "h-full min-h-[240px]"
      }`}
    >
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--surface3)] border-t-[var(--text2)]" />
    </div>
  );
}
