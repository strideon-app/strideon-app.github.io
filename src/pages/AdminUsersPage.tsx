import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group as MantineGroup,
  Select,
  Stack,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import {
  addUserToGroup,
  listGroups,
  listUsers,
  removeUserFromGroup,
  type AdminUser,
} from "@/api/users";
import type { Group } from "@/api/auth";

function UserGroupAssigner({ user, groups }: { user: AdminUser; groups: Group[] }) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const addMutation = useMutation({
    mutationFn: (groupId: number) => addUserToGroup(user.id, groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      setSelected(null);
    },
    onError: () =>
      notifications.show({
        color: "red",
        title: "Erro",
        message: "Não foi possível adicionar ao grupo.",
      }),
  });

  const removeMutation = useMutation({
    mutationFn: (groupId: number) => removeUserFromGroup(user.id, groupId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
    onError: () =>
      notifications.show({
        color: "red",
        title: "Erro",
        message: "Não foi possível remover do grupo.",
      }),
  });

  const availableGroups = groups.filter((g) => !user.groups.some((ug) => ug.id === g.id));

  return (
    <Stack gap="xs">
      <MantineGroup gap="xs" wrap="wrap">
        {user.groups.length === 0 && (
          <Text size="sm" c="dimmed">
            Sem grupos
          </Text>
        )}
        {user.groups.map((g) => (
          <Badge key={g.id} variant="light" rightSection={
            <ActionIcon
              size="xs"
              color="red"
              variant="transparent"
              onClick={() => removeMutation.mutate(g.id)}
              aria-label={`Remover do grupo ${g.name}`}
            >
              ×
            </ActionIcon>
          }>
            {g.name}
          </Badge>
        ))}
      </MantineGroup>

      {availableGroups.length > 0 && (
        <MantineGroup gap="xs" align="flex-end">
          <Select
            placeholder="Adicionar ao grupo"
            data={availableGroups.map((g) => ({ value: String(g.id), label: g.name }))}
            value={selected}
            onChange={setSelected}
            size="xs"
            w={200}
          />
          <Button
            size="xs"
            disabled={!selected}
            loading={addMutation.isPending}
            onClick={() => selected && addMutation.mutate(Number(selected))}
          >
            Adicionar
          </Button>
        </MantineGroup>
      )}
    </Stack>
  );
}

export function AdminUsersPage() {
  const usersQuery = useQuery({ queryKey: ["admin", "users"], queryFn: listUsers });
  const groupsQuery = useQuery({ queryKey: ["admin", "groups"], queryFn: listGroups });

  const users = usersQuery.data ?? [];
  const groups = groupsQuery.data ?? [];

  return (
    <Container size="lg" py="xl">
      <MantineGroup justify="space-between" mb="md">
        <Title order={2}>Administração de usuários</Title>
        <Button component={Link} to="/admin/plans" variant="default">
          Planilhas
        </Button>
      </MantineGroup>

      {usersQuery.isLoading || groupsQuery.isLoading ? (
        <Text>Carregando...</Text>
      ) : (
        <Table striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nome</Table.Th>
              <Table.Th>E-mail</Table.Th>
              <Table.Th>Login</Table.Th>
              <Table.Th>Grupos</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {users.map((u) => (
              <Table.Tr key={u.id}>
                <Table.Td>{u.name}</Table.Td>
                <Table.Td>{u.email}</Table.Td>
                <Table.Td>
                  <MantineGroup gap={4}>
                    {u.has_password && (
                      <Badge size="xs" variant="light">
                        senha
                      </Badge>
                    )}
                    {u.google_linked && (
                      <Badge size="xs" variant="light" color="blue">
                        google
                      </Badge>
                    )}
                  </MantineGroup>
                </Table.Td>
                <Table.Td>
                  <UserGroupAssigner user={u} groups={groups} />
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Container>
  );
}
