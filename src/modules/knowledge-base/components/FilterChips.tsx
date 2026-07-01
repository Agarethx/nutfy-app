import { ScrollView, Pressable } from 'react-native'
import { Typography } from '@/shared/components/ui/Typography'

export type FilterOption<T extends string = string> = {
  value: T
  label: string
}

type Props<T extends string> = {
  options: FilterOption<T>[]
  selected: T | null
  onSelect: (value: T | null) => void
  allLabel?: string
}

export function FilterChips<T extends string>({
  options,
  selected,
  onSelect,
  allLabel = 'Todos',
}: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 8 }}
    >
      <Pressable
        onPress={() => onSelect(null)}
        className={`rounded-full px-4 py-2 ${selected === null ? 'bg-primary-600' : 'bg-neutral-100'}`}
      >
        <Typography
          variant="label"
          className={selected === null ? 'text-white' : 'text-neutral-700'}
        >
          {allLabel}
        </Typography>
      </Pressable>
      {options.map((opt) => (
        <Pressable
          key={opt.value}
          onPress={() => onSelect(opt.value === selected ? null : opt.value)}
          className={`rounded-full px-4 py-2 ${
            selected === opt.value ? 'bg-primary-600' : 'bg-neutral-100'
          }`}
        >
          <Typography
            variant="label"
            className={selected === opt.value ? 'text-white' : 'text-neutral-700'}
          >
            {opt.label}
          </Typography>
        </Pressable>
      ))}
    </ScrollView>
  )
}
