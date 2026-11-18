// localstorage

export const get_local = (key: string): string | undefined => {
  const value = localStorage.getItem(key);
  if (value) {
    return value;
  } else {
    return undefined;
  }
};

export const set_local = (key: string, value: string) => {
  localStorage.setItem(key, value);
};

export const remove_local = (key: string) => {
  localStorage.removeItem(key);
};

export const clear_local = () => {
  localStorage.clear();
};
