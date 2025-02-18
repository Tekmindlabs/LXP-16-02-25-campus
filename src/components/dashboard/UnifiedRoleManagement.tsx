import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { RoleForm } from "./RoleForm";

interface Role {
	id: string;
	name: string;
	description: string;
	context: "core" | "campus";
	permissions: string[];
}

export default function UnifiedRoleManagement() {
	const [roles, setRoles] = useState<Role[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [selectedRole, setSelectedRole] = useState<Role | null>(null);
	const [contextFilter, setContextFilter] = useState<"all" | "core" | "campus">("all");
	const { toast } = useToast();

	const fetchRoles = async () => {
		try {
			setIsLoading(true);
			// TODO: Implement API call to fetch roles
			const mockRoles: Role[] = [
				{ id: "1", name: "Admin", description: "Administrator role", context: "core", permissions: ["*"] },
				{ id: "2", name: "Teacher", description: "Teacher role", context: "core", permissions: ["teach"] },
				{ id: "3", name: "Student", description: "Student role", context: "core", permissions: ["learn"] },
				{ id: "4", name: "Campus Admin", description: "Campus Administrator role", context: "campus", permissions: ["*"] },
			];
			setRoles(mockRoles);
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to fetch roles. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Create new role
	const createRole = async (roleData: Omit<Role, "id">) => {
		try {
			setIsLoading(true);
			// TODO: Implement API call to create role
			// const response = await fetch('/api/roles', {
			//   method: 'POST',
			//   body: JSON.stringify(roleData)
			// });
			// const newRole = await response.json();
			// setRoles([...roles, newRole]);
			toast({
				title: "Success",
				description: "Role created successfully",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to create role. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Update existing role
	const updateRole = async (roleId: string, roleData: Partial<Role>) => {
		try {
			setIsLoading(true);
			// TODO: Implement API call to update role
			// const response = await fetch(`/api/roles/${roleId}`, {
			//   method: 'PUT',
			//   body: JSON.stringify(roleData)
			// });
			// const updatedRole = await response.json();
			// setRoles(roles.map(role => role.id === roleId ? updatedRole : role));
			toast({
				title: "Success",
				description: "Role updated successfully",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to update role. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Delete role
	const deleteRole = async (roleId: string) => {
		try {
			setIsLoading(true);
			// TODO: Implement API call to delete role
			// await fetch(`/api/roles/${roleId}`, {
			//   method: 'DELETE'
			// });
			// setRoles(roles.filter(role => role.id !== roleId));
			toast({
				title: "Success",
				description: "Role deleted successfully",
			});
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Error",
				description: "Failed to delete role. Please try again.",
			});
		} finally {
			setIsLoading(false);
		}
	};

	const filteredRoles = roles.filter((role) =>
		contextFilter === "all" ? true : role.context === contextFilter
	);

	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Role Management</CardTitle>
				<CardDescription>
					Manage roles and permissions for core and campus contexts
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex justify-between items-center mb-6">
					<Select
						value={contextFilter}
						onValueChange={(value) => setContextFilter(value as typeof contextFilter)}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Filter by context" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All Roles</SelectItem>
							<SelectItem value="core">Core Roles</SelectItem>
							<SelectItem value="campus">Campus Roles</SelectItem>
						</SelectContent>
					</Select>
					<Button
						variant="default"
						className="ml-4"
						onClick={() => setSelectedRole({} as Role)}
					>
						<Plus className="w-4 h-4 mr-2" />
						Create New Role
					</Button>
				</div>

				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Context</TableHead>
								<TableHead>Description</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								<TableRow>
									<TableCell colSpan={4} className="text-center">
										<div className="flex items-center justify-center py-4">
											<Loader2 className="w-6 h-6 animate-spin" />
										</div>
									</TableCell>
								</TableRow>
							) : filteredRoles.length === 0 ? (
								<TableRow>
									<TableCell colSpan={4} className="text-center py-6">
										No roles found
									</TableCell>
								</TableRow>
							) : (
								filteredRoles.map((role) => (
									<TableRow key={role.id}>
										<TableCell className="font-medium">{role.name}</TableCell>
										<TableCell>
											<Badge variant={role.context === "core" ? "default" : "secondary"}>
												{role.context}
											</Badge>
										</TableCell>
										<TableCell>{role.description}</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="icon"
													onClick={() => setSelectedRole(role)}
												>
													<Pencil className="w-4 h-4" />
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="text-destructive"
													onClick={() => deleteRole(role.id)}
												>
													<Trash className="w-4 h-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	);
}