import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { createOperator } from "../../api/admin";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const schema = z
  .object({
    email: z.string().email("Некорректный email"),
    password: z.string().min(6, "Минимум 6 символов"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

export function CreateOperatorPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: (data: { email: string; password: string }) =>
      createOperator({ email: data.email, password: data.password }),
    onSuccess: () => {
      navigate("/operators");
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Не удалось создать оператора"
          : "Не удалось создать оператора";
      setError("root", { message: msg });
    },
  });

  async function onSubmit(data: FormData) {
    mutation.mutate({ email: data.email, password: data.password });
  }

  return (
    <div>
      <button
        onClick={() => navigate("/operators")}
        className="mb-4 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        ← К списку операторов
      </button>

      <h1 className="font-display text-2xl font-semibold text-[var(--color-text)] mb-6">
        Создание оператора
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
        {errors.root && (
          <div
            role="alert"
            className="rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400"
          >
            {errors.root.message}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />

        <Input
          label="Пароль"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register("password")}
        />

        <Input
          label="Повторите пароль"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? "Создание…" : "Создать оператора"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate("/operators")}
          >
            Отмена
          </Button>
        </div>
      </form>
    </div>
  );
}
