import * as React from "react";
import {FormHTMLAttributes} from "react";
import {FormContext} from "@/components/form/FormContext";

interface AsChildProps
	extends Pick<FormHTMLAttributes<HTMLFormElement>, "children"> {
	asChild: true;
}

interface AsFormProps extends FormHTMLAttributes<HTMLFormElement> {
	asChild?: false;
}

type Props = AsChildProps | AsFormProps;

export const FormProvider = ({ asChild, children, ...props }: Props) => {
	const finalChildren = asChild ? children : <form {...props}>{children}</form>;

	return (
		<FormContext.Provider value={{ asd: 1 }}>
			{finalChildren}
		</FormContext.Provider>
	);
};
