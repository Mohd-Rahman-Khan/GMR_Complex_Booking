import { Platform } from 'react-native';

const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:5001/api',
  ios: 'http://localhost:5001/api',
  default: 'http://localhost:5001/api',
});

interface ApiOptions extends RequestInit {
  token?: string | null;
}

export const apiRequest = async <T = any>(
  endpoint: string,
  options: ApiOptions = {},
): Promise<T> => {
  const { token, headers, ...requestOptions } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...requestOptions,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const responseText = await response.text();

  let result: any = {};

  try {
    result = responseText ? JSON.parse(responseText) : {};
  } catch {
    result = { message: responseText || 'Invalid server response' };
  }

  if (!response.ok) {
    throw new Error(
      result?.message ||
        result?.error ||
        `Request failed with status ${response.status}`,
    );
  }

  return result as T;
};

export default API_BASE_URL;
