import './globals.css';

export const metadata = {
  title: 'Waypoint - NASA',
  icons: { icon: '/mcbs.png' }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
