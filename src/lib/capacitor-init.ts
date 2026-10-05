import { Capacitor } from "@capacitor/core";

/** Native-only bootstrap; no-op on web — does not change UI or routing. */
export async function initCapacitor(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const [{ SplashScreen }, { StatusBar, Style }] = await Promise.all([
    import("@capacitor/splash-screen"),
    import("@capacitor/status-bar"),
  ]);

  try {
    await StatusBar.setStyle({ style: Style.Default });
  } catch {
    // Status bar plugin not available on all devices
  }

  await SplashScreen.hide();
}
