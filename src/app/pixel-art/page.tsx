import type {Metadata} from 'next'
import PageHeroWithDataSource from '@/components/molecules/PageHeroWithDataSource'
import {pageBodyTypography, pageContent, pageDataSourceLink, pageShellBg} from '@/lib/pageTypography'
import {PixelArtStudio} from './PixelArtStudio'

export const metadata: Metadata = {
  title: 'Pixel Art Studio — Lab',
  description:
    'Turn any photo into pixel art in your browser. Upload an image or search Unsplash, tweak the pixel size and palette, then download the result.',
  robots: 'index, follow',
}

export default function PixelArtPage() {
  return (
    <div className={pageShellBg}>
      <a href="#pixel-art-studio" className="skip-link">
        Skip to pixel art studio
      </a>

      <PageHeroWithDataSource
        titleId="pixel-art-title"
        title="Pixel Art Studio"
        dataSource={
          <p>
            Photo search (optional) powered by{' '}
            <a
              href="https://unsplash.com/?utm_source=stuartwainstock&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className={pageDataSourceLink}
            >
              Unsplash
            </a>
            . All pixel-art processing happens in your browser — nothing you upload is stored.
          </p>
        }
      >
        <div className={pageBodyTypography}>
          <p>
            Upload a photo or search Unsplash for one, then play with pixel size and color palette
            until it looks right. Download the result as a PNG when you&apos;re happy with it.
          </p>
        </div>
      </PageHeroWithDataSource>

      <div id="pixel-art-studio" className={pageContent} aria-labelledby="pixel-art-title">
        <PixelArtStudio />
      </div>
    </div>
  )
}
