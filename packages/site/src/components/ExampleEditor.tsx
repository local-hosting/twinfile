'use client'

import { TwinfileEditor } from '../twinfile-studio/TwinfileEditor'
import { useState } from 'react'

export function ExampleEditor({ uri, text }: { uri: string; text: string }) {
  const [value, setValue] = useState(text)

  return (
    <div className="not-prose h-[min(48rem,calc(100vh-10rem))] min-h-[32rem] w-full">
      <TwinfileEditor
        uri={uri}
        value={value}
        onChange={setValue}
        mapboxToken={process.env.MAPBOX_TOKEN}
      />
    </div>
  )
}
