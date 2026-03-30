export type Role = "admin" | "sales" | "production" | "operator" | "logistics";

export function can(role: Role, permission: string): boolean {
  const perms: Record<Role, Set<string>> = {
    admin: new Set(["*"]),
    sales: new Set(["crm:read","crm:write","quotes:*","orders:*","production:read","attachments:*","payments:write"]),
    production: new Set(["production:*","inventory:consume","printers:*","orders:read","attachments:*"]),
    operator: new Set(["production:read","production:update-status","production:add-incident","attachments:read"]),
    logistics: new Set(["deliveries:*","orders:read","attachments:*"])
  };

  const set = perms[role];
  return set.has("*") || set.has(permission) || (permission.endsWith(":*") ? false : set.has(permission.split(":")[0] + ":*"));
}