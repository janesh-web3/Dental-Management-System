import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (values: string[]) => void;
}

export function MultiSelect({ options, selected, onChange }: MultiSelectProps) {
  return (
    <Select
      value={selected[0]}
      onValueChange={(value) => onChange([value])}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select findings" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 