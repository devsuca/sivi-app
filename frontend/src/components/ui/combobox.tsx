
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
}

export function Combobox({ options, value, onChange, placeholder, searchPlaceholder, emptyText }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)

  // Debug logs
  React.useEffect(() => {
    console.log('Combobox props:', { value, options: options.length, placeholder });
    if (value) {
      const selectedOption = options.find((option) => String(option.value) === String(value));
      console.log('Selected option found:', selectedOption);
    }
  }, [value, options, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between">
          {(() => {
            const foundOption = options.find((option) => String(option.value) === String(value));
            console.log('🔍 Combobox Display Check:', {
              valueProp: value,
              valuePropType: typeof value,
              foundOption: foundOption,
              optionsMap: options.map(o => ({ val: o.value, type: typeof o.value, label: o.label }))
            });
            return foundOption?.label || placeholder || "Select option...";
          })()}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder || "Search..."} />
          <CommandEmpty>{emptyText || "No option found."}</CommandEmpty>
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={option.value}
                onSelect={(currentValue) => {
                  console.log('Combobox onSelect:', { currentValue, currentValueType: typeof currentValue, value, valueType: typeof value });
                  const newValue = String(currentValue) === String(value) ? "" : currentValue;
                  console.log('Combobox onChange called with:', newValue);
                  onChange(newValue);
                  setOpen(false);
                }}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    String(value) === String(option.value) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
