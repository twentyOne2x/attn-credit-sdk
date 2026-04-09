import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const REPO_ROOT = "/Users/user/PycharmProjects/attn-credit-sdk";
const TEMPLATE_DIR = path.join(REPO_ROOT, "templates", "partner-managed-starter");

async function runPnpm(args: string[]) {
  return execFileAsync("pnpm", args, {
    cwd: REPO_ROOT,
    env: {
      ...process.env,
      PATH: process.env.PATH,
    },
  });
}

test("starter template publishes only working scripts and sample harness commands", async () => {
  await runPnpm(["--dir", TEMPLATE_DIR, "typecheck"]);
  await runPnpm(["--dir", TEMPLATE_DIR, "build"]);
  await runPnpm(["--dir", TEMPLATE_DIR, "test"]);

  const doctorRun = await runPnpm(["--dir", TEMPLATE_DIR, "--silent", "run", "partner:doctor:sample"]);
  const doctor = JSON.parse(doctorRun.stdout.trim()) as {
    command: string;
    pack_from_files_ready: boolean;
    first_retained_run_ready: boolean;
    recommended_commands: string[];
  };

  assert.equal(doctor.command, "partner-managed-doctor");
  assert.equal(doctor.pack_from_files_ready, true);
  assert.equal(doctor.first_retained_run_ready, true);
  assert.equal(
    doctor.recommended_commands.some((command) => command.includes("partner-managed-pack-from-files")),
    true,
  );

  const packRun = await runPnpm(["--dir", TEMPLATE_DIR, "--silent", "run", "partner:pack:sample"]);
  const pack = JSON.parse(packRun.stdout.trim()) as {
    command: string;
    ok: boolean;
    stage: string;
    claim_level: string;
  };

  assert.equal(pack.command, "partner-managed-pack-from-files");
  assert.equal(pack.ok, true);
  assert.equal(pack.stage, "stage_2_observable_payout_path_mvp");
  assert.equal(pack.claim_level, "underwriting_compatible");
});
