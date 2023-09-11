import prepareNext from "electron-next";
import { autoUpdater } from "electron-updater";
import log from "electron-log";
import {
  app,
  ipcMain,
  dialog,
  MessageBoxOptions,
  protocol,
  net,
} from "electron";
import COMMAND from "./constants/commands";
import logit from "./utils/logit";
import openFolder from "./commands/open-folder";
import stop from "./commands/stop";
import selectFolder from "./commands/select-folder";
import selectFile from "./commands/select-file";
import getModelsList from "./commands/get-models-list";
import customModelsSelect from "./commands/custom-models-select";
import imageUpscayl from "./commands/image-upscayl";
import { createMainWindow } from "./main-window";
import electronIsDev from "electron-is-dev";
import { execPath, modelsPath } from "./utils/get-resource-paths";
import batchUpscayl from "./commands/batch-upscayl";
import doubleUpscayl from "./commands/double-upscayl";

// INITIALIZATION
log.initialize({ preload: true });
logit("🚃 App Path: ", app.getAppPath());

app.whenReady().then(async () => {
  await prepareNext("./renderer");
  createMainWindow();

  log.info("🚀 UPSCAYL EXEC PATH: ", execPath("realesrgan"));
  log.info("🚀 MODELS PATH: ", modelsPath);

  protocol.handle("file:", (request) => {
    const pathname = decodeURI(request.url);
    return net.fetch(pathname);
  });

  if (!electronIsDev) {
    autoUpdater.checkForUpdates();
  }
});

// Quit the app once all windows are closed
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on(COMMAND.STOP, stop);

ipcMain.on(COMMAND.OPEN_FOLDER, openFolder);

ipcMain.handle(COMMAND.SELECT_FOLDER, selectFolder);

ipcMain.handle(COMMAND.SELECT_FILE, selectFile);

ipcMain.on(COMMAND.GET_MODELS_LIST, getModelsList);

ipcMain.handle(COMMAND.SELECT_CUSTOM_MODEL_FOLDER, customModelsSelect);

ipcMain.on(COMMAND.UPSCAYL, imageUpscayl);

ipcMain.on(COMMAND.FOLDER_UPSCAYL, batchUpscayl);

ipcMain.on(COMMAND.DOUBLE_UPSCAYL, doubleUpscayl);

//------------------------Auto-Update Code-----------------------------//
autoUpdater.autoInstallOnAppQuit = false;

autoUpdater.on("update-downloaded", (event) => {
  autoUpdater.autoInstallOnAppQuit = false;
  const dialogOpts: MessageBoxOptions = {
    type: "info",
    buttons: ["Install update", "No Thanks"],
    title: "New Upscayl Update",
    message: event.releaseName as string,
    detail:
      "A new version has been downloaded. Restart the application to apply the updates.",
  };
  logit("✅ Update Downloaded");
  dialog.showMessageBox(dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      autoUpdater.quitAndInstall();
    } else {
      logit("🚫 Update Installation Cancelled");
    }
  });
});
