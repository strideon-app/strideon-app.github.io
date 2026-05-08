import {
  ActionIcon,
  Badge,
  Button,
  Container,
  Group,
  Modal,
  NumberInput,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useDisclosure } from "@mantine/hooks";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  createPlan,
  deletePlan,
  listPlans,
  type TrainingPlanCreatePayload,
  type TrainingPlanSummary,
} from "@/api/trainingPlans";
import { formatPace, parsePace } from "@/utils/pace";

interface CreatePlanFormValues {
  distance_km: number | "";
  pace_text: string;
  level: number | "";
  title: string;
  description: string;
  published: boolean;
}

function CreatePlanModal({
  opened,
  onClose,
  onCreated,
}: {
  opened: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const form = useForm<CreatePlanFormValues>({
    initialValues: {
      distance_km: "",
      pace_text: "",
      level: 1,
      title: "",
      description: "",
      published: false,
    },
    validate: {
      distance_km: (v) => (typeof v === "number" && v > 0 ? null : "Distância inválida"),
      pace_text: (v) => (parsePace(v) != null ? null : "Pace inválido (use M:SS)"),
      level: (v) => (typeof v === "number" && v >= 1 ? null : "Nível inválido"),
      title: (v) => (v.trim().length > 0 ? null : "Informe um título"),
    },
  });

  const mutation = useMutation({
    mutationFn: (payload: TrainingPlanCreatePayload) => createPlan(payload),
    onSuccess: (plan) => {
      notifications.show({ color: "green", title: "Planilha criada", message: plan.title });
      form.reset();
      onCreated(plan.id);
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        "Falha ao criar planilha.";
      notifications.show({ color: "red", title: "Erro", message: detail });
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    const paceSeconds = parsePace(values.pace_text);
    if (paceSeconds == null) return;
    mutation.mutate({
      distance_km: values.distance_km as number,
      target_pace_seconds: paceSeconds,
      level: values.level as number,
      title: values.title.trim(),
      description: values.description.trim() || null,
      published: values.published,
    });
  });

  return (
    <Modal opened={opened} onClose={onClose} title="Nova planilha" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Group grow>
            <NumberInput
              label="Distância (km)"
              placeholder="5"
              min={1}
              {...form.getInputProps("distance_km")}
              required
            />
            <TextInput
              label="Pace alvo (M:SS)"
              placeholder="4:00"
              {...form.getInputProps("pace_text")}
              required
            />
            <NumberInput
              label="Nível (fase)"
              min={1}
              {...form.getInputProps("level")}
              required
            />
          </Group>
          <TextInput
            label="Título"
            placeholder="PREPARAÇÃO NÍVEL 1 - 5K PACE 4:00"
            {...form.getInputProps("title")}
            required
          />
          <Textarea
            label="Descrição"
            placeholder="Observações gerais da planilha"
            autosize
            minRows={2}
            {...form.getInputProps("description")}
          />
          <Switch
            label="Publicada (visível para Clients)"
            {...form.getInputProps("published", { type: "checkbox" })}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              Criar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export function AdminPlansPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modalOpened, modal] = useDisclosure(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const plansQuery = useQuery({ queryKey: ["admin", "plans"], queryFn: listPlans });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePlan(id),
    onMutate: (id) => setDeletingId(id),
    onSettled: () => setDeletingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      notifications.show({ color: "green", title: "Planilha removida", message: "" });
    },
    onError: () =>
      notifications.show({
        color: "red",
        title: "Erro",
        message: "Não foi possível remover.",
      }),
  });

  const plans: TrainingPlanSummary[] = plansQuery.data ?? [];

  return (
    <Container size="lg" py="xl">
      <Group justify="space-between" mb="md">
        <Title order={2}>Planilhas de treino</Title>
        <Group>
          <Button component={Link} to="/admin/users" variant="default">
            Usuários
          </Button>
          <Button onClick={modal.open}>Nova planilha</Button>
        </Group>
      </Group>

      {plansQuery.isLoading && <Text>Carregando...</Text>}

      {!plansQuery.isLoading && plans.length === 0 && (
        <Text c="dimmed">Nenhuma planilha cadastrada. Clique em "Nova planilha".</Text>
      )}

      {plans.length > 0 && (
        <Table striped withTableBorder highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Distância</Table.Th>
              <Table.Th>Pace</Table.Th>
              <Table.Th>Nível</Table.Th>
              <Table.Th>Título</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Ações</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {plans.map((p) => (
              <Table.Tr key={p.id}>
                <Table.Td>{p.distance_km} km</Table.Td>
                <Table.Td>{formatPace(p.target_pace_seconds)}/km</Table.Td>
                <Table.Td>Fase {p.level}</Table.Td>
                <Table.Td>{p.title}</Table.Td>
                <Table.Td>
                  <Badge
                    color={p.published ? "green" : "gray"}
                    variant={p.published ? "filled" : "light"}
                  >
                    {p.published ? "Publicada" : "Rascunho"}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <Button
                      size="xs"
                      variant="light"
                      onClick={() => navigate(`/admin/plans/${p.id}`)}
                    >
                      Abrir
                    </Button>
                    <ActionIcon
                      color="red"
                      variant="light"
                      size="sm"
                      loading={deletingId === p.id}
                      onClick={() => {
                        if (confirm(`Remover "${p.title}"?`)) {
                          deleteMutation.mutate(p.id);
                        }
                      }}
                      aria-label="Remover planilha"
                    >
                      ×
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <CreatePlanModal
        opened={modalOpened}
        onClose={modal.close}
        onCreated={(id) => {
          modal.close();
          queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
          navigate(`/admin/plans/${id}`);
        }}
      />
    </Container>
  );
}
