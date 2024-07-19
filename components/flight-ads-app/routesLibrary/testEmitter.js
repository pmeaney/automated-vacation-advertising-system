import { EventEmitter } from "events";

export class TestEmitter extends EventEmitter {
  constructor(name) {
    super();
    this.name = name;
    console.log("created: ", name);
  }

  // Method to emit events
  emitEvent(eventName, data) {
    console.log("emitEvent -- eventName", eventName, data);
    this.emit(eventName, data);
  }

  // Method to allow other files to listen to events
  listen(eventName, callback) {
    this.on(eventName, callback);
  }
}

// export const instanceOfEmitter = new TestEmitter("BLah");
