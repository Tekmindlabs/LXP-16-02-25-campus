import { FC } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const buildingFormSchema = z.object({
	name: z.string().min(1, "Name is required"),
	code: z.string().min(1, "Code is required"),
	floors: z.number().min(1, "Must have at least 1 floor"),
	capacity: z.number().min(1, "Capacity must be at least 1"),
	description: z.string().optional(),
});

type BuildingFormData = z.infer<typeof buildingFormSchema>;

export const BuildingManagement: FC = () => {
	const [isFormOpen, setIsFormOpen] = useState(false);
	const [buildings, setBuildings] = useState<BuildingFormData[]>([]);

	const form = useForm<BuildingFormData>({
		resolver: zodResolver(buildingFormSchema),
		defaultValues: {
			name: "",
			code: "",
			floors: 1,
			capacity: 1,
			description: "",
		},
	});

	const onSubmit = (data: BuildingFormData) => {
		setBuildings([...buildings, data]);
		setIsFormOpen(false);
		form.reset();
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-medium">Buildings</h3>
				<Button onClick={() => setIsFormOpen(true)}>
					<Plus className="mr-2 h-4 w-4" /> Add Building
				</Button>
			</div>

			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Code</TableHead>
							<TableHead>Floors</TableHead>
							<TableHead>Capacity</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{buildings.map((building, index) => (
							<TableRow key={index}>
								<TableCell>{building.name}</TableCell>
								<TableCell>{building.code}</TableCell>
								<TableCell>{building.floors}</TableCell>
								<TableCell>{building.capacity}</TableCell>
								<TableCell>
									<Button variant="ghost" size="sm">Edit</Button>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>

			<Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Add New Building</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Name</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="code"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Code</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="grid grid-cols-2 gap-4">
								<FormField
									control={form.control}
									name="floors"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Floors</FormLabel>
											<FormControl>
												<Input 
													type="number" 
													{...field} 
													onChange={e => field.onChange(parseInt(e.target.value))}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="capacity"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Capacity</FormLabel>
											<FormControl>
												<Input 
													type="number" 
													{...field}
													onChange={e => field.onChange(parseInt(e.target.value))}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								control={form.control}
								name="description"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Description</FormLabel>
										<FormControl>
											<Input {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex justify-end space-x-2">
								<Button variant="outline" onClick={() => setIsFormOpen(false)}>
									Cancel
								</Button>
								<Button type="submit">Create</Button>
							</div>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</div>
	);
};