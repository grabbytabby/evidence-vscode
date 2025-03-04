import { commands, env, Uri } from 'vscode';
import { Commands } from './commands';
import { executeCommand } from './build';
import { closeTerminal, sendCommand } from '../terminal';
import { localAppUrl, preview } from './preview';
import { getNodeVersion, isSupportedNodeVersion } from '../node';
import { timeout } from '../utils/timer';
import { statusBar } from '../statusBar';

let _running: boolean = false;

/**
 * Starts Evidence app dev server, and opens Evidence app preview
 * in the built-in vscode simple browser.
 *
 * @param pageFileUri Optional Uri of the starting page to load in preview.
 */
export async function startServer(pageUri?: Uri) {
  // check supported node version prior to server start
  const nodeVersion = await getNodeVersion();
  if (isSupportedNodeVersion(nodeVersion, 16, 14)) {

    if (!_running) {
      let devServerHostParameter: string = '';
      const appUri: Uri = await env.asExternalUri(Uri.parse(localAppUrl));
      if (appUri.authority !== 'localhost:3000') {
        // use remote host parameter to start dev server on codespaces
        devServerHostParameter = '-- --host 0.0.0.0';
      }
      // start dev server via terminal command
      executeCommand(`npm exec evidence dev ${devServerHostParameter}`);
    }

    // update server status and show running status bar icon
    statusBar.showRunning();

    // wait for the dev server to start
    await timeout(1000);
    _running = true;

    // wait for the server to process pages
    await timeout(5000);

    // set focus back to the active vscode editor group
    commands.executeCommand(Commands.FocusActiveEditorGroup);

    // open app preview
    preview(pageUri);
    statusBar.showStop();
  }
}

/**
 * Gets running server status.
 *
 * @returns True if Evidence dev server is running, and false otherwise.
 */
export function isServerRunning() {
  return _running;
}

/**
 * Stops running app dev server,
 * and closes Evidence app terminal.
 */
export function stopServer() {
  if (_running) {
    sendCommand('q', '', false);
  }

  closeTerminal();
  _running = false;
  statusBar.showStart();
}
