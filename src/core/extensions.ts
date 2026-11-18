// localstorage

export type Keys = 'customRepeatStart' | 'customRepeatEnd' | 'history' | 'BookLastSelected' | "repeatMode";

export const get_local = (key: Keys): string | undefined => {
  const value = localStorage.getItem(key);
  if (value) {
    return value;
  } else {
    return undefined;
  }
};

export function get_local_as_type<T>(key: Keys): T | undefined {
  const value = localStorage.getItem(key) as T;
  if (value) {
    return value;
  } else {
    return undefined;
  }
}

export const set_local = (key: Keys, value: string) => {
  localStorage.setItem(key, value);
};

export const remove_local = (key: Keys) => {
  localStorage.removeItem(key);
};

export const clear_local = () => {
  localStorage.clear();
};
