import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Modal,
  NumberInput,
  Select,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  WORKOUT_TYPE_COLORS,
  WORKOUT_TYPE_LABELS,
  createBlock,
  deleteBlock,
  getPlan,
  updateBlock,
  updatePlan,
  type WorkoutBlock,
  type WorkoutBlockPayload,
  type WorkoutType,
} from "@/api/trainingPlans";
import { formatPace, parsePace } from "@/utils/pace";

const DAYS: { value: number; short: string; long: string }[] = [
  { value: 1, short: "Seg", long: "Segunda" },
  { value: 2, short: "Ter", long: "Terça" },
  { value: 3, short: "Qua", long: "Quarta" },
  { value: 4, short: "Qui", long: "Quinta" },
  { value: 5, short: "Sex", long: "Sexta" },
  { value: 6, short: "Sáb", long: "Sábado" },
  { value: 7, short: "Dom", long: "Domingo" },
];

const WORKOUT_TYPES: WorkoutType[] = [
  "LONG_RUN",
  "INTERVAL",
  "EASY_RUN",
  "RECOVERY",
  "REST",
  "STRENGTH",
  "FREE",
];

interface BlockFormValues {
  type: WorkoutType;
  title: string;
  description: string;
  distance_km: number | "";
  duration_minutes: number | "";
  pace_text: string;
  notes: string;
}

interface BlockModalState {
  open: boolean;
  weekNumber: number;
  dayOfWeek: number;
  block: WorkoutBlock | null;
}

const emptyForm: BlockFormValues = {
  type: "EASY_RUN",
  title: "",
  description: "",
  distance_km: "",
  duration_minutes: "",
  pace_text: "",
  notes: "",
};

