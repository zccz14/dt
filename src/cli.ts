#!/usr/bin/env node
import program from "commander";
import fs from "fs-extra";
import path from "path";
import { createTimeline } from ".";

const homedir =
  process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;

if (!homedir) {
  throw Error("HOME not found");
}
const dataFile = path.join(homedir, ".dt", "data.json");
fs.ensureFileSync(dataFile);

const data = fs.readFileSync(dataFile).toString();
const timeline = createTimeline();

function load() {
  timeline.importFromString(data);
}

function save() {
  fs.writeFileSync(dataFile, timeline.exportAsString());
}

program.version("0.0.0");

program.command("init").action(() => {
  console.log("initial", dataFile);
  save();
});

program.command("log").action(() => {
  load();
  timeline.log();
});

program.command("start").action(() => {
  load();
  timeline.start();
  save();
});

program.command("clear").action(() => {
  save();
});

program.command("link <id>").action((id: string) => {
  load();
  timeline.link(id);
  save();
});

program
  .command("total")
  .description("get total time")
  .action(() => {
    load();
    const ms = timeline.countTotalTime();

    const second = ~~(ms / 1000);
    const minute = ~~(second / 60);
    const hour = ~~(minute / 60);
    console.log(`${hour}:${minute % 60}:${second % 60} (+${ms % 1000})`);
  });

program.command("set <key> <value>").action((key, value) => {
  load();
  timeline.setPayload(key, value);
  save();
});

program.command("detail").action(() => {
  load();
  const ret = timeline.play();
  Object.entries(ret).forEach(([key, value]) => {
    console.log(`#${key}`.padEnd(8, " "), JSON.stringify(value));
  });
});

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}
