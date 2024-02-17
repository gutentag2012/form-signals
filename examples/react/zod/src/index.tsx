import {useEffect, useState} from "react";
import {FormField} from "@/components/form/FormField";
import {FormProvider} from "@/components/form/FormProvider";
import {Button, ButtonProps} from "@/components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card";
import {Input, InputSignal} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Popover, PopoverContent, PopoverTrigger,} from "@/components/ui/popover";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {TextareaSignal} from "@/components/ui/textarea";
import {cn} from "@/lib/utils";
import {addDays, format, subMonths} from "date-fns";
import {Calendar as CalendarIcon} from "lucide-react";
import {createRoot} from "react-dom/client";
import "./index.css";
import {signal, useSignal} from "@preact/signals-react";
import {deepSignalifyValue} from "@/components/form/signals.utils";

interface DatePickerProps extends Omit<ButtonProps, "value"> {
	value?: Date;
}

const DatePicker = ({ className, value, ...props }: DatePickerProps) => {
	const [date, setDate] = useState<Date | undefined>(value);

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					className={cn(
						"justify-start text-left font-normal",
						!date && "text-muted-foreground",
						className,
					)}
					{...props}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{date ? format(date, "PPP") : <span>Pick a date</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar
					mode="single"
					selected={date}
					onSelect={setDate}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
};

interface Product {
	name: string;
	description: string;
	validRange: [Date | undefined, Date | undefined];
	prices: Record<
		string,
		Array<{
			price: number;
			taxRate: number;
			count: number;
		}>
	>;
	variants: Array<{
		name: string;
		options: Array<string>;
	}>;
}

const today = new Date();
const defaultValues: Product = {
	name: "Running Shoes",
	description: "The best running shoes in the world",
	validRange: [subMonths(today, 2), addDays(today, 7)],
	prices: {
		EUR: [
			{ price: 20, taxRate: 19, count: 1 },
			{ price: 19, taxRate: 19, count: 2 },
		],
		USD: [
			{ price: 30, taxRate: 7, count: 1 },
			{ price: 29, taxRate: 7, count: 2 },
		],
	},
	variants: [
		{ name: "Size", options: ["Small", "Medium", "Large"] },
		{ name: "Color", options: ["Red", "Green", "Blue"] },
	],
};

export const Index = () => {
	const values = defaultValues;

	const valuesSignal = useSignal({
		name: signal(values.name),
		description: signal(values.description),
		validRange: signal(values.validRange.map(signal)),
		prices: signal(
			Object.fromEntries(
				Object.entries(values.prices).map(([key, value]) => [
					key,
					signal(value),
				]),
			),
		),
		variants: signal(
			values.variants.map((variant) => ({
				name: signal(variant.name),
				options: signal(variant.options.map(signal)),
			})),
		),
	});

	useEffect(() => {
		const signal = deepSignalifyValue(defaultValues);
		console.log(signal);
	}, []);

	const [selectedCurrency, setSelectedCurrency] = useState<string>();
	const populatedCurrencyCount = Object.keys(values.prices).length;

	return (
		<main className="container mt-3">
			<h1 className="text-4xl font-extrabold tracking-tight mb-1">
				Product Configuration
			</h1>
			<p className="text-lg text-gray-300 mb-6">
				This is an example form with a complex data structure demonstrated on a
				form to update product information.
			</p>

			<FormProvider>
				<FormField />
			</FormProvider>

			<form
				className="flex flex-col gap-4 w-full"
				onSubmit={(e) => {
					e.preventDefault();
					console.log("submit");
				}}
			>
				<h5 className="text-lg font-bold">General</h5>

				<div>
					<Label htmlFor="name">Name</Label>
					<InputSignal
						id="name"
						name="name"
						type="text"
						placeholder="Name"
						value={valuesSignal.peek().name}
					/>
				</div>

				<div>
					<Label htmlFor="description">Description</Label>
					<TextareaSignal
						id="description"
						name="description"
						placeholder="Description"
						rows={4}
						value={valuesSignal.peek().description}
					/>
				</div>

				<div className="flex flex-row gap-2">
					<div className="flex flex-col gap-1 flex-1">
						<Label htmlFor="validFrom">Valid from</Label>
						<DatePicker variant="outline" value={values.validRange[0]} />
					</div>
					<div className="flex flex-col gap-1 flex-1">
						<Label htmlFor="validFrom">Valid until</Label>
						<DatePicker variant="outline" value={values.validRange[1]} />
					</div>
				</div>

				<h5 className="text-lg font-bold">Prices</h5>

				<div>
					<Label htmlFor="currency">Currency</Label>
					<Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
						<SelectTrigger>
							<SelectValue placeholder="Select a currency" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="EUR">EUR</SelectItem>
							<SelectItem value="USD">USD</SelectItem>
							<SelectItem value="GBP">GBP</SelectItem>
						</SelectContent>
					</Select>

					<Table className="mt-2">
						<TableHeader>
							<TableRow>
								<TableHead className="w-1/3">Min Count</TableHead>
								<TableHead className="w-1/3">Price</TableHead>
								<TableHead className="w-1/3">Tax Rate</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{values.prices[selectedCurrency ?? ""]?.map((price, index) => (
								<TableRow key={index}>
									<TableCell>{price.count}</TableCell>
									<TableCell>€ {price.price.toFixed(2)}</TableCell>
									<TableCell>{price.taxRate}%</TableCell>
									<TableCell align="right">
										<Button variant="destructive">Delete</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
						<TableFooter>
							<TableRow disableHoverStyle>
								<TableCell>
									<Label htmlFor="new-min-count">Min Count</Label>
									<Input
										id="new-min-count"
										name="new-min-count"
										type="number"
										placeholder="Min Count"
									/>
								</TableCell>
								<TableCell>
									<Label htmlFor="new-price">New price</Label>
									<Input
										id="new-price"
										name="new-price"
										type="number"
										placeholder="Price"
									/>
								</TableCell>
								<TableCell>
									<Label htmlFor="new-tax-rate">Tax Rate</Label>
									<Select defaultValue="19">
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="19">19%</SelectItem>
											<SelectItem value="7">7%</SelectItem>
											<SelectItem value="0">0%</SelectItem>
										</SelectContent>
									</Select>
								</TableCell>

								<TableCell align="right" className="align-bottom">
									<Button variant="outline">Add new price</Button>
								</TableCell>
							</TableRow>
						</TableFooter>
						<TableCaption>
							Currently {populatedCurrencyCount}{" "}
							{populatedCurrencyCount > 1 ? "currencies are" : "currency is"}{" "}
							configured
						</TableCaption>
					</Table>
				</div>

				<h5 className="text-lg font-bold">Variants</h5>

				<Tabs defaultValue={Object.values(values.variants)[0]?.name}>
					<TabsList>
						{values.variants.map((variant) => (
							<TabsTrigger key={variant.name} value={variant.name}>
								{variant.name}
							</TabsTrigger>
						))}
						<TabsTrigger value={"new"}>Add another</TabsTrigger>
					</TabsList>
					{values.variants.map((variant, index) => (
						<TabsContent key={variant.name} value={variant.name}>
							<div>
								<Label htmlFor={`variant-${index}-name`}>Name</Label>
								<Input
									id={`variant-${index}-name`}
									name={`variant-${index}-name`}
									type="text"
									placeholder="Name"
									value={variant.name}
								/>
							</div>
							<div className="mt-2">
								<Label htmlFor={`variant-${index}-options`}>Options</Label>
								<div className="flex flex-col gap-1">
									{variant.options.map((option, optionIndex) => (
										<Input
											key={optionIndex}
											id={`variant-${index}-option-${optionIndex}`}
											name={`variant-${index}-option-${optionIndex}`}
											type="text"
											placeholder="Option"
											value={option}
										/>
									))}
									<Input
										id={`variant-${index}-option-new`}
										name={`variant-${index}-option-new`}
										type="text"
										placeholder="Option"
									/>
								</div>
							</div>
						</TabsContent>
					))}
					<TabsContent value={"new"}>
						<div>
							<Label htmlFor={"variant-new-name"}>Name</Label>
							<Input
								id={"variant-new-name"}
								name={"variant-new-name"}
								type="text"
								placeholder="Name"
							/>
						</div>
						<div className="mt-2">
							<Label htmlFor={"variant-new-options"}>Options</Label>
							<div className="flex flex-col gap-1">
								<Input
									id={"variant-new-option-new"}
									name={"variant-new-option-new"}
									type="text"
									placeholder="Option"
								/>
							</div>
						</div>
					</TabsContent>
				</Tabs>

				<Button className="mt-2 max-w-[280px]">Save configuration</Button>
			</form>

			<Card className="mt-3">
				<CardHeader>
					<CardTitle>Form stats</CardTitle>
					<CardDescription>
						This shows the current values from within the form for debugging
						purposes
					</CardDescription>
				</CardHeader>
				<CardContent>
					<pre>{JSON.stringify(values, null, 2)}</pre>
				</CardContent>
				<CardFooter className="flex flex-row gap-2">
					<Button variant="outline">Touch</Button>
					<Button variant="outline">Force Validate</Button>
					<Button variant="destructive">Reset</Button>
				</CardFooter>
			</Card>
		</main>
	);
};

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");
createRoot(rootElement).render(<Index />);
