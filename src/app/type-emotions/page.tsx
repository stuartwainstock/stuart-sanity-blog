import type {Metadata} from 'next'
import PageHeroWithDataSource from '@/components/molecules/PageHeroWithDataSource'
import {
  pageBodyTypography,
  pageContent,
  pageDataSourceLink,
  pageShellBg,
} from '@/lib/pageTypography'
import {specimenFontVariablesClassName} from './fonts'
import {TypeEmotionsStudio} from './TypeEmotionsStudio'

export const metadata: Metadata = {
  title: 'Type Emotions — Lab',
  description:
    'Describe an emotion and explore a curated Google Fonts specimen: primary type scale plus alternate faces.',
  robots: 'index, follow',
}

export default function TypeEmotionsPage() {
  return (
    <div className={pageShellBg}>
      <a href="#type-emotions-studio" className="skip-link">
        Skip to type emotions studio
      </a>

      <PageHeroWithDataSource
        titleId="type-emotions-title"
        title="Type Emotions"
        dataSource={
          <p>
            Fonts from{' '}
            <a
              href="https://fonts.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={pageDataSourceLink}
            >
              Google Fonts
            </a>
            , self-hosted via{' '}
            <a
              href="https://nextjs.org/docs/app/building-your-application/optimizing/fonts"
              target="_blank"
              rel="noopener noreferrer"
              className={pageDataSourceLink}
            >
              next/font
            </a>
            . Emotion → type matches are a curated experiment, not a recommendation engine.
          </p>
        }
      >
        <div className={pageBodyTypography}>
          <p>
            Pick an emotion chip or describe a feeling. The specimen shows a primary type scale and
            a few alternate faces — a starting point for how mood can steer typography choices.
          </p>
        </div>
      </PageHeroWithDataSource>

      <div
        id="type-emotions-studio"
        className={`${pageContent} ${specimenFontVariablesClassName}`}
        aria-labelledby="type-emotions-title"
      >
        <TypeEmotionsStudio />
      </div>
    </div>
  )
}
