import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  // Use ONE consistent URL - choose either with or without www
  metadataBase: new URL("https://share-maps.online"),

  title: "Google Maps",
  description: "Google Maps Address",

  openGraph: {
    title: "Google Maps",
    description: "Google Maps Address",
    // Make sure this matches your metadataBase
    url: "https://share-maps.online",
    siteName: "Google Maps",
    images: [
      {
        // Add a version number to force refresh
        url: "https://share-maps.online/thumbnail.png?v=2",
        width: 1200,
        height: 630,
        alt: "Google Maps",
      },
    ],
    locale: "en_US",
    type: "website",
    // Add Facebook App ID if you have one (optional)
    // fbAppId: "YOUR_APP_ID",
  },

  twitter: {
    card: "summary_large_image",
    title: "Google Maps",
    description: "Google Maps Address",
    images: ["https://share-maps.online/thumbnail.png?v=2"],
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster position="top-right" />
        {children}
      </body>
    </html>
  );
}