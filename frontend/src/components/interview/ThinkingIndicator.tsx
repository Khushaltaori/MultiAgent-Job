
export function ThinkingIndicator() {
  return (
    <div className="flex w-full gap-md justify-start font-body">
      {/* AI Avatar */}
      <div className="w-10 h-10 rounded-xl bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary flex-shrink-0 select-none shadow">
        <span className="material-symbols-outlined text-lg leading-none select-none animate-pulse">
          smart_toy
        </span>
      </div>

      {/* Typing Bubble */}
      <div className="bg-surface-container border border-outline-variant rounded-2xl rounded-tl-none px-md py-md flex items-center gap-[4px]">
        <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1.4s_infinite_0.2s_ease-in-out]" />
        <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1.4s_infinite_0.4s_ease-in-out]" />
        <div className="w-2 h-2 rounded-full bg-primary animate-[bounce_1.4s_infinite_0.6s_ease-in-out]" />
      </div>
    </div>
  );
}
