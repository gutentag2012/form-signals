// biome-ignore lint/correctness/noUnusedImports: This is the React import
import React from 'react'
import {describe, it, expect} from "vitest";
import {FormLogic} from "@signal-forms/form-core";
import {FormProvider} from "./form.provider";
import {useFormContext} from "./form.context";
import {render} from "@testing-library/react";

describe('FormProvider', () => {
  it("should provider the form within the form context", () => {
    const form = new FormLogic({defaultValues: {name: "default"}})

    function TestComponent() {
      const context = useFormContext()
      return (
        <p>Has context: {JSON.stringify(context.data.value === form.data.value)}</p>
      )
    }

    const screen = render(
      <FormProvider form={form as never}>
        <TestComponent />
      </FormProvider>
    )

    expect(screen.getByText("Has context: true")).toBeDefined()
  })
});
