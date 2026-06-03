import axios from 'axios';

const api = axios.create();

api.interceptors.response.use(
	(res) => res,
	(err) => {
		if (axios.isAxiosError(err) && err.response?.status === 401) {
			window.location.href = '/login';
		}
		return Promise.reject(err);
	}
);

export function extractError(err: unknown, fallback: string): Error {
	const message = axios.isAxiosError(err) ? (err.response?.data?.error ?? fallback) : fallback;
	return new Error(message);
}

export default api;
