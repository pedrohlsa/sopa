import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://pedirsopa.com.br"),
  title: "Sopa Boa | Sopa delivery perto de você no Rio",
  description: "Encontre cozinhas parceiras e peça caldos de 500 ml a partir de R$ 19,90, com entrega local no Rio e pagamento via Pix.",
  openGraph: {
    title: "Sopa Boa | Sopa quentinha, pertinho de você",
    description: "Caldos de 500 ml a partir de R$ 19,90, preparados por cozinhas parceiras no Rio.",
    images: [{ url: "/og.png", width: 1729, height: 909, alt: "Sopa Boa — sopa quentinha, pertinho de você" }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sopa Boa | Sopa quentinha, pertinho de você",
    description: "Caldos de 500 ml a partir de R$ 19,90, preparados por cozinhas parceiras no Rio.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
