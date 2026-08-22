import { execFileSync } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const directory = await mkdtemp(join(tmpdir(), "frontstead-package-consumer-"));

function run(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] }).trim();
}

try {
  const tarballs = {};
  for (const workspace of ["@frontstead/api-client", "@frontstead/tokens", "@frontstead/ui"]) {
    tarballs[workspace] = run("npm", [
      "pack",
      "--ignore-scripts",
      `--workspace=${workspace}`,
      "--pack-destination",
      directory,
    ]).split("\n").at(-1);
  }

  await writeFile(join(directory, "package.json"), JSON.stringify({
    name: "frontstead-package-consumer-test",
    private: true,
    type: "module",
    scripts: { test: "node index.mjs && tsc --noEmit" },
    dependencies: {
      "@frontstead/api-client": `file:./${tarballs["@frontstead/api-client"]}`,
      "@frontstead/tokens": `file:./${tarballs["@frontstead/tokens"]}`,
      "@frontstead/ui": `file:./${tarballs["@frontstead/ui"]}`,
      react: "19.2.0",
      "react-dom": "19.2.0",
      tailwindcss: "^4",
      "tw-animate-css": "^1.4.0",
    },
    devDependencies: {
      "@types/react": "^19",
      typescript: "^5",
    },
  }, null, 2));

  await writeFile(join(directory, "index.mjs"), `
import assert from "node:assert/strict";
import { resolvePublicApiBaseUrl } from "@frontstead/api-client";
import { compileThemeCss } from "@frontstead/tokens/theme";
import { Button, Command, DateTimePicker, NativeSelect, Popover, SelectionCard } from "@frontstead/ui";
import { Calendar } from "@frontstead/ui/calendar";
import { Command as CommandSubpath } from "@frontstead/ui/command";
import { DateTimePicker as DateTimePickerSubpath } from "@frontstead/ui/date-time-picker";
import { SelectionCard as SelectionCardSubpath } from "@frontstead/ui/selection-card";
import { SortableTableHead } from "@frontstead/ui/table";
assert.equal(resolvePublicApiBaseUrl({ NEXT_PUBLIC_API_URL: "https://api.example.com/" }), "https://api.example.com");
assert.match(compileThemeCss({ palette: { primary: "#065f46" } }), /--primary:/);
assert.equal(typeof Button, "function");
assert.equal(typeof NativeSelect, "function");
assert.equal(typeof Popover, "function");
assert.equal(typeof Calendar, "function");
assert.equal(typeof Command, "function");
assert.equal(CommandSubpath, Command);
assert.equal(typeof DateTimePicker, "function");
assert.equal(DateTimePickerSubpath, DateTimePicker);
assert.equal(typeof SelectionCard, "function");
assert.equal(SelectionCardSubpath, SelectionCard);
assert.equal(typeof SortableTableHead, "function");
assert.match(import.meta.resolve("@frontstead/tokens/preset.css"), /preset\\.css$/);
`);

  await writeFile(join(directory, "consumer.tsx"), `
import { Button, Command, CommandDialog, DateTimePicker, NativeSelect, SelectionCard } from "@frontstead/ui";
import { Calendar } from "@frontstead/ui/calendar";
import { Command as CommandSubpath } from "@frontstead/ui/command";
import { DateTimePicker as DateTimePickerSubpath } from "@frontstead/ui/date-time-picker";
import { SelectionCard as SelectionCardSubpath } from "@frontstead/ui/selection-card";
import { SortableTableHead } from "@frontstead/ui/table";
export const form = <form><NativeSelect name="status"><option value="active">Active</option></NativeSelect><Button type="submit" loading={false}>Save</Button></form>;
export const heading = <SortableTableHead sortDirection="ascending" onSort={() => {}}>Price</SortableTableHead>;
export const calendar = <Calendar mode="single" weekStartsOn={1} />;
export const dateTimePicker = <DateTimePicker label="Appointment" value={new Date()} onChange={() => {}} timeZone="UTC" minuteStep={15} />;
export const dateTimePickerSubpath = <DateTimePickerSubpath label="Appointment" onChange={() => {}} />;
export const command = <Command label="Actions" />;
export const commandSubpath = <CommandSubpath label="Actions" />;
export const commandDialog = <CommandDialog title="Actions" description="Choose an action" commandLabel="Actions" open={false}><div /></CommandDialog>;
export const selectionCard = <SelectionCard type="checkbox" name="choice" value="one" label="Choice" />;
export const selectionCardSubpath = <SelectionCardSubpath type="radio" name="choice" value="two" label="Other choice" />;
`);
  await writeFile(join(directory, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      strict: true,
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      jsx: "react-jsx",
      skipLibCheck: true,
    },
    include: ["consumer.tsx"],
  }, null, 2));

  execFileSync("npm", ["install", "--ignore-scripts", "--package-lock=false"], { cwd: directory, stdio: "inherit" });
  execFileSync("npm", ["test"], { cwd: directory, stdio: "inherit" });
  console.log("Fresh tarball consumer passed runtime and declaration checks.");
} finally {
  await rm(directory, { recursive: true, force: true });
}
