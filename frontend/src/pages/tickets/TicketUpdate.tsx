import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { updateTicket, type TicketDetail as TicketDetailData } from '../../services/tickets';
import { getAgents } from '../../services/agents';
import { TicketStatus, TicketCategory } from '@repo/core';
import {
	Box,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	type SelectChangeEvent,
	styled,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import { toTitleCase } from '../../lib/format';
import { MetaLabel } from './TicketDetail';

const SrOnlyLabel = styled(InputLabel)(visuallyHidden);

interface TicketUpdateProps {
	ticket: TicketDetailData;
}

export function TicketUpdate({ ticket }: TicketUpdateProps) {
	const queryClient = useQueryClient();
	const { data: agents = [] } = useQuery({
		queryKey: ['agents'],
		queryFn: getAgents,
	});

	const [agentId, setAgentId] = useState('');
	const [localStatus, setLocalStatus] = useState('');
	const [localCategory, setLocalCategory] = useState('');

	const invalidate = () =>
		queryClient.invalidateQueries({ queryKey: ['ticket', ticket.id] });

	const assignMutation = useMutation({
		mutationFn: (newAgentId: string | null) =>
			updateTicket(ticket.id, { assignedAgentId: newAgentId }),
		onSuccess: invalidate,
	});
	const statusMutation = useMutation({
		mutationFn: (status: string) =>
			updateTicket(ticket.id, {
				status: status as (typeof TicketStatus)[keyof typeof TicketStatus],
			}),
		onSuccess: invalidate,
	});
	const categoryMutation = useMutation({
		mutationFn: (category: string | null) =>
			updateTicket(ticket.id, {
				category: (category || null) as
					| (typeof TicketCategory)[keyof typeof TicketCategory]
					| null,
			}),
		onSuccess: invalidate,
	});

	const effectiveAgentId = assignMutation.isPending
		? agentId
		: (ticket.assignedAgent?.id ?? '');
	const effectiveStatus = statusMutation.isPending ? localStatus : ticket.status;
	const effectiveCategory = categoryMutation.isPending
		? localCategory
		: (ticket.category ?? '');

	function handleAssignChange(e: SelectChangeEvent) {
		const newId = e.target.value;
		setAgentId(newId);
		assignMutation.mutate(newId || null);
	}

	function handleStatusChange(e: SelectChangeEvent) {
		const newStatus = e.target.value;
		setLocalStatus(newStatus);
		statusMutation.mutate(newStatus);
	}

	function handleCategoryChange(e: SelectChangeEvent) {
		const newCategory = e.target.value;
		setLocalCategory(newCategory);
		categoryMutation.mutate(newCategory || null);
	}

	return (
		<Stack direction='column' spacing={2}>
			<Box>
				<MetaLabel>Assigned to</MetaLabel>
				<FormControl fullWidth size='small'>
					<SrOnlyLabel id='assign-agent-label'>Assigned to</SrOnlyLabel>
					<Select
						labelId='assign-agent-label'
						value={effectiveAgentId}
						onChange={handleAssignChange}
						displayEmpty
						disabled={assignMutation.isPending}
					>
						<MenuItem value=''>Unassigned</MenuItem>
						{agents.map((agent) => (
							<MenuItem key={agent.id} value={agent.id}>
								{agent.name}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>
			<Box>
				<MetaLabel>Status</MetaLabel>
				<FormControl fullWidth size='small'>
					<SrOnlyLabel id='status-label'>Status</SrOnlyLabel>
					<Select
						labelId='status-label'
						value={effectiveStatus}
						onChange={handleStatusChange}
						disabled={statusMutation.isPending}
					>
						{Object.values(TicketStatus)
							.sort()
							.map((s) => (
								<MenuItem key={s} value={s}>
									{toTitleCase(s)}
								</MenuItem>
							))}
					</Select>
				</FormControl>
			</Box>
			<Box>
				<MetaLabel>Category</MetaLabel>
				<FormControl fullWidth size='small'>
					<SrOnlyLabel id='category-label'>Category</SrOnlyLabel>
					<Select
						labelId='category-label'
						value={effectiveCategory}
						onChange={handleCategoryChange}
						displayEmpty
						disabled={categoryMutation.isPending}
					>
						<MenuItem value=''>None</MenuItem>
						{Object.values(TicketCategory)
							.sort()
							.map((c) => (
								<MenuItem key={c} value={c}>
									{toTitleCase(c)}
								</MenuItem>
							))}
					</Select>
				</FormControl>
			</Box>
		</Stack>
	);
}
