import './globals.css';
import Navbar from '@/components/Navbar';
import ThemeInitializer from '@/components/ThemeInitializer';

export const metadata = {
  title: 'AB Prime Academy Admin Fee Manager',
  description: 'Student fees tracking for institute administrators',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body suppressHydrationWarning>
        <ThemeInitializer />
        <div className="animate-in">
          <main className="container" style={{ paddingTop: '40px', paddingBottom: '120px' }}>
            {children}
          </main>
        </div>
        <Navbar />
      </body>
    </html>
  );
}
