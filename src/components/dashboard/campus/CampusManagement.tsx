"use client";

import { FC } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import CampusForm from "../roles/super-admin/campus/CampusForm";
import { BuildingManagement } from "./BuildingManagement";

export const CampusManagement: FC = () => {
	const [isFormOpen, setIsFormOpen] = useState(false);

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h2 className="text-3xl font-bold tracking-tight">Campus Management</h2>
				<Button onClick={() => setIsFormOpen(true)}>
					<Plus className="mr-2 h-4 w-4" /> Add Campus
				</Button>
			</div>

			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="buildings">Buildings</TabsTrigger>
					<TabsTrigger value="classes">Classes</TabsTrigger>
					<TabsTrigger value="teachers">Teachers</TabsTrigger>
					<TabsTrigger value="students">Students</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="text-sm font-medium">Total Campuses</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="text-2xl font-bold">0</div>
							</CardContent>
						</Card>
						{/* Add more metric cards */}
					</div>
				</TabsContent>

				<TabsContent value="buildings">
					<BuildingManagement />
				</TabsContent>

				{/* Other tab contents */}
			</Tabs>

			{isFormOpen && (
				<CampusForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
			)}
		</div>
	);
};