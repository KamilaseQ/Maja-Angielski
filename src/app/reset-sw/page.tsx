const resetScript = `
(async function resetEnglishMvpCache() {
  try {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("english-mvp"))
          .map((key) => caches.delete(key))
      );
    }
  } finally {
    window.location.replace("/?sw-reset=" + Date.now());
  }
})();
`;

export default function ResetServiceWorkerPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-6 text-slate-900">
      <div className="rounded-2xl bg-white px-5 py-4 text-center shadow-sm">
        <p className="text-sm font-bold">Czyszcze cache aplikacji...</p>
        <p className="mt-1 text-xs text-slate-500">Za chwile wroce do panelu.</p>
      </div>
      <script dangerouslySetInnerHTML={{ __html: resetScript }} />
    </main>
  );
}
