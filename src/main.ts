import { EOL } from "os";
import * as core from "@actions/core";
import * as system from "./os";
import * as versions from "./swift-versions";
import * as macos from "./macos-install";
import * as linux from "./linux-install";
import { getVersion } from "./get-version";

async function run() {
  try {
    const requestedVersion = core.getInput("swift-version", { required: true });

    let platform = await system.getSystem();
    let version = versions.verify(requestedVersion, platform);

    try {
      const current = await getVersion();
      if (current === version) {
        core.info(`${current} is already installed.`);
        core.setOutput("version", version);
        return;
      }
    } catch {}

    switch (platform.os) {
      case system.OS.MacOS:
        await macos.install(version, platform);
        break;
      case system.OS.Ubuntu:
        await linux.install(version, platform);
        break;
    }

    const current = await getVersion();
    if (current === version) {
      core.setOutput("version", version);
    } else {
      core.error(
        `Failed to setup requested swift version. requestd: ${version}, actual: ${current}`
      );
    }
  } catch (error) {
    let dump: String;
    if (error instanceof Error) {
      dump = `${error.message}${EOL}Stacktrace:${EOL}${error.stack}`;
    } else {
      dump = `${error}`;
    }

    core.setFailed(
      `Unexpected error, unable to continue. Please report at https://github.com/fwal/setup-swift/issues${EOL}${dump}`
    );
  }
}

run();
