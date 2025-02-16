import { FC } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CampusTabsProps {
	campusId?: string;
}

const tabs = [
	{
		title: "Overview",
		href: "",
	},
	{
		title: "Buildings",
		href: "/buildings",
	},
	{
		title: "Classes",
		href: "/classes",
	},
	{
		title: "Teachers",
		href: "/teachers",
	},
	{
		title: "Students",
		href: "/students",
	},
];

export const CampusTabs: FC<CampusTabsProps> = ({ campusId }) => {
	const router = useRouter();
	const pathname = usePathname();

	const baseUrl = campusId ? `/dashboard/super-admin/campus/${campusId}` : "/dashboard/super-admin/campus";

	return (
		<div className="flex space-x-2 border-b">
			{tabs.map((tab) => {
				const href = `${baseUrl}${tab.href}`;
				const isActive = pathname === href;

				return (
					<Button
						key={tab.href}
						variant="ghost"
						className={cn(
							"px-4",
							isActive && "bg-muted font-semibold"
						)}
						onClick={() => router.push(href)}
					>
						{tab.title}
					</Button>
				);
			})}
		</div>
	);
};