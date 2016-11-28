/**
 * @copyright 2016-present, Prometheus Research, LLC
 */

const fs = require('fs');

class DummyWatchFileSystem {

  constructor(inputFileSystem) {
    this.inputFileSystem = inputFileSystem;
    this.callback = null;
    this.callbackUndelayed = null;
  }

  fileChanged(filename) {
		if (this.inputFileSystem && this.inputFileSystem.purge) {
			this.inputFileSystem.purge([filename]);
		}
    if (this.callbackUndelayed != null) {
      this.callbackUndelayed();
    }
    if (this.callback != null) {
      let files = [filename];
      let times = {[filename]: fs.statSync(filename).mtime.getTime() + 1000};
      this.callback(null,
        files, [], [], times, times);
    }
  }

  watch(_files, _dirs, _missing, _startTime, _options, callback, callbackUndelayed) {
    this.callback = callback;
    this.callbackUndelayed = callbackUndelayed;

    return {
      close() {
        // noop
      },
      pause() {
        // noop
      },
    };
  }
}

module.exports = DummyWatchFileSystem;
