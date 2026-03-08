

## Problem

The Settings page renders blank because of a **runtime crash** caused by stale localStorage data.

The Zustand `persist` middleware does a **shallow merge** when rehydrating. If a user visited the app *before* the new `AppSettings` fields were added (e.g., `paymentMethodOrder`, `reminderSchedule`, `overtimeRate`, etc.), their stored `settings` object replaces the entire default `settings` object. New fields come back as `undefined`.

In `Settings.tsx` line 105, this line crashes:
```js
paymentMethodOrder: [...settings.paymentMethodOrder]  // TypeError: undefined is not iterable
```
Similarly, line 144:
```js
reminderSchedule: [...settings.reminderSchedule]  // same crash
```

Since there's no error boundary, the entire app white-screens.

## Fix

**1. Add a `merge` function to the Zustand persist config** (`src/store/useStore.ts`)

Add a `merge` option to the `persist()` call that deep-merges the `settings` object with defaults, so any missing fields get filled in:

```ts
persist(
  (set, get) => ({ ... }),
  {
    name: 'handyman-pro-storage',
    merge: (persistedState, currentState) => {
      const persisted = persistedState as Partial<AppState>;
      return {
        ...currentState,
        ...persisted,
        settings: {
          ...currentState.settings,
          ...(persisted.settings || {}),
        },
      };
    },
  }
)
```

This ensures every new `AppSettings` field always has its default value even if the user's localStorage predates it.

**2. No other file changes needed.** The Settings page code is correct -- it just needs the store to provide complete data.

