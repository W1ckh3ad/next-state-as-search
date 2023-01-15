import { ParsedUrlQuery } from "querystring";
import { SetStateAction } from "react";
import z from "zod";
import {
  DeepObjectKeysPathWithValue,
  DeepPartial,
  UnwrapZodTypesInfo
} from "./types";

export function unwrapZodTypes<
  T extends z.ZodType<any> | z.ZodOptional<any> | z.ZodEffects<any>
>(
  zodType: T,
  info?: UnwrapZodTypesInfo
): { zodType: z.ZodType<any>; info?: UnwrapZodTypesInfo } {
  if (zodType instanceof z.ZodEffects) {
    return unwrapZodTypes(zodType.innerType(), { ...info, hasEffect: true });
  }

  if (zodType instanceof z.ZodOptional) {
    return unwrapZodTypes(zodType.unwrap(), { ...info, isOptional: true });
  }

  if (zodType instanceof z.ZodDefault) {
    return unwrapZodTypes(zodType._def.innerType, {
      ...info,
      hasDefault: true,
    });
  }

  return { zodType, info };
}

export function unwrapSetStateAction<T>(
  action: SetStateAction<T>,
  oldValue: T
): T {
  if (typeof action === "function" && action instanceof Function) {
    return action(oldValue) as any;
  } else {
    return action;
  }
}

function traverseDicitionary(
  obj: any,
  action: ([depth, key]: [string[], string], value: string) => void,
  depth: string[] = []
) {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      if (typeof value === "object" && !Array.isArray(value)) {
        traverseDicitionary(obj[key], action, [...depth, key]);
      } else if (value !== undefined && key !== "" && value !== "") {
        action([depth, key], value);
      }
    }
  }
}

export function stateToParsedUrlQueryInput<
  T,
  TReturn = DeepObjectKeysPathWithValue<T>
>(input: T): TReturn {
  const query: Record<string, any> = {};
  traverseDicitionary(
    input,
    ([depth, key], val) => (query[[...depth, key].join(".")] = val)
  );
  return query as TReturn;
}

function transformStringToBoolean(value: string) {
  return value === "true";
}

type ReturnTypeValues =
  | undefined
  | string
  | boolean
  | number
  | string[]
  | boolean[]
  | number[];
type ReturnType = {
  [s: string]: ReturnTypeValues | ReturnType;
};

function transformValue<T extends z.ZodObject<any>>({
  key,
  schema,
  value,
}: {
  key: string;
  value: ParsedUrlQuery[string];
  schema: T;
}) {
  try {
    const { zodType } = unwrapZodTypes(schema.shape[key]);
    if (!zodType) return undefined;
    if (Array.isArray(value)) {
      const { zodType: array } = unwrapZodTypes(zodType);
      if (!array) {
        return undefined;
      }
      const type = unwrapZodTypes((array as z.ZodArray<any>)._def.type).zodType;
      if (type instanceof z.ZodNumber) {
        return value.map((x) => +x);
      }
      if (type instanceof z.ZodBoolean) {
        return value.map(transformStringToBoolean);
      }
      return value;
    }

    if (zodType instanceof z.ZodBoolean) {
      return transformStringToBoolean(value);
    }
    if (zodType instanceof z.ZodNumber) {
      return +value;
    }

    return value;
  } catch (error) {
    return undefined;
  }
}

function applyValueWithSplittedKey(
  returnObj: ReturnType,
  key: string,
  schema: z.ZodObject<any>,
  dispatchSetter:
    | ((keyAfterSplit: string, s: z.ZodObject<any>) => ReturnTypeValues)
    | ReturnTypeValues
) {
  const set = (
    o: ReturnType = returnObj,
    k: string = key,
    s: z.ZodObject<any> = schema
  ) => {
    if (typeof dispatchSetter === "function") {
      o[k] = dispatchSetter(k, s);
      return;
    }
    o[k] = dispatchSetter;
  };
  if (key.includes(".")) {
    const splittedKey = key.split(".");
    let returnObjectProperty = returnObj;
    let schemaObjectProperty = schema;
    for (let i = 0; i < splittedKey.length; i++) {
      const currentKey = splittedKey[i];
      returnObjectProperty[currentKey!] ??= {};

      if (i + 1 < splittedKey.length) {
        schemaObjectProperty = unwrapZodTypes(
          schemaObjectProperty.shape[currentKey!]
        ).zodType as z.ZodObject<any>;
        returnObjectProperty = returnObjectProperty[currentKey!] as ReturnType;
      } else if (i + 1 === splittedKey.length) {
        set(returnObjectProperty, currentKey, schemaObjectProperty);
      }
    }
  } else {
    set();
  }
}

function parse<T extends z.ZodObject<any>, TReturn = z.infer<T>>(
  obj: ParsedUrlQuery,
  schema: T,
  returnObj: Record<string, any>
): TReturn {
  obj = { ...obj };
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      applyValueWithSplittedKey(returnObj, key, schema, (newKey, s) =>
        transformValue({ key: newKey, schema: s, value: obj[key]! })
      );
    }
  }

  return returnObj as TReturn;
}

export function transformParsedUrlQueryToObject<T>(
  input: ParsedUrlQuery,
  schema: z.ZodTypeAny
): DeepPartial<T> | undefined {
  const returnObj: Record<string, any> = {};
  const localSchema = unwrapZodTypes(schema).zodType;
  if (localSchema instanceof z.ZodObject) {
    parse(input, localSchema as z.ZodObject<any>, returnObj);
    return returnObj as DeepPartial<T>;
  }
  throw new Error(
    "given Schema isn't of type ZodObject |ZodOptional<ZodObject> | ZodEffect<ZodObject> "
  );
}
