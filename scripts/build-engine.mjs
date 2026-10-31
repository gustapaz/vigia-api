import { spawnSync } from "node:child_process";
import path from "node:path";
const dotnet = process.env.DOTNET_BIN ?? "dotnet";
const env = {
  ...process.env,
  DOTNET_CLI_TELEMETRY_OPTOUT: "1",
  DOTNET_NOLOGO: "1",
  ...(path.isAbsolute(dotnet)
    ? {
        DOTNET_ROOT: path.dirname(dotnet),
        PATH: path.dirname(dotnet) + path.delimiter + process.env.PATH,
      }
    : {}),
};
function run(args) {
  const r = spawnSync(dotnet, args, { env, stdio: "inherit" });
  if (r.error) throw r.error;
  if (r.status !== 0) process.exit(r.status ?? 1);
}
run(["tool", "restore"]);
run([
  "run",
  "--project",
  "native-tests/Tests.fsproj",
  "--configuration",
  "Release",
]);
run(["fable", "engine/Vigia.fsproj", "--outDir", "engine/pkg", "--noCache"]);
console.log("F# native checks passed; Fable ES modules generated.");
