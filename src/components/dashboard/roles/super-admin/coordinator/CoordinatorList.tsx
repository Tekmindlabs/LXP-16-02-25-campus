import { useEffect } from 'react';
import { api } from '@/utils/api';

export const CoordinatorList = () => {
    const { 
        data: coordinators, 
        isLoading, 
        error,
        refetch 
    } = api.coordinator.getCoordinators.useQuery(undefined, {
        retry: 1,
        onError: (error) => {
            console.error('Failed to fetch coordinators:', error);
        }
    });

    useEffect(() => {
        if (error) {
            console.error('Coordinator list error:', error);
        }
    }, [error]);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading coordinators: {error.message}</div>;
    if (!coordinators) return <div>No coordinators found</div>;

    return (
        <div>
            {coordinators.map((coordinator) => (
                <div key={coordinator.id}>
                    <h3>{coordinator.name}</h3>
                    <p>Email: {coordinator.email}</p>
                    <p>Type: {coordinator.coordinatorProfile?.type}</p>
                    <p>Campus: {coordinator.coordinatorProfile?.campus?.name}</p>
                    {/* Add other fields as needed */}
                </div>
            ))}
        </div>
    );
};
