// localstorage

export const get_local = (key: string): string | undefined => {
  const value = localStorage.getItem(key);
  if (value) {
    return value;
  } else {
    return undefined;
  }
};

export function get_local_as_type<T>(key: string): T | undefined {
  const value = localStorage.getItem(key) as T;
  if (value) {
    return value;
  } else {
    return undefined;
  }
}

export const set_local = (key: string, value: string) => {
  set_local(key, value);
};

export const remove_local = (key: string) => {
  localStorage.removeItem(key);
};

export const clear_local = () => {
  localStorage.clear();
};
