/**
 * One-off: emit Sanity ndjson seed from static Type Emotions modules.
 * Run: npx tsx scripts/generate-type-emotions-ndjson.ts > type-emotions-seed.ndjson
 */
import {writeFileSync} from 'node:fs'
import {EMOTION_CATALOG} from '../src/lib/typeEmotions/catalog'
import {SPECIMEN_PALETTES} from '../src/lib/typeEmotions/palettes'
import {VARIABLE_FONTS, type VariableFontKey} from '../src/lib/typeEmotions/variableFonts'

const GOOGLE_NAMES: Record<VariableFontKey, string> = {
  fraunces: 'Fraunces',
  recursive: 'Recursive',
  robotoFlex: 'Roboto Flex',
  bricolage: 'Bricolage Grotesque',
  anybody: 'Anybody',
  nabla: 'Nabla',
  shantell: 'Shantell Sans',
  workbench: 'Workbench',
}

function axisArray(coord: Record<string, number>) {
  return Object.entries(coord).map(([tag, value], i) => ({
    _type: 'axisTagValue',
    _key: `${tag}-${i}`,
    tag,
    value,
  }))
}

const docs: object[] = []

for (const font of Object.values(VARIABLE_FONTS)) {
  docs.push({
    _id: `variableFontFace-${font.key}`,
    _type: 'variableFontFace',
    key: font.key,
    label: font.label,
    googleFontName: GOOGLE_NAMES[font.key],
    cssVar: font.cssVar,
    fallback: font.fallback,
    category: font.category,
    italicSupport: font.supportsItalic ? 'romanAndItalic' : 'roman',
    axes: font.axes.map((axis, i) => ({
      _type: 'variableFontAxis',
      _key: `${axis.tag}-${i}`,
      tag: axis.tag,
      label: axis.label,
      min: axis.min,
      max: axis.max,
      step: axis.step,
      default: axis.default,
      group: axis.group ?? 'core',
    })),
  })
}

for (const palette of Object.values(SPECIMEN_PALETTES)) {
  docs.push({
    _id: `specimenPalette-${palette.id}`,
    _type: 'specimenPalette',
    key: palette.id,
    label: palette.name,
    sourceUrl: palette.coolorsUrl,
    swatches: [...palette.swatches],
    roles: palette.roles,
    intensityHigh: palette.intensityHigh ?? undefined,
    intensityMax: palette.intensityMax ?? undefined,
  })
}

for (const emotion of EMOTION_CATALOG) {
  docs.push({
    _id: `typeEmotion-${emotion.id}`,
    _type: 'typeEmotion',
    emotionId: {current: emotion.id},
    label: emotion.label,
    synonyms: emotion.synonyms,
    fontFace: [
      {
        _type: 'reference',
        _key: 'primary',
        _ref: `variableFontFace-${emotion.fontKey}`,
      },
    ],
    alternateFontFaces: emotion.alternateFontKeys.map((key, i) => ({
      _type: 'reference',
      _key: `alt-${i}`,
      _ref: `variableFontFace-${key}`,
    })),
    coordinate: axisArray(emotion.coordinate),
    intense: axisArray(emotion.intense),
    italic: emotion.italic ? 'italic' : 'none',
    transform: emotion.transform ?? 'none',
    palette: emotion.paletteId
      ? [
          {
            _type: 'reference',
            _key: 'palette',
            _ref: `specimenPalette-${emotion.paletteId}`,
          },
        ]
      : [],
    surface: emotion.surface,
    specimenWord: emotion.specimenWord,
    reason: emotion.reason,
  })
}

docs.push({
  _id: 'toolProjectPage-type-emotions',
  _type: 'toolProjectPage',
  projectKey: 'type-emotions',
  pageTitle: 'Type Emotions',
  heroIntroduction: [
    {
      _type: 'block',
      _key: 'intro',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _type: 'span',
          _key: 's1',
          text: 'Pick an emotion chip or describe a feeling. Each match drops you at a starting coordinate in a variable font — then drag weight, width, optical size, and other axes live on the specimen.',
          marks: [],
        },
      ],
    },
  ],
  seo: {
    metaTitle: 'Type Emotions — Lab',
    metaDescription:
      'Describe an emotion and explore a variable-font playground: live weight, width, and expressive axes on a curated specimen.',
  },
})

const out = docs.map((d) => JSON.stringify(d)).join('\n') + '\n'
writeFileSync(new URL('../type-emotions-seed.ndjson', import.meta.url), out)
console.error(`Wrote ${docs.length} documents to type-emotions-seed.ndjson`)
