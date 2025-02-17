import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/utils/api';
import type { CampusContextType } from '@/types/campus';
import type { Campus, Program, ClassGroup } from '@prisma/client';

const CampusContext = createContext<CampusContextType | undefined>(undefined);

export function CampusProvider({ children }: { children: React.ReactNode }) {
	const [currentCampus, setCurrentCampus] = useState<Campus | null>(null);
	const [programs, setPrograms] = useState<Program[]>([]);
	const [classGroups, setClassGroups] = useState<ClassGroup[]>([]);

	const utils = api.useContext();
	const { data: campusData } = api.campus.getAll.useQuery();
	const { data: programsData } = api.program.getAll.useQuery(undefined);
	const { data: classGroupsData } = api.classGroup.getAllClassGroups.useQuery(undefined);

	const refreshData = () => {
		void utils.campus.getAll.invalidate();
		void utils.program.getAll.invalidate();
		void utils.classGroup.getAllClassGroups.invalidate();
	};

	useEffect(() => {
		if (campusData?.length) setCurrentCampus(campusData[0]);
		if (programsData) setPrograms(programsData as Program[]);
		if (classGroupsData) setClassGroups(classGroupsData as ClassGroup[]);
	}, [campusData, programsData, classGroupsData]);

	return (
		<CampusContext.Provider 
			value={{ 
				currentCampus, 
				setCurrentCampus, 
				programs, 
				classGroups, 
				refreshData 
			}}
		>
			{children}
		</CampusContext.Provider>
	);
}

export const useCampusContext = () => {
	const context = useContext(CampusContext);
	if (context === undefined) {
		throw new Error('useCampusContext must be used within a CampusProvider');
	}
	return context;
};