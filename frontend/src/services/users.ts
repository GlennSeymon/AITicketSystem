import api, { extractError } from '../lib/api';

export type User = {
	id: string;
	name: string;
	email: string;
	role: 'ADMIN' | 'AGENT';
	isActive: boolean;
	createdAt: string;
};

export type CreateUserData = {
	name: string;
	email: string;
	password: string;
	role: 'ADMIN' | 'AGENT';
};

export type UpdateUserData = {
	name?: string;
	email?: string;
	role?: 'ADMIN' | 'AGENT';
	isActive?: boolean;
};

export async function getUsers(): Promise<User[]> {
	const { data } = await api.get<User[]>('/api/users');
	return data;
}

export async function createUser(data: CreateUserData): Promise<User> {
	try {
		const { data: user } = await api.post<User>('/api/users', data);
		return user;
	} catch (err) {
		throw extractError(err, 'Failed to create user');
	}
}

export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
	try {
		const { data: user } = await api.patch<User>(`/api/users/${id}`, data);
		return user;
	} catch (err) {
		throw extractError(err, 'Failed to update user');
	}
}

export async function deleteUser(id: string): Promise<void> {
	try {
		await api.delete(`/api/users/${id}`);
	} catch (err) {
		throw extractError(err, 'Failed to delete user');
	}
}
