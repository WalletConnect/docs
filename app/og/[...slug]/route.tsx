import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { notFound } from 'next/navigation';
import { ImageResponse } from 'next/og';
import { getPageImageUrl } from '@/lib/shared';
import { source } from '@/lib/source';

export const dynamic = 'force-static';
export const revalidate = false;

// Images are rendered once at build time, so reading from disk is fine. The fonts live outside public/
// because only this route needs them; without them the renderer falls back to Geist with odd word spacing.
const assets = Promise.all([
  readFile(join(process.cwd(), 'assets/fonts/Inter-400.ttf')),
  readFile(join(process.cwd(), 'assets/fonts/Inter-600.ttf')),
  readFile(join(process.cwd(), 'public/logo/dark.svg')),
]);

// Chat apps (WhatsApp, iMessage) crop link previews to a centred square, so everything is centred
// and kept narrow enough that short titles survive the crop.
const MAX_DESCRIPTION = 140;
const LOGO_WIDTH = 370;

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(' ', max))}…`;
}

export async function GET(_req: Request, { params }: RouteContext<'/og/[...slug]'>) {
  const { slug } = await params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) notFound();

  const [inter400, inter600, logoSvg] = await assets;
  // The logo's viewBox leaves empty space to the right of "Docs", which pushes it off centre; crop it here.
  const logo = logoSvg
    .toString()
    .replace('viewBox="0 0 554 146" width="554" height="146"', `viewBox="0 0 ${LOGO_WIDTH} 146"`);
  const { title, description } = page.data;

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: '64px 120px',
        backgroundColor: '#141414',
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(9,136,240,0.28), rgba(9,136,240,0) 60%)',
        borderBottom: '12px solid #0988f0',
        fontFamily: 'Inter',
        textAlign: 'center',
      }}
    >
      <img
        src={`data:image/svg+xml;base64,${Buffer.from(logo).toString('base64')}`}
        width={Math.round((LOGO_WIDTH / 146) * 70)}
        height={70}
        alt=""
        style={{ marginBottom: 48 }}
      />
      <div
        style={{
          fontSize: title.length > 32 ? 60 : 76,
          fontWeight: 600,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: '#ffffff',
        }}
      >
        {title}
      </div>
      {description ? (
        <div style={{ marginTop: 28, fontSize: 32, lineHeight: 1.4, color: 'rgba(255,255,255,0.7)' }}>
          {truncate(description, MAX_DESCRIPTION)}
        </div>
      ) : null}
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
        { name: 'Inter', data: inter600, weight: 600, style: 'normal' },
      ],
    },
  );
}

export function generateStaticParams() {
  return source.getPages().map((page) => ({
    lang: page.locale,
    slug: getPageImageUrl(page).segments,
  }));
}
