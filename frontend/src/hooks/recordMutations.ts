import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export const useResolveRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: any) => {
      const newStatus = record.is_resolved ? 'unresolved' : 'resolved';
      const response = await api.patch(`/records/${record.dar_id}/status`, {
        status: newStatus,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['filters'] }); // refetch filters
    },

    onError: () => {
      // TODO: add toast notification
    },
  });
};

export const useCreateRules = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ darId, rules }: { darId: string; rules: any[] }) => {
      if (rules.length === 0) {
        // TODO:  add toast notification
        return;
      }
      const response = await api.post(`/records/${darId}/rules`, rules);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['record', variables.darId] });
    },
    onError: () => {
      // TODO: add toast notification
    },
  });
};
