// Import your global styles here. This is the correct place in the App Router.
import "@/styles/globals.css";
import "react-datepicker/dist/react-datepicker.css";

// Import your new AppWrapper component
import AppWrapper from './AppWrapper';

export default function RootLayout({ children }) {
  return (
    // The lang="en" from _document.js now goes here
    <html lang="en">
      <body>
        <AppWrapper>
          {children}
        </AppWrapper>

        {/* The custom script from _document.js now goes here,
            right before the closing </body> tag. */}
        <script src="/olamaps-web-sdk.umd.js" defer></script>
      </body>
    </html>
  );
}

