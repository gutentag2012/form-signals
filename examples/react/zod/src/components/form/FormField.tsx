import * as React from "react";
import {useContext} from "react";
import {FormContext} from "@/components/form/FormContext";

export const FormField = () => {
	const data = useContext(FormContext);
	return <p>{JSON.stringify(data, null, 2)}</p>;
};
