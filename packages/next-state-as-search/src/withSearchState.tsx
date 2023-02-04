import { ComponentProps, ComponentType } from "react";
import { ZodTypeAny } from "zod";
import SearchStateContext from "./context";

export default function withSearchState<
  TProps extends JSX.IntrinsicAttributes,
  TSchema extends ZodTypeAny
>(
  Component: ComponentType<TProps>,
  contextProps: ComponentProps<typeof SearchStateContext<TSchema>>
) {
  return (props: TProps) => (
    <SearchStateContext {...contextProps}>
      <Component {...props} />
    </SearchStateContext>
  );
}
