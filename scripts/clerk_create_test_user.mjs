import { loadEnvFiles } from "./load_env.mjs";

loadEnvFiles();

function parseArgs(argv) {
  const options = {
    firstName: "Test",
    lastName: "Employee",
    password: "BalanceTest!2026",
    json: false,
  };

  for (const arg of argv) {
    if (arg === "--json") {
      options.json = true;
      continue;
    }

    const eq = arg.indexOf("=");
    if (!arg.startsWith("--") || eq === -1) continue;

    const key = arg.slice(2, eq);
    const value = arg.slice(eq + 1);

    if (key === "email") options.email = value;
    if (key === "password") options.password = value;
    if (key === "first-name") options.firstName = value;
    if (key === "last-name") options.lastName = value;
  }

  return options;
}

function buildDefaultEmail() {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `test.employee.${timestamp}+clerk_test@example.com`;
}

function ensureTestModeEmail(email) {
  if (email.includes("+clerk_test@")) {
    return email;
  }

  const at = email.indexOf("@");
  if (at === -1) {
    throw new Error("Email must contain '@'.");
  }

  return `${email.slice(0, at)}+clerk_test${email.slice(at)}`;
}

async function createUser({ firstName, lastName, email, password }) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing CLERK_SECRET_KEY in environment.");
  }

  const response = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      email_address: [email],
      password,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Clerk user creation failed: ${response.status} ${text}`);
  }

  return await response.json();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const email = ensureTestModeEmail(args.email ?? buildDefaultEmail());
  const created = await createUser({
    firstName: args.firstName,
    lastName: args.lastName,
    email,
    password: args.password,
  });

  const result = {
    id: created.id,
    email,
    password: args.password,
    verificationCode: "424242",
    note: "Clerk development test-mode email. Use 424242 when prompted for verification.",
  };

  if (args.json) {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }

  process.stdout.write(`Created Clerk test user\n`);
  process.stdout.write(`Email: ${result.email}\n`);
  process.stdout.write(`Password: ${result.password}\n`);
  process.stdout.write(`Verification code: ${result.verificationCode}\n`);
  process.stdout.write(`User ID: ${result.id}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
