import {
  createContext,
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useContext,
} from "react";
import { z } from "zod";
import { useSearch } from "./hooks";

const GetStateContext = createContext<{}>({});
const SetStateContext = createContext<Dispatch<SetStateAction<{}>>>(() =>
  console.error("No context set")
);

export function SimpleSearchContext<T>({
  children,
  search,
  setSearch,
}: {
  children?: ReactNode;
  search: T | undefined;
  setSearch?: Dispatch<SetStateAction<T | undefined>>;
}) {
  return (
    <GetStateContext.Provider value={search as {}}>
      <SetStateContext.Provider
        value={setSearch as Dispatch<SetStateAction<{}>>}
      >
        {children}
      </SetStateContext.Provider>
    </GetStateContext.Provider>
  );
}

function SearchStateContext<T extends z.ZodTypeAny>({
  children,
  schema,
  fallback,
  renderChildrenOnReady,
  OnError,
}: {
  children?: ReactNode;
  schema: T;
  fallback?: ReactNode;
  renderChildrenOnReady?: boolean;
  OnError?: FC<{ error: z.ZodError<T> }>;
}) {
  const { error, isReady, search, setSearch } = useSearch(schema);

  return (
    <GetStateContext.Provider value={search as {}}>
      <SetStateContext.Provider
        value={setSearch as Dispatch<SetStateAction<{}>>}
      >
        {renderChildrenOnReady && isReady ? children : null}
        {!renderChildrenOnReady ? children : null}
        {renderChildrenOnReady && !isReady ? fallback : null}
        {error && OnError ? <OnError error={error} /> : null}
      </SetStateContext.Provider>
    </GetStateContext.Provider>
  );
}

export function useGetSearchState<T>() {
  return useContext(GetStateContext) as T | undefined;
}

export function useSetSearchState<T>() {
  return useContext(SetStateContext) as Dispatch<SetStateAction<T | undefined>>;
}

export default SearchStateContext;
