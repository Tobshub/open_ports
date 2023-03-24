import { ipcRenderer } from "electron";
import { execSync } from "child_process";

ipcRenderer.on("main-process-message", (_event, ...args) => {
  console.log("[Receive Main-process message]:", ...args);
});

export const portScan = {
  scan: (args?: string) => execSync(`netstat -ptu${args ?? ""}`),
  kill: (pid: string) => execSync(`kill -9 ${pid}`),
};

