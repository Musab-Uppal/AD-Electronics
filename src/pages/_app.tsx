import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import { useEffect, useState } from "react";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-plex-mono",
});

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isLoginPage = router.pathname === "/login";
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  useEffect(() => {
    function handleRouteChangeStart() {
      setIsRouteLoading(true);
    }

    function handleRouteChangeEnd() {
      setIsRouteLoading(false);
    }

    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeEnd);
    router.events.on("routeChangeError", handleRouteChangeEnd);

    return () => {
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeEnd);
      router.events.off("routeChangeError", handleRouteChangeEnd);
    };
  }, [router.events]);

  return (
    <div className={`${manrope.variable} ${plexMono.variable}`}>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      {isRouteLoading ? (
        <div className="fixed inset-0 z-90 flex items-center justify-center bg-slate-950/20 backdrop-blur-[1px]">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600" />
        </div>
      ) : null}
      {isLoginPage ? (
        <Component {...pageProps} />
      ) : (
        <Layout>
          <Component {...pageProps} />
        </Layout>
      )}
    </div>
  );
}
