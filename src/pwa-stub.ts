// Used by the single-file preview build, which can't run a service worker.
export function registerSW() {
  return () => Promise.resolve();
}
