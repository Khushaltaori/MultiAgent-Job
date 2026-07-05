let inMemoryToken: string | null = null;

export const tokenStore = {
  getToken: (): string | null => {
    return inMemoryToken;
  },
  setToken: (token: string | null): void => {
    inMemoryToken = token;
  },
  clearToken: (): void => {
    inMemoryToken = null;
  }
};
