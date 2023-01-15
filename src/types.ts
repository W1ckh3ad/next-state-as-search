import z from "zod";

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

type Allow = string | number | bigint | boolean | null | undefined;

export type Join<
  TArray extends Allow[],
  Seperator extends Allow,
  CurrentValue extends string = ""
> = TArray extends [
  infer FirstValueOfTArray extends Allow,
  ...infer Rest extends Allow[]
]
  ? Join<
      Rest,
      Seperator,
      `${CurrentValue}${FirstValueOfTArray}${Rest["length"] extends 0
        ? ""
        : Seperator}`
    >
  : CurrentValue;

export type DeepObjectKeysPathWithValue<
  T,
  K extends keyof T = keyof T,
  Keys extends readonly string[] = []
> = T[K] extends readonly any[]
  ? Keys
  : T[K] extends object
  ? DeepObjectKeysPathWithValue<
      T[K],
      keyof T[K],
      [...Keys, K extends string ? K : never]
    >
  : readonly [[...Keys, K], T[K]];

export type FlattenedDeepObjects<T> = {
  [Prop in keyof T as DeepObjectKeysPathWithValue<T, Prop> extends readonly [
    infer Keys extends Allow[],
    any
  ]
    ? Join<Keys, ".">
    : never]: DeepObjectKeysPathWithValue<T, Prop> extends readonly [
    any,
    infer Value
  ]
    ? Value
    : never;
};

export type UnwrapZodTypesInfo = {
  hasEffect?: boolean;
  isOptional?: boolean;
  hasDefault?: boolean;
};

export type RemoveNotSupportedTypes<T> = {
  [Prop in keyof T]: T[Prop] extends readonly any[]
    ? T[Prop] extends readonly (string | number | boolean)[]
      ? T[Prop]
      : never
    : T[Prop] extends string | number | boolean
    ? T[Prop]
    : T[Prop] extends Date
    ? never
    : RemoveNotSupportedTypes<T[Prop]>;
};

// TODO get it to work as parameter of hook `useSearch`
export type ValidateSearchParamsSchema<
  T extends z.ZodTypeAny,
  TInfer = z.infer<T>
> = TInfer extends RemoveNotSupportedTypes<TInfer> ? TInfer : never; //"ERROR MESSAGE: This schema probably an object array, Date or multi dimensional array which isn't supported by NextJS in searchParams (query) ";
