export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 w-full h-full overflow-y-auto flex items-center justify-center p-4">
      {children}
    </div>
  );
}
