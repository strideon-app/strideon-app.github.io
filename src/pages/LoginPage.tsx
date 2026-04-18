import {
  Anchor,
  Button,
  Card,
  Container,
  Divider,
  PasswordInput,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "@/auth/AuthContext";

interface LoginFormValues {
  email: string;
  password: string;
}

interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { login, loginGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginFormValues>({
    initialValues: { email: "", password: "" },
    validate: {
      email: (v) => (/.+@.+\..+/.test(v) ? null : "E-mail inválido"),
      password: (v) => (v.length >= 1 ? null : "Informe sua senha"),
    },
  });

  const redirectTo = (location.state as LocationState | null)?.from?.pathname ?? "/";

  const handleSubmit = form.onSubmit(async (values) => {
    setSubmitting(true);
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Falha no login",
        message: "E-mail ou senha incorretos.",
      });
    } finally {
      setSubmitting(false);
    }
  });

  const handleGoogle = async (credential: string | undefined) => {
    if (!credential) return;
    setSubmitting(true);
    try {
      await loginGoogle(credential);
      navigate(redirectTo, { replace: true });
    } catch {
      notifications.show({
        color: "red",
        title: "Falha no login com Google",
        message: "Não foi possível autenticar com o Google.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container size={420} py="xl">
      <Title order={2} ta="center" mb="md">
        Entrar no Strideon
      </Title>
      <Card withBorder radius="md" p="lg">
        <form onSubmit={handleSubmit}>
          <Stack gap="sm">
            <TextInput
              label="E-mail"
              placeholder="voce@exemplo.com"
              {...form.getInputProps("email")}
              required
            />
            <PasswordInput
              label="Senha"
              placeholder="Sua senha"
              {...form.getInputProps("password")}
              required
            />
            <Button type="submit" loading={submitting} fullWidth mt="sm">
              Entrar
            </Button>
          </Stack>
        </form>

        <Divider my="md" label="ou" labelPosition="center" />

        <Stack align="center" gap="xs">
          <GoogleLogin
            onSuccess={(res) => handleGoogle(res.credential)}
            onError={() =>
              notifications.show({
                color: "red",
                title: "Erro Google",
                message: "Não foi possível iniciar o login com Google.",
              })
            }
          />
        </Stack>

        <Text ta="center" mt="md" size="sm">
          Ainda não tem conta?{" "}
          <Anchor component={Link} to="/register">
            Cadastre-se
          </Anchor>
        </Text>
      </Card>
    </Container>
  );
}
