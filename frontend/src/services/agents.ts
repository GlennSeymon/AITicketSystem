import api from '../lib/api';

export interface Agent {
	id: string;
	name: string;
	email: string;
}

export async function getAgents(): Promise<Agent[]> {
	const { data } = await api.get<Agent[]>('/api/agents');
	return data;
}
