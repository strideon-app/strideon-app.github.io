import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  Loader,
  Modal,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  STEP_TYPE_COLORS,
  STEP_TYPE_LABELS,
  createBlock,
  defaultExecutableStep,
  defaultRepeatStep,
  defaultWorkoutSteps,
  deleteBlock,
  getPlan,
  updateBlock,
  updatePlan,
  type ExecutableStep,
  type RepeatStep,
  type WorkoutBlock,
  type WorkoutBlockPayload,
  type WorkoutStep,
} from "@/api/trainingPlans";
import { StepEditor } from "@/components/StepEditor";
import { formatPace } from "@/utils/pace";
import { blockSummary, executableStepShortSummary } from "@/utils/stepSummary";

const DAYS: { value: number; short: string; long: string }[] = [
  { value: 1, short: "Seg", long: "Segunda" },
  { value: 2, short: "Ter", long: "Terça" },
  { value: 3, short: "Qua", long: "Quarta" },
  { value: 4, short: "Qui", long: "Quinta" },
  { value: 5, short: "Sex", long: "Sexta" },
  { value: 6, short: "Sáb", long: "Sábado" },
  { value: 7, short: "Dom", long: "Domingo" },
];

interface BlockModalState {
  open: boolean;
  weekNumber: number;
  dayOfWeek: number;
  block: WorkoutBlock | null;
}

interface BlockDraft {
  title: string;
  description: string;
  steps: WorkoutStep[];
}

function emptyDraft(): BlockDraft {
  return {
    title: "",
    description: "",
    steps: defaultWorkoutSteps(),
  };
}

function StepRow({
  step,
  onClick,
  onRemove,
}: {
  step: ExecutableStep;
  onClick: () => void;
  onRemove?: () => void;
}) {
  return (
    <Paper
      withBorder
      p="xs"
      radius="sm"
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      <Group justify="space-between" wrap="nowrap" gap="xs">
        <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          <Badge color={STEP_TYPE_COLORS[step.step_type]} variant="light">
            {STEP_TYPE_LABELS[step.step_type]}
          </Badge>
          <Text size="sm" lineClamp={1}>
            {executableStepShortSummary(step)}
          </Text>
        </Group>
        {onRemove && (
          <ActionIcon
            color="red"
            variant="subtle"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label="Remover etapa"
          >
            ×
          </ActionIcon>
        )}
      </Group>
    </Paper>
  );
}

function RepeatRow({
  step,
  onChangeCount,
  onAddChild,
  onChildClick,
  onChildRemove,
  onRemove,
}: {
  step: RepeatStep;
  onChangeCount: (count: number) => void;
  onAddChild: () => void;
  onChildClick: (childIndex: number) => void;
  onChildRemove: (childIndex: number) => void;
  onRemove: () => void;
}) {
  return (
    <Paper withBorder p="xs" radius="sm" bg="gray.0">
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="xs" align="flex-end">
            <NumberInput
              label="Repetir"
              min={1}
              max={99}
              value={step.repeat_count}
              onChange={(v) => onChangeCount(typeof v === "number" ? v : 1)}
              w={100}
              size="xs"
            />
            <Text size="sm">vezes</Text>
          </Group>
          <ActionIcon color="red" variant="subtle" size="sm" onClick={onRemove}>
            ×
          </ActionIcon>
        </Group>
        <Stack gap={6}>
          {step.children.map((child, idx) => (
            <StepRow
              key={idx}
              step={child}
              onClick={() => onChildClick(idx)}
              onRemove={() => onChildRemove(idx)}
            />
          ))}
        </Stack>
        <Button size="xs" variant="subtle" onClick={onAddChild}>
          + adicionar etapa
        </Button>
      </Stack>
    </Paper>
  );
}

interface StepEditorTarget {
  topIndex: number;
  childIndex: number | null;
}

