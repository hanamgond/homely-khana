import "@/shared/styles/globals.css";
import Header from "@/shared/ui/Header";
import Footer from "@/shared/ui/Footer";
import { Providers } from "./providers"; // Import the wrapper

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main style={{ minHeight: "80vh" }}>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}