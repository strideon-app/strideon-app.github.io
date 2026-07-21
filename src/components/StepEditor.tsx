import {
  Button,
  Group,
  Modal,
  NumberInput,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";

import {
  DURATION_TYPE_LABELS,
  STEP_TYPE_LABELS,
  TARGET_TYPE_LABELS,
  type ExecutableStep,
  type WorkoutDurationType,
  type WorkoutStepType,
  type WorkoutTargetType,
} from "@/api/trainingPlans";
import { formatPace, parsePace } from "@/utils/pace";

const STEP_TYPES: WorkoutStepType[] = [
  "WARMUP",
  "RUN",
  "WALK",
  "RECOVERY",
  "REST",
  "COOLDOWN",
  "OTHER",
];

const DURATION_TYPES: WorkoutDurationType[] = [
  "TIME",
  "DISTANCE",
  "LAP_BUTTON",
  "CALORIES",
  "HEART_RATE",
];

const TARGET_TYPES: WorkoutTargetType[] = [
  "NO_TARGET",
  "PACE",
  "CADENCE",
  "HEART_RATE_ZONE",
  "HEART_RATE_CUSTOM",
  "POWER_ZONE",
  "POWER_CUSTOM",
];

interface StepEditorProps {
  opened: boolean;
  step: ExecutableStep;
  onClose: () => void;
  onSave: (next: ExecutableStep) => void;
}

function DurationFields({
  step,
  setStep,
}: {
  step: ExecutableStep;
  setStep: (s: ExecutableStep) => void;
}) {
  const dt = step.duration_type;
  if (dt === "LAP_BUTTON") {
    return (
      <Text size="sm" c="dimmed">
        O treino avança quando o usuário pressionar o botão Lap no relógio.
      </Text>
    );
  }
  if (dt === "TIME") {
    return (
      <NumberInput
        label="Duração (segundos)"
        min={1}
        value={step.duration_value ?? ""}
        onChange={(v) =>
          setStep({ ...step, duration_value: typeof v === "number" ? v : null })
        }
      />
    );
  }
  if (dt === "DISTANCE") {
    return (
      <NumberInput
        label="Distância (metros)"
        min={1}
        value={step.duration_value ?? ""}
        onChange={(v) =>
          setStep({ ...step, duration_value: typeof v === "number" ? v : null })
        }
      />
    );
  }
  if (dt === "CALORIES") {
    return (
      <NumberInput
        label="Calorias (kcal)"
        min={1}
        value={step.duration_value ?? ""}
        onChange={(v) =>
          setStep({ ...step, duration_value: typeof v === "number" ? v : null })
        }
      />
    );
  }
  if (dt === "HEART_RATE") {
    return (
      <NumberInput
        label="Frequência cardíaca (bpm)"
        min={1}
        value={step.duration_value ?? ""}
        onChange={(v) =>
          setStep({ ...step, duration_value: typeof v === "number" ? v : null })
        }
      />
    );
  }
  return null;
}

function PaceRangeFields({
  step,
  setStep,
}: {
  step: ExecutableStep;
  setStep: (s: ExecutableStep) => void;
}) {
  const [lo, setLo] = useState(formatPace(step.target_value_one));
  const [hi, setHi] = useState(formatPace(step.target_value_two));

  useEffect(() => {
    setLo(formatPace(step.target_value_one));
    setHi(formatPace(step.target_value_two));
  }, [step.target_value_one, step.target_value_two]);

  return (
    <Group grow>
      <TextInput
        label="Pace mínimo (M:SS)"
        placeholder="4:00"
        value={lo}
        onChange={(e) => {
          const value = e.currentTarget.value;
          setLo(value);
          const parsed = parsePace(value);
          if (parsed != null || value === "") {
            setStep({ ...step, target_value_one: parsed });
          }
        }}
      />
      <TextInput
        label="Pace máximo (M:SS)"
        placeholder="4:30"
        value={hi}
        onChange={(e) => {
          const value = e.currentTarget.value;
          setHi(value);
          const parsed = parsePace(value);
          if (parsed != null || value === "") {
            setStep({ ...step, target_value_two: parsed });
          }
        }}
      />
    </Group>
  );
}

function TargetFields({
  step,
  setStep,
}: {
  step: ExecutableStep;
  setStep: (s: ExecutableStep) => void;
}) {
  const tt = step.target_type;
  if (tt === "NO_TARGET") return null;
  if (tt === "PACE") {
    return <PaceRangeFields step={step} setStep={setStep} />;
  }
  if (tt === "CADENCE") {
    return (
      <Group grow>
        <NumberInput
          label="Cadência mínima (spm)"
          min={1}
          value={step.target_value_one ?? ""}
          onChange={(v) =>
            setStep({ ...step, target_value_one: typeof v === "number" ? v : null })
          }
        />
        <NumberInput
          label="Cadência máxima (spm)"
          min={1}
          value={step.target_value_two ?? ""}
          onChange={(v) =>
            setStep({ ...step, target_value_two: typeof v === "number" ? v : null })
          }
        />
      </Group>
    );
  }
  if (tt === "HEART_RATE_ZONE" || tt === "POWER_ZONE") {
    return (
      <NumberInput
        label="Zona (1 a 5)"
        min={1}
        max={5}
        value={step.target_value_one ?? ""}
        onChange={(v) =>
          setStep({
            ...step,
            target_value_one: typeof v === "number" ? v : null,
            target_value_two: null,
          })
        }
      />
    );
  }
  if (tt === "HEART_RATE_CUSTOM") {
    return (
      <Group grow>
        <NumberInput
          label="FC mínima (bpm)"
          min={1}
          value={step.target_value_one ?? ""}
          onChange={(v) =>
            setStep({ ...step, target_value_one: typeof v === "number" ? v : null })
          }
        />
        <NumberInput
          label="FC máxima (bpm)"
          min={1}
          value={step.target_value_two ?? ""}
          onChange={(v) =>
            setStep({ ...step, target_value_two: typeof v === "number" ? v : null })
          }
        />
      </Group>
    );
  }
  if (tt === "POWER_CUSTOM") {
    return (
      <Group grow>
        <NumberInput
          label="Potência mínima (W)"
          min={1}
          value={step.target_value_one ?? ""}
          onChange={(v) =>
            setStep({ ...step, target_value_one: typeof v === "number" ? v : null })
          }
        />
        <NumberInput
          label="Potência máxima (W)"
          min={1}
          value={step.target_value_two ?? ""}
          onChange={(v) =>
            setStep({ ...step, target_value_two: typeof v === "number" ? v : null })
          }
        />
      </Group>
    );
  }
  return null;
}

export function StepEditor({ opened, step, onClose, onSave }: StepEditorProps) {
  const [draft, setDraft] = useState<ExecutableStep>(step);

  useEffect(() => {
    if (opened) setDraft(step);
  }, [opened, step]);

  const handleStepTypeChange = (value: string | null) => {
    if (!value) return;
    setDraft({ ...draft, step_type: value as WorkoutStepType });
  };

  const handleDurationTypeChange = (value: string | null) => {
    if (!value) return;
    const next: ExecutableStep = {
      ...draft,
      duration_type: value as WorkoutDurationType,
    };
    if (next.duration_type === "LAP_BUTTON") {
      next.duration_value = null;
    }
    setDraft(next);
  };

  const handleTargetTypeChange = (value: string | null) => {
    if (!value) return;
    setDraft({
      ...draft,
      target_type: value as WorkoutTargetType,
      target_value_one: null,
      target_value_two: null,
    });
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Editar etapa" size="md">
      <Stack gap="lg">
        <Stack gap="xs">
          <Title order={5}>Informações sobre a etapa</Title>
          <Select
            label="Tipo de etapa"
            data={STEP_TYPES.map((t) => ({ value: t, label: STEP_TYPE_LABELS[t] }))}
            value={draft.step_type}
            onChange={handleStepTypeChange}
            allowDeselect={false}
          />
          <Textarea
            label="Adicionar notas"
            placeholder="opcional"
            autosize
            minRows={2}
            value={draft.notes ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, notes: e.currentTarget.value || null })
            }
          />
        </Stack>

        <Stack gap="xs">
          <Title order={5}>Duração</Title>
          <Select
            label="Tipo de duração"
            data={DURATION_TYPES.map((t) => ({ value: t, label: DURATION_TYPE_LABELS[t] }))}
            value={draft.duration_type}
            onChange={handleDurationTypeChange}
            allowDeselect={false}
          />
          <DurationFields step={draft} setStep={setDraft} />
        </Stack>

        <Stack gap="xs">
          <Title order={5}>Meta de intensidade</Title>
          <Select
            label="Tipo de meta"
            data={TARGET_TYPES.map((t) => ({ value: t, label: TARGET_TYPE_LABELS[t] }))}
            value={draft.target_type}
            onChange={handleTargetTypeChange}
            allowDeselect={false}
          />
          <TargetFields step={draft} setStep={setDraft} />
        </Stack>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Salvar
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
