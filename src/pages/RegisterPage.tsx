import {
  Anchor,
  Button,
  Card,
  Container,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";

interface RegisterFormValues {
  name: string;
  email: string;
  password: string;
  confirm: string;
}

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<RegisterFormValues>({
    initialValues: { name: "", email: "", password: "", confirm: "" },
    validate: {
      name: (v) => (v.trim().length > 0 ? null : "Informe seu nome"),
      email: (v) => (/.+@.+\..+/.test(v) ? null : "E-mail inválido"),
      password: (v) => (v.length >= 8 ? null : "Mínimo de 8 caracteres"),
      confirm: (v, values) => (v === values.password ? null : "Senhas não conferem"),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);
    try {
      await register({ name: values.name, email: values.email, password: values.password });
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ??
        "Erro ao criar conta.";
      notifications.show({ color: "red", title: "Cadastro falhou", message });
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Container size={420} py="xl">
      <Title order={2} ta="center" mb="md">
        Criar conta
      </Title>
      <Card withBorder radius="md" p="lg">
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <TextInput label="Nome" {...form.getInputProps("name")} required />
            <TextInput label="E-mail" type="email" {...form.getInputProps("email")} required />
            <PasswordInput label="Senha" {...form.getInputProps("password")} required />
            <PasswordInput
              label="Confirme a senha"
              {...form.getInputProps("confirm")}
              required
            />
            <Button type="submit" loading={submitting} fullWidth mt="sm">
              Criar conta
            </Button>
          </Stack>
        </form>

        <Text ta="center" mt="md" size="sm" c="dimmed">
          Após o cadastro, um administrador deve te adicionar a um grupo de cliente para liberar
          o acesso completo ao sistema.
        </Text>

        <Text ta="center" mt="md" size="sm">
          Já tem conta?{" "}
          <Anchor component={Link} to="/login">
            Entrar
          </Anchor>
        </Text>
      </Card>
    </Container>
  );
}
