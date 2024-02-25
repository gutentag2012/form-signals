import {Button, ButtonProps} from "./components/ui/button";
import {Calendar} from "@/components/ui/calendar";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,} from "@/components/ui/card";
import {Collapsible, CollapsibleContent, CollapsibleTrigger,} from "@/components/ui/collapsible.tsx";
import {Input} from "@/components/ui/input";
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
import {Textarea} from "@/components/ui/textarea";
import {cn} from "@/lib/utils";
import {useForm} from "@tanstack/react-form";
import {zodValidator} from "@tanstack/zod-form-adapter";
import {format} from "date-fns";
import {Calendar as CalendarIcon} from "lucide-react";
import {useRef, useState} from "react";
import {createRoot} from "react-dom/client";
import {z} from "zod";
import "./index.css";
import {BehaviourCheck} from "@/BehaviourCheck.tsx";

interface DatePickerProps extends Omit<ButtonProps, "value" | "onChange"> {
	value?: Date;
	onChange?: (date: Date | undefined) => void;
}

const DatePicker = ({
	className,
	value,
	onChange,
	...props
}: DatePickerProps) => {
	const [date, setDate] = useState<Date | undefined>(value);
	const realValue = value ?? date;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					className={cn(
						"justify-start text-left font-normal",
						!realValue && "text-muted-foreground",
						className,
					)}
					{...props}
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{realValue ? format(realValue, "PPP") : <span>Pick a date</span>}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0">
				<Calendar
					mode="single"
					selected={realValue}
					onSelect={onChange ?? setDate}
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
	prices: {
		[currency: string]: Array<{
			price: number;
			taxRate: number;
			count: number;
		}>;
	};
	variants: Array<{
		name: string;
		options: Array<string>;
	}>;
}

const emptyDefaultValues = {
	name: "",
	description: "",
	validRange: [undefined, undefined],
	prices: {},
	variants: [],
} satisfies Product;

