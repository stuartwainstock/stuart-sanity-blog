import type {Metadata} from 'next'
import PageHeroWithDataSource from '@/components/molecules/PageHeroWithDataSource'
import PortableText from '@/components/molecules/PortableText'
import {
  pageBodyTypography,
  pageContent,
  pageDataSourceLink,
  pageShellBg,
} from '@/lib/pageTypography'
import {fetchTypeEmotionsBundle} from '@/lib/sanity'
import {specimenFontVariablesClassName} from './fonts'
import {TypeEmotionsStudio} from './TypeEmotionsStudio'

export async function generateMetadata(): Promise<Metadata> {
  const {page} = await fetchTypeEmotionsBundle()
  return {
    title: page?.seo?.metaTitle || page?.pageTitle || 'Type Emotions — Lab',
    description:
      page?.seo?.metaDescription ||
      'Describe an emotion and explore a variable-font playground: live weight, width, and expressive axes on a curated specimen.',
    robots: page?.seo?.noIndex ? 'noindex, nofollow' : 'index, follow',
  }
}

export default async function TypeEmotionsPage() {
  const {catalog, palettes, fonts, page} = await fetchTypeEmotionsBundle()
  const title = page?.pageTitle || 'Type Emotions'

  return (
    <div className={pageShellBg}>
      <a href="#type-emotions-studio" className="skip-link">
        Skip to type emotions studio
      </a>

      <PageHeroWithDataSource
        titleId="type-emotions-title"
        title={title}
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
          {page?.heroIntroduction?.length ? (
            <PortableText value={page.heroIntroduction} />
          ) : (
            <p>
              Pick an emotion chip or describe a feeling. Each match drops you at a starting
              coordinate in a variable font — then drag weight, width, optical size, and other
              axes live on the specimen.
            </p>
          )}
        </div>
      </PageHeroWithDataSource>

      <div
        id="type-emotions-studio"
        className={`${pageContent} ${specimenFontVariablesClassName}`}
        aria-labelledby="type-emotions-title"
      >
        <TypeEmotionsStudio catalog={catalog} palettes={palettes} fonts={fonts} />
      </div>
    </div>
  )
}
