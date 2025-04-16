export function deriveUserData(initialAuth: Auth | null) {
  if (!initialAuth?.user) return null;

  const name =
    initialAuth.user.name || initialAuth.user.email?.split("@")[0] || "User";

  return {
    name,
    email: initialAuth.user.email || "no-email@example.com",
    avatar: initialAuth.user.image,
    initials: name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
  };
}