export const Index = () => {
	const [selectedCurrency, setSelectedCurrency] = useState<string>("EUR");
	const [selectedVariant, setSelectedVariant] = useState<number>(0);

	const justAddedOption = useRef(false);

  // TODO Add async validation + loading indicator
	const form = useForm<Product, typeof zodValidator>({
		defaultValues: emptyDefaultValues,
		validatorAdapter: zodValidator,
		onSubmit: ({ value }) => {
			console.log("submit", value);
		},
	});

	const newPriceForm = useForm<
		Partial<Product["prices"][string][number]>,
		typeof zodValidator
	>({
		defaultValues: {
			taxRate: 19,
		},
		validatorAdapter: zodValidator,
		onSubmit: ({ value }) => {
			form.pushFieldValue(
				`prices.${selectedCurrency}`,
				value as Product["prices"][string][number],
				{ touch: true },
			);
			// TODO This does not take the default value of a field into account unless it is defined within the form definition
			newPriceForm.reset();
		},
	});

	return (
		<main className="container mt-3">
			<h1 className="text-4xl font-extrabold tracking-tight mb-1">
				Product Configuration
			</h1>
			<p className="text-lg text-gray-300 mb-6">
				This is an example form with a complex data structure demonstrated on a
				form to update product information.
			</p>

			<form.Provider>
				<form
					className="flex flex-col gap-4 w-full"
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<h5 className="text-lg font-bold">General</h5>

					<form.Field
						name="name"
						validators={{
							onChange: z.string().min(3).max(45),
						}}
						children={(field) => (
							<div>
								<Label htmlFor={field.name}>Name</Label>
								<Input
									id={field.name}
									name={field.name}
									type="text"
									placeholder="Name"
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									value={field.state.value}
									maxLength={45}
								/>
								<div
									className={cn(
										"flex flex-row justify-between text-[0.8rem] font-medium mb-[-16px]",
										!!field.state.meta.errors.length && "text-destructive",
									)}
								>
									<p>{field.state.meta.errors}</p>
									<p>{field.state.value.length}/45</p>
								</div>
							</div>
						)}
					/>

					<form.Field
						name="description"
						children={(field) => (
							<div>
								<Label htmlFor={field.name}>Description</Label>
								<Textarea
									id={field.name}
									name={field.name}
									placeholder="Description"
									rows={4}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									value={field.state.value}
								/>
							</div>
						)}
					/>

					<form.Field
						name="validRange"
						mode="array"
						validators={{
							onChange: z.array(z.date().optional()).refine((dates) => {
								if (dates[0] && dates[1]) {
									return dates[0] < dates[1];
								}
								return true;
							}, "The valid from date must be before the valid until date"),
						}}
						children={(field) => (
							<div>
								<div className="flex flex-row gap-2">
									<field.Field
										// @ts-expect-error
										index={0}
										validators={{
											onChange: z.date(),
										}}
										children={(nestedField) => (
											<div className="flex flex-col gap-1 flex-1">
												<Label htmlFor={nestedField.name}>Valid from</Label>
												<DatePicker
													id={nestedField.name}
													variant="outline"
													// @ts-expect-error
													value={nestedField.state.value}
													onChange={nestedField.handleChange}
												/>
												{nestedField.state.meta.errors && (
													<p className="text-[0.8rem] font-medium text-destructive">
														{nestedField.state.meta.errors}
													</p>
												)}
											</div>
										)}
									/>
									{/* TODO Make it possible to disable dates before the from date without another subscribe */}
									<field.Field
										// @ts-expect-error
										index={1}
										validators={{
											onChange: z.date(),
										}}
										children={(nestedField) => (
											<div className="flex flex-col gap-1 flex-1">
												<Label htmlFor={nestedField.name}>Valid until</Label>
												<DatePicker
													id={nestedField.name}
													variant="outline"
													// @ts-expect-error
													value={nestedField.state.value}
													onChange={nestedField.handleChange}
												/>
												{nestedField.state.meta.errors && (
													<p className="text-[0.8rem] font-medium text-destructive">
														{nestedField.state.meta.errors}
													</p>
												)}
											</div>
										)}
									/>
								</div>
								{field.state.meta.errors && (
									<p className="text-[0.8rem] font-medium text-destructive">
										{field.state.meta.errors}
									</p>
								)}
							</div>
						)}
					/>

					<h5 className="text-lg font-bold">Prices</h5>

					<div>
						<Label htmlFor="currency">Currency</Label>
						<Select
							value={selectedCurrency}
							onValueChange={setSelectedCurrency}
						>
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
								{/* TODO Validate rising count */}
								<form.Field
									name="prices"
									validators={{
                    // TODO For some reason this validator is not run again once it failed once
										onChange: z.record(
											z.string(),
											z
												.array(
													z.object({
														count: z.number().positive().int(),
														price: z.number().positive(),
														taxRate: z.number().min(0).max(19),
													}),
												)
												.min(1)
                        .refine(values => {
                          if (values.length <= 1) {
                            return true;
                          }

                          return values.every((price, index, array) => {
                            if (index === 0) {
                              return true;
                            }
                            return price.count > array[index - 1].count;
                          });
                        }, "The counts should be increasing"),
										)
                      .refine((prices) => Object.keys(prices).length > 0, "At least one price must be configured"),
									}}
									children={(prices) => (
										<>
											{prices.state.value[selectedCurrency]?.map(
												(price, index) => (
													<TableRow key={index}>
														<TableCell>{price.count}</TableCell>
														<TableCell>€ {price.price.toFixed(2)}</TableCell>
														<TableCell>{price.taxRate}%</TableCell>
														<TableCell align="right">
															<Button
																type="button"
																variant="destructive"
																onClick={() => {
                                  // TODO since this leaves an empty array it is not possible to add a price, remove it and then submit the form (e.g. if you entered it for the wrong currency on accident)
																	form.removeFieldValue(
																		`prices.${selectedCurrency}`,
																		index,
																	);
																}}
															>
																Delete
															</Button>
														</TableCell>
													</TableRow>
												),
											)}
                      {prices.state.meta.errors && (
                        <TableRow disableHoverStyle>
                          <TableCell colSpan={4}>
                            <p className="text-[0.8rem] font-medium text-destructive">
                              {prices.state.meta.errors}
                            </p>
                          </TableCell>
                        </TableRow>
                      )}
										</>
									)}
								/>
							</TableBody>
							<TableFooter>
								<newPriceForm.Provider>
									<TableRow disableHoverStyle>
										<newPriceForm.Field
											name="count"
											validators={{
												onChange: z.number().positive().int(),
											}}
											children={(field) => (
												<TableCell className="align-top">
													<Label htmlFor="new-min-count">Min Count</Label>
													<Input
														id="new-min-count"
														name="new-min-count"
														type="number"
														placeholder="Min Count"
														value={field.state.value ?? ""}
														onBlur={field.handleBlur}
														onChange={(e) =>
															field.handleChange(
																e.target.value ? +e.target.value : undefined,
															)
														}
													/>
													{field.state.meta.errors && (
														<p className="text-[0.8rem] font-medium text-destructive">
															{field.state.meta.errors}
														</p>
													)}
												</TableCell>
											)}
										/>
										<newPriceForm.Field
											name="price"
											validators={{
												onChange: z.number().positive(),
											}}
											children={(field) => (
												<TableCell className="align-top">
													<Label htmlFor="new-price">New price</Label>
													<Input
														id="new-price"
														name="new-price"
														type="number"
														placeholder="Price"
														value={field.state.value ?? ""}
														onBlur={field.handleBlur}
														onChange={(e) =>
															field.handleChange(
																e.target.value ? +e.target.value : undefined,
															)
														}
													/>
													{field.state.meta.errors && (
														<p className="text-[0.8rem] font-medium text-destructive">
															{field.state.meta.errors}
														</p>
													)}
												</TableCell>
											)}
										/>
										<newPriceForm.Field
											name="taxRate"
											children={(field) => (
												<TableCell className="align-top">
													<Label htmlFor="new-tax-rate">Tax Rate</Label>
													<Select
														defaultValue="19"
														value={`${field.state.value}`}
														onValueChange={(value) =>
															field.handleChange(+value)
														}
													>
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
											)}
										/>

										<TableCell align="right" className="align-top">
											<newPriceForm.Subscribe
												selector={(state) => state.canSubmit}
												children={(canSubmit) => (
													<Button
														className="mt-5"
														type="button"
														variant="outline"
														onClick={() => newPriceForm.handleSubmit()}
														disabled={!canSubmit}
													>
														Add new price
													</Button>
												)}
											/>
										</TableCell>
									</TableRow>
								</newPriceForm.Provider>
							</TableFooter>
							<TableCaption>
								<form.Subscribe
									selector={(state) => state.values.prices}
									children={(prices) => {
										const populatedCurrencyCount = Object.keys(prices).filter(
											(currency) => prices[currency].length > 0,
										).length;
                    const pluralisedCurrency = populatedCurrencyCount !== 1
                      ? "currencies are"
                      : "currency is";
                    return (
											<>
												Currently {populatedCurrencyCount} {pluralisedCurrency} configured
											</>
										);
									}}
								/>
							</TableCaption>
						</Table>
					</div>

					{/* TODO Remove a variant + validate unique name */}
					<h5 className="text-lg font-bold">Variants</h5>

					<form.Field
						name="variants"
						mode="array"
						children={(variantField) => (
							<Tabs
								value={selectedVariant.toString()}
								onValueChange={(value) => setSelectedVariant(+value)}
							>
								<TabsList>
									{/* TODO This should be possible and update the state */}
									{/*variantField.state.value.map((variant, index) => (
										<TabsTrigger key={index} value={`${index}`}>
											{variant.name || "..."}
										</TabsTrigger>
									))*/}
									<form.Subscribe
										selector={(state) => state.values.variants}
										children={(variants) =>
											variants?.map(({ name }, index) => (
												<TabsTrigger key={index} value={`${index}`}>
													{name || "..."}
												</TabsTrigger>
											))
										}
									/>
									<TabsTrigger
										value={"new"}
										onClick={() => {
											variantField.pushValue({
												name: "",
												options: [],
											});
											setTimeout(() => {
												setSelectedVariant(
													form.getFieldValue("variants").length - 1,
												);
											}, 0);
										}}
									>
										+
									</TabsTrigger>
								</TabsList>
								{variantField.state.value?.map((_, index) => (
									<TabsContent key={index} value={`${index}`}>
										<variantField.Field
											// @ts-expect-error
											index={index}
											name="name"
                      validators={{
                        onChange: z.string().min(1),
                      }}
											preserveValue
											children={(field) => (
												<div>
													{/* TODO Add word counter + validate max length and min length */}
													<Label htmlFor={field.name}>Name</Label>
													<div className="flex flex-row gap-2">
														<Input
															id={field.name}
															name={field.name}
															type="text"
															placeholder="Name"
															onBlur={field.handleBlur}
															onChange={(e) => {
																field.handleChange(e.target.value);
															}}
															value={field.state.value as string}
														/>
														<Button
															type="button"
															variant="destructive"
															onClick={() => variantField.removeValue(index)}
														>
															Remove
														</Button>
													</div>
                          {field.state.meta.errors && (
                            <p className="text-[0.8rem] font-medium text-destructive">
                              {field.state.meta.errors}
                            </p>
                          )}
												</div>
											)}
										/>
										<div className="mt-2">
											<Label htmlFor={`variant-${index}-options`}>
												Options
											</Label>
											<variantField.Field
												// @ts-expect-error
												index={index}
												preserveValue
												// @ts-expect-error
												name="options"
                        mode="array"
                        validators={{
                          onChange: z.array(z.string().min(1)).min(1),
                        }}
												children={(optionField) => (
													<div className="flex flex-col gap-1">
														{(optionField.state.value as string[])?.map(
															(_, optionIndex) => (
																<optionField.Field
																	key={optionIndex}
																	// @ts-expect-error
																	index={optionIndex}
																	preserveValue
																	children={(field) => (
																		<Input
																			name={field.name}
																			type="text"
																			placeholder="Option"
																			autoFocus={
																				justAddedOption.current &&
																				optionIndex ===
																					(optionField.state.value as string[])
																						.length -
																						1
																			}
																			value={field.state.value as string}
																			onBlur={field.handleBlur}
																			onChange={(e) => {
																				if (!e.target.value) {
																					return optionField.removeValue(
																						optionIndex,
																					);
																				}
																				field.handleChange(e.target.value);
																			}}
																		/>
																	)}
																/>
															),
														)}
														<Input
															id={`variant-${index}-option-new`}
															name={`variant-${index}-option-new`}
															type="text"
															placeholder="Option"
															onChange={(e) => {
																optionField.pushValue(e.target.value as never);
																justAddedOption.current = true;
																e.target.value = "";
															}}
														/>
                            {optionField.state.meta.errors && (
                              <p className="text-[0.8rem] font-medium text-destructive">
                                {optionField.state.meta.errors}
                              </p>
                            )}
													</div>
												)}
											/>
										</div>
									</TabsContent>
								))}
							</Tabs>
						)}
					/>

					<form.Subscribe
						selector={(state) => state.canSubmit}
						children={(canSubmit) => (
							<Button
								className="mt-2 max-w-[280px]"
								disabled={!canSubmit}
								type="submit"
							>
								Save configuration
							</Button>
						)}
					/>
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
						<Collapsible>
							<CollapsibleTrigger>
								<Button variant="secondary" type="button">
									+ Show values
								</Button>
							</CollapsibleTrigger>
							<CollapsibleContent>
								<form.Subscribe
									selector={(state) => state.values}
									children={(values) => (
										<pre>{JSON.stringify(values, null, 2)}</pre>
									)}
								/>
							</CollapsibleContent>
						</Collapsible>
					</CardContent>
					<CardFooter className="flex flex-row gap-2">
						<Button variant="outline" onClick={() => form.validate("submit")}>
							Force Validate Form
						</Button>
						<Button
							variant="outline"
							onClick={() => form.validateAllFields("submit")}
						>
							Force Validate Fields
						</Button>
						<Button variant="destructive" onClick={() => form.reset()}>
							Reset
						</Button>
					</CardFooter>
				</Card>
			</form.Provider>
		</main>
	);
};

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const rootElement = document.getElementById("root")!;

createRoot(rootElement).render(<BehaviourCheck />);
