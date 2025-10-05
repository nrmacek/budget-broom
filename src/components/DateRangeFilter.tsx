import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from 'lucide-react';
import { DateRange } from '@/pages/Categories';

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (value: DateRange) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const options = [
    { value: 'all' as DateRange, label: 'All Time' },
    { value: '3months' as DateRange, label: 'Past 3 Months' },
    { value: 'month' as DateRange, label: 'Past Month' },
    { value: 'week' as DateRange, label: 'Past Week' },
    { value: 'year' as DateRange, label: 'Past Year' },
  ];

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40">
        <Calendar className="h-4 w-4 mr-2" />
        <SelectValue />
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
};