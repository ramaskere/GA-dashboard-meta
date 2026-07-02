"use client";

import Link from "next/link";
import Image from "next/image";
import type { ClientConfig } from "@/lib/clients";
import { ClientSwitcher } from "./ClientSwitcher";

interface AppHeaderProps {
  client: ClientConfig;
  active: "dashboard" | "campaigns" | "settings";
  campaignsEnabled?: boolean;
  availableClients?: Pick<ClientConfig, "id" | "name">[];
  isAdmin?: boolean;
  children?: React.ReactNode;
}

const NAV = [
  { href: "/", id: "dashboard" as const, label: "Reportes" },
  { href: "/campaigns", id: "campaigns" as const, label: "Campañas" },
  { href: "/settings", id: "settings" as const, label: "Config" },
];

export function AppHeader({
  client,
  active,
  campaignsEnabled = true,
  availableClients = [],
  isAdmin = false,
  children,
}: AppHeaderProps) {
  const navItems = NAV.filter(
    (item) => item.id !== "campaigns" || campaignsEnabled
  );

  return (
    <header className="border-b border-gray-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Image
            src={client.logo}
            alt={client.name}
            width={40}
            height={40}
            className="rounded-xl"
          />
          <div>
            <h1 className="text-lg font-semibold">{client.name}</h1>
            <p className="text-xs text-gray-500">{client.tagline}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ClientSwitcher
            clients={availableClients}
            currentId={client.id}
            isAdmin={isAdmin}
          />
          <nav className="flex rounded-xl border border-gray-200 bg-white p-1">
            {navItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 text-sm transition ${
                  active === item.id
                    ? "bg-[var(--client-primary)] text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          {children}
        </div>
      </div>
    </header>
  );
}
