import * as Sentry from '@sentry/react';
import api, { extractError } from '../lib/api';

export interface User {
	id: string;
	name: string;
	email: string;
	role: 'ADMIN' | 'AGENT';
	isActive: boolean;
	createdAt: string;
}

export interface CreateUserData extends Pick<User, 'name' | 'email' | 'role'> {
	password: string;
}

export type UpdateUserData = Partial<Pick<User, 'name' | 'email' | 'role' | 'isActive'>>;

export async function getUsers(): Promise<User[]> {
	const { data } = await api.get<User[]>('/api/users');
	return data;
}

export async function createUser(data: CreateUserData): Promise<User> {
	try {
		const { data: user } = await api.post<User>('/api/users', data);
		return user;
	} catch (err) {
		Sentry.captureException(err);
		throw extractError(err, 'Failed to create user');
	}
}

export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
	try {
		const { data: user } = await api.patch<User>(`/api/users/${id}`, data);
		return user;
	} catch (err) {
		Sentry.captureException(err);
		throw extractError(err, 'Failed to update user');
	}
}

export async function deleteUser(id: string): Promise<void> {
	try {
		await api.delete(`/api/users/${id}`);
	} catch (err) {
		Sentry.captureException(err);
		throw extractError(err, 'Failed to delete user');
	}
}
