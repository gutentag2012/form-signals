// biome-ignore lint/nursery/noUnusedImports: This is the React import
import  React from "react";
import type {Amount} from "./UtilityTypes";

export const TestComponent = ({amount}: Amount) => {
  return <p>Test number #{amount}</p>
}
