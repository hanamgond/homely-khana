//frontend/src/app/layout.js
import Header from "@/shared/ui/Header";
import Footer from "@/shared/ui/Footer";
import { Providers } from "./providers";
import "@/shared/styles/globals.css";

export const metadata = {
  title: "HomelyKhana",
  description: "Homemade food delivery service",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main style={{ minHeight: "80vh" }}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}