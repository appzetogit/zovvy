import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '@/lib/apiUrl';

const API_URL = API_BASE_URL;

const getAuthHeaders = () => {
    try {
        const token = localStorage.getItem('farmlyf_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
        return {};
    }
};

export const useContactSubmissions = ({ page = 1, limit = 20, status = 'all', search = '' } = {}) => {
    return useQuery({
        queryKey: ['contact-submissions', page, limit, status, search],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                status,
                search
            });

            const response = await fetch(`${API_URL}/contact-submissions?${params.toString()}`, {
                headers: getAuthHeaders(),
                credentials: 'include'
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch contact submissions');
            }

            return response.json();
        }
    });
};

export const useUpdateContactSubmissionStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, status }) => {
            const response = await fetch(`${API_URL}/contact-submissions/${id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders()
                },
                credentials: 'include',
                body: JSON.stringify({ status })
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update contact submission status');
            }

            return data;
        },
        onSuccess: (data) => {
            const updatedSubmission = data?.submission;

            if (updatedSubmission?._id) {
                queryClient.setQueriesData(
                    { queryKey: ['contact-submissions'] },
                    (oldData) => {
                        if (!oldData?.submissions) return oldData;

                        return {
                            ...oldData,
                            submissions: oldData.submissions.map((submission) =>
                                submission._id === updatedSubmission._id
                                    ? { ...submission, ...updatedSubmission, status: updatedSubmission.status || 'pending' }
                                    : submission
                            )
                        };
                    }
                );
            }

            queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
            toast.success(data.message || 'Status updated successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to update status');
        }
    });
};

export const useCreateContactSubmission = () => {
    return useMutation({
        mutationFn: async (payload) => {
            const response = await fetch(`${API_URL}/contact-submissions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit message');
            }

            return data;
        },
        onSuccess: (data) => {
            toast.success(data.message || 'Message submitted successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to submit message');
        }
    });
};
