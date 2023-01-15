import { useRouter } from "next/router";
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import z from "zod";
import {
  stateToParsedUrlQueryInput,
  transformParsedUrlQueryToObject,
  unwrapSetStateAction,
} from "./utils";

export function useSearch<T extends z.ZodTypeAny>(validateSearch: T) {
  const router = useRouter();
  const [search, setSearchStateState] = useState<z.infer<T> | undefined>(
    undefined
  );
  const [error, setError] = useState<z.ZodError<T> | undefined>(undefined);
  const [isReady, setIsReady] = useState(false);
  useEffect(() => {
    if (router.query && Object.keys(router.query).length > 0 && !isReady) {
      try {
        const transformed = transformParsedUrlQueryToObject(
          router.query,
          validateSearch as z.ZodTypeAny
        );
        console.log(transformed);
        const parsed = (validateSearch as z.ZodTypeAny).parse(transformed);
        setSearchStateState(parsed);
        setError(undefined);
        setIsReady(router.isReady);
      } catch (error) {
        setError(error as z.ZodError<T>);
        setSearchStateState(undefined);
        setIsReady(router.isReady);
        console.error(error);
      }
    }
  }, [router.query]);

  const setSearch = (set: SetStateAction<z.infer<T>>) => {
    const state = unwrapSetStateAction(set, search);
    router.push(
      {
        pathname: router.pathname,
        query: stateToParsedUrlQueryInput(state),
      },
      undefined,
      { shallow: true, scroll: false }
    );
    setSearchStateState(set);
  };
  return { search, setSearch, isReady, router, error } as const;
}

export function useCreateSetStateDispatch<T>(
  oldValue: T,
  setter: (newValue: T) => void
) {
  return useCallback<Dispatch<SetStateAction<T>>>(
    (newValue) => {
      if (typeof newValue === "function" && newValue instanceof Function) {
        return setter(newValue(oldValue));
      }
      return setter(newValue);
    },
    [oldValue, setter]
  );
}
