import { type AutocompleteApi, type AutocompleteState } from '@algolia/autocomplete-core'
import type { KeyboardEvent, MouseEvent, SyntheticEvent } from 'react'

import { type Result } from '@/mdx/search.mjs'

export type Autocomplete = AutocompleteApi<Result, SyntheticEvent, MouseEvent, KeyboardEvent>

export type SearchState = AutocompleteState<Result> | Record<string, never>
