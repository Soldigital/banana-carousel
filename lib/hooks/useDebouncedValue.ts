import * as React from "react";

// Returns a debounced copy of `value` that only updates after `delayMs` of no
// changes. Used to keep history search snappy without a request per keystroke.
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
