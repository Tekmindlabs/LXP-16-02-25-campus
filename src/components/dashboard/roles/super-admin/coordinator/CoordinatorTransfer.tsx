// src/components/dashboard/roles/super-admin/coordinator/CoordinatorTransfer.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { api } from "@/utils/api";
import { useToast } from "@/hooks/use-toast";

interface CoordinatorTransferProps {
  programId: string;
  currentCoordinatorId: string;
}

export const CoordinatorTransfer = ({
  programId,
  currentCoordinatorId,
}: CoordinatorTransferProps) => {
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const toast = useToast();

  const { data: availableCoordinators } = api.coordinator.searchCoordinators.useQuery({
    status: "ACTIVE",
  });

  const transferMutation = api.coordinator.transferCoordinator.useMutation({
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Program transferred successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTransfer = async () => {
    if (!selectedCoordinatorId) {
      toast({
        title: "Error",
        description: "Please select a coordinator to transfer to",
        variant: "destructive",
      });
      return;
    }

    await transferMutation.mutateAsync({
      programId,
      fromCoordinatorId: currentCoordinatorId,
      toCoordinatorId: selectedCoordinatorId,
      transferNotes,
    });
  };

  return (
    <div className="space-y-4">
      <Select
        value={selectedCoordinatorId}
        onValueChange={setSelectedCoordinatorId}
        options={availableCoordinators?.map(c => ({
          value: c.id,
          label: c.name,
        }))}
        placeholder="Select new coordinator"
      />
      <Input
        placeholder="Transfer notes"
        value={transferNotes}
        onChange={(e) => setTransferNotes(e.target.value)}
      />
      <Button
        onClick={handleTransfer}
        disabled={transferMutation.isLoading}
      >
        Transfer Program
      </Button>
    </div>
  );
};