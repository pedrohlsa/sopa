import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://pedirsopa.com.br"),
  title: "Sopa Boa | Sopa delivery perto de você no Rio",
  description: "Caldos de 500 ml a partir de R$ 19,90, entregues quentinhos em 25 a 35 min no Rio e na Baixada. Pagamento no Pix.",
  openGraph: {
    title: "Sopa Boa | Sopa quentinha chegando na sua casa",
    description: "Caldos de 500 ml a partir de R$ 19,90, entrega em 25 a 35 min. Escolha seu sabor e peça pelo Pix.",
    images: [{ url: "/og.png", width: 1729, height: 909, alt: "Sopa Boa — sopa quentinha chegando na sua casa" }],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sopa Boa | Sopa quentinha chegando na sua casa",
    description: "Caldos de 500 ml a partir de R$ 19,90, entrega em 25 a 35 min. Escolha seu sabor e peça pelo Pix.",
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