function BlockCard({
  block,
  onEdit,
  onDelete,
}: {
  block: WorkoutBlock;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const details: string[] = [];
  if (block.distance_km != null) details.push(`${block.distance_km} km`);
  if (block.duration_minutes != null) details.push(`${block.duration_minutes} min`);
  if (block.target_pace_seconds != null) details.push(`${formatPace(block.target_pace_seconds)}/km`);

  return (
    <Card p="xs" radius="sm" withBorder shadow="none" style={{ cursor: "pointer" }}>
      <Stack gap={4}>
        <Group justify="space-between" wrap="nowrap" gap={4}>
          <Badge size="xs" color={WORKOUT_TYPE_COLORS[block.type]} variant="light">
            {WORKOUT_TYPE_LABELS[block.type]}
          </Badge>
          <Group gap={2} wrap="nowrap">
            <ActionIcon size="xs" variant="subtle" onClick={onEdit} aria-label="Editar">
              ✎
            </ActionIcon>
            <ActionIcon
              size="xs"
              color="red"
              variant="subtle"
              onClick={onDelete}
              aria-label="Remover"
            >
              ×
            </ActionIcon>
          </Group>
        </Group>
        <Text size="xs" fw={600} lineClamp={2}>
          {block.title}
        </Text>
        {details.length > 0 && (
          <Text size="xs" c="dimmed">
            {details.join(" · ")}
          </Text>
        )}
      </Stack>
    </Card>
  );
}

function BlockFormModal({
  state,
  onClose,
  onSubmit,
  submitting,
}: {
  state: BlockModalState;
  onClose: () => void;
  onSubmit: (values: WorkoutBlockPayload) => void;
  submitting: boolean;
}) {
  const form = useForm<BlockFormValues>({
    initialValues: emptyForm,
    validate: {
      title: (v) => (v.trim().length > 0 ? null : "Informe um título"),
      pace_text: (v) => (v === "" || parsePace(v) != null ? null : "Pace inválido (M:SS)"),
    },
  });

  // Reset form whenever the modal opens for a new/different block.
  const [lastOpenedKey, setLastOpenedKey] = useState<string>("");
  const currentKey = state.open
    ? `${state.weekNumber}-${state.dayOfWeek}-${state.block?.id ?? "new"}`
    : "";

  if (state.open && currentKey !== lastOpenedKey) {
    const block = state.block;
    form.setValues(
      block
        ? {
            type: block.type,
            title: block.title,
            description: block.description ?? "",
            distance_km: block.distance_km ?? "",
            duration_minutes: block.duration_minutes ?? "",
            pace_text: block.target_pace_seconds != null ? formatPace(block.target_pace_seconds) : "",
            notes: block.notes ?? "",
          }
        : emptyForm,
    );
    setLastOpenedKey(currentKey);
  }

  const handleSubmit = form.onSubmit((values) => {
    const paceSeconds = values.pace_text ? parsePace(values.pace_text) : null;
    onSubmit({
      day_of_week: state.dayOfWeek,
      type: values.type,
      title: values.title.trim(),
      description: values.description.trim() || null,
      distance_km: values.distance_km === "" ? null : (values.distance_km as number),
      duration_minutes:
        values.duration_minutes === "" ? null : (values.duration_minutes as number),
      target_pace_seconds: paceSeconds,
      notes: values.notes.trim() || null,
    });
  });

  const dayLabel = DAYS.find((d) => d.value === state.dayOfWeek)?.long ?? "";
  const title = state.block
    ? `Editar treino — Semana ${state.weekNumber}, ${dayLabel}`
    : `Novo treino — Semana ${state.weekNumber}, ${dayLabel}`;

  return (
    <Modal opened={state.open} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="sm">
          <Select
            label="Tipo de treino"
            data={WORKOUT_TYPES.map((t) => ({ value: t, label: WORKOUT_TYPE_LABELS[t] }))}
            {...form.getInputProps("type")}
            required
          />
          <TextInput
            label="Título"
            placeholder="Longão de 14km"
            {...form.getInputProps("title")}
            required
          />
          <Textarea
            label="Descrição"
            placeholder="Detalhes do treino"
            autosize
            minRows={2}
            {...form.getInputProps("description")}
          />
          <Group grow>
            <NumberInput
              label="Distância (km)"
              placeholder="opcional"
              min={0}
              decimalScale={2}
              {...form.getInputProps("distance_km")}
            />
            <NumberInput
              label="Duração (min)"
              placeholder="opcional"
              min={0}
              {...form.getInputProps("duration_minutes")}
            />
            <TextInput
              label="Pace alvo (M:SS)"
              placeholder="opcional — 4:30"
              {...form.getInputProps("pace_text")}
            />
          </Group>
          <Textarea
            label="Observações"
            placeholder="opcional"
            autosize
            minRows={1}
            {...form.getInputProps("notes")}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {state.block ? "Salvar" : "Adicionar"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}

export function AdminPlanEditorPage() {
  const { planId } = useParams<{ planId: string }>();
  const parsedPlanId = Number(planId);
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<BlockModalState>({
    open: false,
    weekNumber: 1,
    dayOfWeek: 1,
    block: null,
  });
  const [publishOpen, publishModal] = useDisclosure(false);

  const planQuery = useQuery({
    queryKey: ["admin", "plan", parsedPlanId],
    queryFn: () => getPlan(parsedPlanId),
    enabled: Number.isFinite(parsedPlanId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "plan", parsedPlanId] });

  const createMutation = useMutation({
    mutationFn: ({
      weekNumber,
      payload,
    }: {
      weekNumber: number;
      payload: WorkoutBlockPayload;
    }) => createBlock(parsedPlanId, weekNumber, payload),
    onSuccess: () => {
      invalidate();
      setModalState((s) => ({ ...s, open: false }));
    },
    onError: () =>
      notifications.show({ color: "red", title: "Erro", message: "Falha ao criar treino." }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ blockId, payload }: { blockId: number; payload: Partial<WorkoutBlockPayload> }) =>
      updateBlock(blockId, payload),
    onSuccess: () => {
      invalidate();
      setModalState((s) => ({ ...s, open: false }));
    },
    onError: () =>
      notifications.show({ color: "red", title: "Erro", message: "Falha ao salvar treino." }),
  });

  const deleteMutation = useMutation({
    mutationFn: (blockId: number) => deleteBlock(blockId),
    onSuccess: invalidate,
    onError: () =>
      notifications.show({
        color: "red",
        title: "Erro",
        message: "Falha ao remover treino.",
      }),
  });

  const publishMutation = useMutation({
    mutationFn: (published: boolean) => updatePlan(parsedPlanId, { published }),
    onSuccess: (plan) => {
      invalidate();
      notifications.show({
        color: "green",
        title: plan.published ? "Planilha publicada" : "Voltou para rascunho",
        message: plan.title,
      });
      publishModal.close();
    },
  });

  const plan = planQuery.data;

  const blocksByCell = useMemo(() => {
    const index: Record<string, WorkoutBlock[]> = {};
    if (!plan) return index;
    for (const week of plan.weeks) {
      for (const block of week.blocks) {
        const key = `${week.week_number}-${block.day_of_week}`;
        (index[key] ??= []).push(block);
      }
    }
    return index;
  }, [plan]);

  if (planQuery.isLoading) {
    return (
      <Container py="xl">
        <Loader />
      </Container>
    );
  }

  if (!plan) {
    return (
      <Container py="xl">
        <Text c="red">Planilha não encontrada.</Text>
        <Button component={Link} to="/admin/plans" mt="md">
          Voltar
        </Button>
      </Container>
    );
  }

  const handleSubmitBlock = (values: WorkoutBlockPayload) => {
    if (modalState.block) {
      updateMutation.mutate({ blockId: modalState.block.id, payload: values });
    } else {
      createMutation.mutate({ weekNumber: modalState.weekNumber, payload: values });
    }
  };

  return (
    <Container size="xl" py="xl">
      <Group justify="space-between" mb="md" wrap="wrap">
        <Stack gap={2}>
          <Group gap="xs">
            <Button component={Link} to="/admin/plans" variant="subtle" size="xs">
              ← Todas planilhas
            </Button>
          </Group>
          <Title order={2}>{plan.title}</Title>
          <Group gap="xs">
            <Badge variant="light">{plan.distance_km} km</Badge>
            <Badge variant="light">{formatPace(plan.target_pace_seconds)}/km</Badge>
            <Badge variant="light">Fase {plan.level}</Badge>
            <Badge color={plan.published ? "green" : "gray"} variant={plan.published ? "filled" : "light"}>
              {plan.published ? "Publicada" : "Rascunho"}
            </Badge>
          </Group>
        </Stack>
        <Switch
          label={plan.published ? "Publicada" : "Publicar"}
          checked={plan.published}
          onChange={(e) => publishMutation.mutate(e.currentTarget.checked)}
          disabled={publishMutation.isPending}
        />
      </Group>

      {plan.description && (
        <Text c="dimmed" mb="md">
          {plan.description}
        </Text>
      )}

      <Box style={{ overflowX: "auto" }}>
        <Table withTableBorder withColumnBorders striped style={{ minWidth: 900 }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 100 }}>Semana</Table.Th>
              {DAYS.map((d) => (
                <Table.Th key={d.value} style={{ textAlign: "center" }}>
                  {d.short}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {plan.weeks.map((week) => (
              <Table.Tr key={week.id}>
                <Table.Td style={{ fontWeight: 600, verticalAlign: "top", paddingTop: 12 }}>
                  Semana {week.week_number}
                </Table.Td>
                {DAYS.map((d) => {
                  const cellBlocks = blocksByCell[`${week.week_number}-${d.value}`] ?? [];
                  return (
                    <Table.Td
                      key={d.value}
                      style={{ verticalAlign: "top", minWidth: 150 }}
                    >
                      <Stack gap={6}>
                        {cellBlocks.map((block) => (
                          <BlockCard
                            key={block.id}
                            block={block}
                            onEdit={() =>
                              setModalState({
                                open: true,
                                weekNumber: week.week_number,
                                dayOfWeek: d.value,
                                block,
                              })
                            }
                            onDelete={() => {
                              if (confirm(`Remover "${block.title}"?`)) {
                                deleteMutation.mutate(block.id);
                              }
                            }}
                          />
                        ))}
                        <Button
                          size="xs"
                          variant="subtle"
                          onClick={() =>
                            setModalState({
                              open: true,
                              weekNumber: week.week_number,
                              dayOfWeek: d.value,
                              block: null,
                            })
                          }
                        >
                          + treino
                        </Button>
                      </Stack>
                    </Table.Td>
                  );
                })}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Box>

      <BlockFormModal
        state={modalState}
        onClose={() => setModalState((s) => ({ ...s, open: false }))}
        onSubmit={handleSubmitBlock}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <Modal opened={publishOpen} onClose={publishModal.close} title="Confirmação" centered>
        <Text>Publicar esta planilha?</Text>
        <Group justify="flex-end" mt="md">
          <Button variant="default" onClick={publishModal.close}>
            Cancelar
          </Button>
          <Button onClick={() => publishMutation.mutate(true)} loading={publishMutation.isPending}>
            Publicar
          </Button>
        </Group>
      </Modal>
    </Container>
  );
}
