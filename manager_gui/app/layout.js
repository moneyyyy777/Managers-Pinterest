import './globals.css';

export const metadata = {
  title: 'Pinterest Manager Studio — Artify Studio',
  description: 'Современный веб-интерфейс штурмана, хаба ниш и аудитора качества для автопостинга Pinterest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-[#f8f9fa] text-[#111827] antialiased">
        {children}
      </body>
    </html>
  );
}
