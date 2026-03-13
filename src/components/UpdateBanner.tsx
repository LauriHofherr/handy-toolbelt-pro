import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-primary text-primary-foreground px-4 py-3 flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top duration-300">
      <span className="text-sm font-medium font-display">A new version is available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="shrink-0 rounded-md bg-primary-foreground text-primary px-4 py-1.5 text-sm font-semibold tap-target"
      >
        Tap to Update
      </button>
    </div>
  );
}
