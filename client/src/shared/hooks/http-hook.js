import { useState, useCallback, useRef, useEffect } from "react";

export const useHttpClient = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  const activeHttpRequests = useRef([]);

  const sendRequest = useCallback(async (url, method = "GET", body = null, headers = {}) => {
    setIsLoading(true);
    const httpAbortController = new AbortController();
    activeHttpRequests.current.push(httpAbortController);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: httpAbortController.signal,
      });

      const responseData = await response.json();
      activeHttpRequests.current = activeHttpRequests.current.filter((reqCtrl) => reqCtrl !== httpAbortController);

      if (!response.ok) {
        throw new Error(responseData.message);
      }
      setIsLoading(false);
      return responseData;
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      throw err;
    }
  }, []);

  function clearError() {
    setError(null);
  }

  useEffect(() => {
    return () => {
      // eslint-disable-next-line
      activeHttpRequests.current.forEach((AbortCtrl) => AbortCtrl.abort());
    };
  }, []);

  return { isLoading, error, sendRequest, clearError };
};