function BlockModal({
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
  const [draft, setDraft] = useState<BlockDraft>(emptyDraft());
  const [editing, setEditing] = useState<StepEditorTarget | null>(null);

  useEffect(() => {
    if (!state.open) return;
    const block = state.block;
    if (block) {
      setDraft({
        title: block.title,
        description: block.description ?? "",
        steps: structuredClone(block.steps),
      });
    } else {
      setDraft(emptyDraft());
    }
    setEditing(null);
  }, [state.open, state.block]);

  const dayLabel = DAYS.find((d) => d.value === state.dayOfWeek)?.long ?? "";
  const title = state.block
    ? `Editar treino — Semana ${state.weekNumber}, ${dayLabel}`
    : `Novo treino — Semana ${state.weekNumber}, ${dayLabel}`;

  const editingStep: ExecutableStep | null = useMemo(() => {
    if (!editing) return null;
    const top = draft.steps[editing.topIndex];
    if (!top) return null;
    if (top.kind === "EXECUTABLE") return top;
    if (editing.childIndex == null) return null;
    return top.children[editing.childIndex] ?? null;
  }, [editing, draft.steps]);

  const updateStep = (next: ExecutableStep) => {
    if (!editing) return;
    setDraft((d) => {
      const steps = [...d.steps];
      const top = steps[editing.topIndex];
      if (!top) return d;
      if (top.kind === "EXECUTABLE") {
        steps[editing.topIndex] = next;
      } else if (editing.childIndex != null) {
        const repeat: RepeatStep = {
          ...top,
          children: top.children.map((c, i) => (i === editing.childIndex ? next : c)),
        };
        steps[editing.topIndex] = repeat;
      }
      return { ...d, steps };
    });
  };

  const addStep = () => {
    setDraft((d) => {
      const steps = [...d.steps];
      const lastIndex = steps.length - 1;
      const last = steps[lastIndex];
      const newStep = defaultExecutableStep("RUN");
      if (last && last.kind === "EXECUTABLE" && last.step_type === "COOLDOWN") {
        steps.splice(lastIndex, 0, newStep);
      } else {
        steps.push(newStep);
      }
      return { ...d, steps };
    });
  };

  const addRepeat = () => {
    setDraft((d) => {
      const steps = [...d.steps];
      const lastIndex = steps.length - 1;
      const last = steps[lastIndex];
      const newRepeat = defaultRepeatStep();
      if (last && last.kind === "EXECUTABLE" && last.step_type === "COOLDOWN") {
        steps.splice(lastIndex, 0, newRepeat);
      } else {
        steps.push(newRepeat);
      }
      return { ...d, steps };
    });
  };

  const removeTop = (index: number) =>
    setDraft((d) => ({ ...d, steps: d.steps.filter((_, i) => i !== index) }));

  const handleSubmit = () => {
    if (!draft.title.trim()) {
      notifications.show({ color: "red", title: "Erro", message: "Informe um título." });
      return;
    }
    onSubmit({
      day_of_week: state.dayOfWeek,
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      steps: draft.steps,
    });
  };

  return (
    <Modal opened={state.open} onClose={onClose} title={title} size="lg">
      <Stack gap="md">
        <TextInput
          label="Título do treino"
          placeholder="Ex.: Intervalado 4×1km"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.currentTarget.value })}
          required
        />

        <Stack gap="xs">
          <Title order={5}>Visão geral</Title>
          <Textarea
            label="Adicionar notas"
            placeholder="Descrição geral do treino"
            autosize
            minRows={2}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.currentTarget.value })}
          />
        </Stack>

        <Divider />

        <Stack gap="xs">
          <Title order={5}>Passos</Title>
          <Stack gap="xs">
            {draft.steps.map((step, idx) => {
              if (step.kind === "EXECUTABLE") {
                return (
                  <StepRow
                    key={idx}
                    step={step}
                    onClick={() => setEditing({ topIndex: idx, childIndex: null })}
                    onRemove={() => removeTop(idx)}
                  />
                );
              }
              return (
                <RepeatRow
                  key={idx}
                  step={step}
                  onChangeCount={(count) =>
                    setDraft((d) => {
                      const steps = [...d.steps];
                      steps[idx] = { ...step, repeat_count: count };
                      return { ...d, steps };
                    })
                  }
                  onAddChild={() =>
                    setDraft((d) => {
                      const steps = [...d.steps];
                      steps[idx] = {
                        ...step,
                        children: [...step.children, defaultExecutableStep("RUN")],
                      };
                      return { ...d, steps };
                    })
                  }
                  onChildClick={(childIndex) =>
                    setEditing({ topIndex: idx, childIndex })
                  }
                  onChildRemove={(childIndex) =>
                    setDraft((d) => {
                      const steps = [...d.steps];
                      steps[idx] = {
                        ...step,
                        children: step.children.filter((_, i) => i !== childIndex),
                      };
                      return { ...d, steps };
                    })
                  }
                  onRemove={() => removeTop(idx)}
                />
              );
            })}
          </Stack>
          <Group>
            <Button variant="default" onClick={addStep}>
              + adicionar etapa
            </Button>
            <Button variant="default" onClick={addRepeat}>
              + adicionar repetição
            </Button>
          </Group>
        </Stack>

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            {state.block ? "Salvar" : "Adicionar"}
          </Button>
        </Group>
      </Stack>

      {editingStep && (
        <StepEditor
          opened={editing != null}
          step={editingStep}
          onClose={() => setEditing(null)}
          onSave={updateStep}
        />
      )}
    </Modal>
  );
}

function BlockCard({
  block,
  onEdit,
  onDelete,
}: {
  block: WorkoutBlock;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const summary = blockSummary(block.steps);

  return (
    <Card p="xs" radius="sm" withBorder shadow="none">
      <Stack gap={4}>
        <Group justify="space-between" wrap="nowrap" gap={4} align="flex-start">
          <Text size="xs" fw={600} lineClamp={2} style={{ flex: 1 }}>
            {block.title}
          </Text>
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
        {summary && (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {summary}
          </Text>
        )}
      </Stack>
    </Card>
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

      <BlockModal
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
