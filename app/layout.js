import './globals.css';

export const metadata = {
  title: 'X-Terrestrial NASA',
  icons: { icon: '/mcbs.png' }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
