/** Auth route-group layout: no nav/sidebar chrome, centered content on cream background. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-cream flex items-center justify-center">
      {children}
    </main>
  );
}
