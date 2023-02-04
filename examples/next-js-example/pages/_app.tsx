import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Link from 'next/link';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className="p-8">
      <header className="flex gap-6">
        <Link className="" href="/">
          Index
        </Link>
        <Link className="" href="/withHoc">
          With Hoc
        </Link>
      </header>
      <Component {...pageProps} />
    </div>
  );
}
