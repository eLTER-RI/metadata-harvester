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
      const response = await api.post(`/records/${darId}/rules`, rules);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['record', variables.darId] });
      queryClient.invalidateQueries({ queryKey: ['rules', variables.darId] });
    },
    onError: () => {
      // TODO: add toast notification
    },
  });
};

export const useDeleteRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ darId, ruleId }: { darId: string; ruleId: string }) => {
      const response = await api.delete(`/records/${darId}/rules/${ruleId}`);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['rules', variables.darId] });
    },
    onError: () => {
      // TODO: add toast notification
    },
  });
};

export const useHarvestRepository = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      repository,
      checkHarvestChanges = false,
    }: {
      repository: string;
      checkHarvestChanges?: boolean;
    }) => {
      const response = await api.post('/harvest', {
        repository,
        checkHarvestChanges,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['filters'] });
    },
    onError: () => {
      // TODO: add toast notification
    },
  });
};

export const useCreateManualRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ metadata }: { metadata: any }) => {
      const response = await api.post('/manual-records', { metadata });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['filters'] });
    },
    onError: () => {
      // TODO: add toast notification
    },
  });
};

export const useUpdateManualRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ darId, metadata }: { darId: string; metadata: any }) => {
      const response = await api.put(`/manual-records/${darId}`, { metadata });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['filters'] });
      queryClient.invalidateQueries({ queryKey: ['record', variables.darId] });
      queryClient.invalidateQueries({ queryKey: ['manualRecords'] });
    },
    onError: () => {
      // TODO: add toast notification
    },
  });
};

export const useDeleteManualRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (darId: string) => {
      const response = await api.delete(`/manual-records/${darId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manualRecords'] });
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['filters'] });
    },
    onError: () => {
      // TODO: add toast notification
    },
  });
};

export const useReHarvestRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sourceUrl,
      repository,
      checkHarvestChanges = false,
    }: {
      sourceUrl: string;
      repository: string;
      checkHarvestChanges?: boolean;
    }) => {
      const response = await api.post('/harvest/single', {
        sourceUrl,
        repository,
        checkHarvestChanges,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['records'] });
      queryClient.invalidateQueries({ queryKey: ['filters'] });
    },
    onError: () => {
      // TODO: add toast notification
    },
  });
};

export const useCreateOarAsset = () => {
  return useMutation({
    mutationFn: async ({ url, darAssetId }: { url: string; darAssetId: string }) => {
      const response = await api.post('/oar', { url, darAssetId });
      return response.data;
    },
  });
};

export const useDeleteOarAsset = () => {
  return useMutation({
    mutationFn: async (onlineAssetId: string) => {
      const response = await api.delete(`/oar/${onlineAssetId}`);
      return response.data;
    },
    onError: () => {
      // TODO: add toast notification
    },
  });
};
