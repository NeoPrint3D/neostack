type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface Auth {
  user: import("better-auth").User;
  session: import("better-auth").Session;
}
declare namespace App {
  interface Locals extends Runtime {
    auth: Auth | null;
  }
}
