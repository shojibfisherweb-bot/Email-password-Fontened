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
  metadataBase: new URL("https://yourdomain.com"), // আপনার ডোমেইন দিন

  title: "Google Maps",
  description: "Google Maps Address",

  openGraph: {
    title: "Google Maps",
    description: "Google Maps Address",
    url: "https://yourdomain.com",
    siteName: "Google Maps",
    images: [
      {
        url: "/thumbnail.jpg", // public/thumbnail.jpg
        width: 1200,
        height: 630,
        alt: "Google Maps",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Google Maps",
    description: "Google Maps Address",
    images: ["/thumbnail.png"],
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