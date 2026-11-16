'use client'

import { createAutocomplete } from '@algolia/autocomplete-core'
import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'

import { type Result } from '@/mdx/search.mjs'
import { type Autocomplete, type SearchState } from '@/types/search'

export function useAutocomplete({ onNavigate }: { onNavigate: () => void }) {
  let id = useId()
  let router = useRouter()
  let [autocompleteState, setAutocompleteState] = useState<SearchState>({})

  function navigate({ itemUrl }: { itemUrl?: string }) {
    if (itemUrl) {
      router.push(itemUrl)
    }

    onNavigate()
  }

  let [autocomplete] = useState<Autocomplete>(() =>
    createAutocomplete<
      Result,
      React.SyntheticEvent,
      React.MouseEvent,
      React.KeyboardEvent
    >({
      id,
      placeholder: 'Find something...',
      defaultActiveItemId: 0,
      onStateChange({ state }) {
        setAutocompleteState(state)
      },
      shouldPanelOpen({ state }) {
        return state.query !== ''
      },
      navigator: {
        navigate,
      },
      getSources({ query }) {
        return import('@/mdx/search.mjs').then(({ search }) => {
          return [
            {
              sourceId: 'documentation',
              getItems() {
                return search(query, { limit: 5 })
              },
              getItemUrl({ item }) {
                return item.url
              },
              onSelect: navigate,
            },
          ]
        })
      },
    }),
  )

  return { autocomplete, autocompleteState }
}
