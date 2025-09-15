import { writable } from 'svelte/store';

export const suggestions = writable<string[]>([]);

export function setSuggestions(newSuggestions: string[]) {
  suggestions.set(newSuggestions);
}

export function clearSuggestions() {
  suggestions.set([]);
}