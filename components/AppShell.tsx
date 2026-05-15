import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <div className="max-w-md mx-auto pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}
