'use client'

import React, {useEffect, useState} from 'react'
import {StringInputProps, useFormValue, PatchEvent, set} from 'sanity'
import {Card, Text, Button, Stack, Flex} from '@sanity/ui'

interface UnsplashMetadata {
  alt_description?: string
  description?: string
  user?: {
    name?: string
    username?: string
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function pickUnsplashMetadata(imageAsset: unknown): UnsplashMetadata | null {
  if (!isRecord(imageAsset)) return null
  const metadata = imageAsset.metadata
  if (!isRecord(metadata)) return null
  const unsplash = metadata.unsplash
  if (!isRecord(unsplash)) return null
  return unsplash as UnsplashMetadata
}

export function AutoAltTextInput(props: StringInputProps) {
  const {onChange, value} = props
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  // Get the parent image asset to check for metadata
  const imageAsset = useFormValue(['asset']) as unknown
  const parentDocument = useFormValue([]) as unknown
  
  // Auto-populate from Unsplash metadata
  useEffect(() => {
    const unsplashData = pickUnsplashMetadata(imageAsset)
    if (unsplashData) {
      const altText = unsplashData.alt_description || unsplashData.description
      
      if (altText && !value) {
        onChange(PatchEvent.from(set(altText)))
      }
    }
  }, [imageAsset, value, onChange])

  // Generate suggestions based on context
  const generateSuggestions = async () => {
    setIsGenerating(true)
    const newSuggestions: string[] = []
    
    // Suggestion 1: Based on document title
    if (isRecord(parentDocument) && typeof parentDocument.title === 'string' && parentDocument.title.trim()) {
      newSuggestions.push(`Image related to ${parentDocument.title.trim()}`)
    }
    
    // Suggestion 2: Based on document excerpt
    if (isRecord(parentDocument) && typeof parentDocument.excerpt === 'string' && parentDocument.excerpt.trim()) {
      newSuggestions.push(`Image depicting ${parentDocument.excerpt.trim().slice(0, 50)}...`)
    }
    
    // Suggestion 3: Based on image filename
    if (isRecord(imageAsset) && typeof imageAsset.originalFilename === 'string' && imageAsset.originalFilename.trim()) {
      const filename = imageAsset.originalFilename.trim()
        .replace(/[-_]/g, ' ')
        .replace(/\.[^/.]+$/, '')
        .replace(/\b\w/g, (l: string) => l.toUpperCase())
      newSuggestions.push(`Image of ${filename}`)
    }
    
    // Suggestion 4: Generic but descriptive
    newSuggestions.push('Descriptive image for content')
    
    setSuggestions(newSuggestions)
    setIsGenerating(false)
  }

  const applySuggestion = (suggestion: string) => {
    onChange(PatchEvent.from(set(suggestion)))
  }

  return (
    <Stack space={3}>
      {props.renderDefault(props)}
      
      <Card padding={3} tone="primary">
        <Stack space={3}>
          <Text size={1} weight="medium">
            Alt Text Assistant
          </Text>
          
          <Text size={1} muted>
            Need help writing alt text? Click to generate suggestions based on your content.
          </Text>
          
          <Button
            text="Generate Suggestions"
            tone="primary"
            loading={isGenerating}
            onClick={generateSuggestions}
          />
          
          {suggestions.length > 0 && (
            <Stack space={2}>
              <Text size={1} weight="medium">
                Suggestions:
              </Text>
              {suggestions.map((suggestion, index) => (
                <Card key={index} padding={2} tone="default">
                  <Flex justify="space-between" align="center">
                    <Text size={1}>{suggestion}</Text>
                    <Button
                      text="Use"
                      tone="primary"
                      mode="ghost"
                      onClick={() => applySuggestion(suggestion)}
                    />
                  </Flex>
                </Card>
              ))}
            </Stack>
          )}
          
          {pickUnsplashMetadata(imageAsset) && (
            <Card padding={2} tone="positive">
              <Text size={1}>
                ✓ This image includes metadata from Unsplash that can help with alt text
              </Text>
            </Card>
          )}
        </Stack>
      </Card>
    </Stack>
  )
}
