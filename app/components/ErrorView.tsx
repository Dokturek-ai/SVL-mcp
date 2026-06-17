export function ErrorView({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
      <p className="text-sm font-semibold text-red-700 dark:text-red-400">
        Chyba
      </p>
      <p className="mt-1 text-sm text-red-600 dark:text-red-300">{message}</p>
    </div>
  );
}
