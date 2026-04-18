import {
  Badge,
  Button,
  Card,
  Container,
  Group,
  Loader,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

import { fetchHealth } from "@/api/health";
import { useAuth } from "@/auth/AuthContext";

export function HomePage() {
  const { user, logout, hasGroup } = useAuth();
  const navigate = useNavigate();

  const healthQuery = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    refetchInterval: 10000,
  });

  return (
    <Container size="sm" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>Strideon</Title>
            <Text c="dimmed">Aplicação web para corredores</Text>
          </div>
          {user && (
            <Button
              variant="light"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Sair
            </Button>
          )}
        </Group>

        <Card withBorder radius="md" p="lg">
          <Stack gap="sm">
            <Title order={3}>Status do sistema</Title>

            {healthQuery.isLoading && (
              <Group gap="xs">
                <Loader size="sm" />
                <Text>Conectando ao backend...</Text>
              </Group>
            )}

            {healthQuery.isError && (
              <Badge color="red" size="lg" variant="light">
                Backend inacessível
              </Badge>
            )}

            {healthQuery.data && (
              <Stack gap="xs">
                <Group gap="xs">
                  <Text fw={500}>API:</Text>
                  <Badge
                    color={healthQuery.data.status === "ok" ? "green" : "red"}
                    variant="light"
                  >
                    {healthQuery.data.status}
                  </Badge>
                </Group>
                <Group gap="xs">
                  <Text fw={500}>Banco de dados:</Text>
                  <Badge
                    color={healthQuery.data.database === "ok" ? "green" : "red"}
                    variant="light"
                  >
                    {healthQuery.data.database}
                  </Badge>
                </Group>
              </Stack>
            )}
          </Stack>
        </Card>

        {user ? (
          <Card withBorder radius="md" p="lg">
            <Stack gap="sm">
              <Title order={3}>Seu perfil</Title>
              <Text>
                <b>{user.name}</b> — {user.email}
              </Text>
              <Group gap="xs">
                <Text fw={500}>Grupos:</Text>
                {user.groups.length === 0 ? (
                  <Text size="sm" c="dimmed">
                    Nenhum. Aguarde um administrador liberar seu acesso.
                  </Text>
                ) : (
                  user.groups.map((g) => (
                    <Badge key={g.id} variant="light">
                      {g.name}
                    </Badge>
                  ))
                )}
              </Group>
              {hasGroup("Admin") && (
                <Button component={Link} to="/admin/users" variant="light" mt="xs">
                  Administração
                </Button>
              )}
            </Stack>
          </Card>
        ) : (
          <Card withBorder radius="md" p="lg">
            <Stack gap="sm" align="flex-start">
              <Text>Você não está autenticado.</Text>
              <Group>
                <Button component={Link} to="/login">
                  Entrar
                </Button>
                <Button component={Link} to="/register" variant="light">
                  Cadastrar
                </Button>
              </Group>
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
