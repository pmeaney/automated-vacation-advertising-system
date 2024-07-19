/** Here we can define any JavaScript-based resources and extensions to tables

export class MyCustomResource extends tables.TableName {
	// we can define our own custom POST handler
	post(content) {
		// do something with the incoming content;
		return super.post(content);
	}
	// or custom GET handler
	get() {
		// we can modify this resource before returning
		return super.get();
	}
}
 */
// we can also define a custom resource without a specific table
// export class Greeting extends Resource {
// 	// a "Hello, world!" handler
// 	get() {
// 		return { greeting: 'Hello, world!' };
// 	}
// }

// https://docs.harperdb.io/docs/developers/applications
// https://docs.harperdb.io/docs/developers/real-time#server-sent-events
// export class Example extends Resource {
//   connect() {
//     // connect(incomingMessages) {
//     let connection = super.connect();

//     connection.on("event", () => {
//       console.log("connection sees event");
//     });

//     // incomingMessages.on('data', (message) => {
//     // 	// another way of echo-ing the data back to the client
//     // 	connection.send(message);
//     // });
//     // outgoingMessages.on("close", () => {
//     // // make sure we end the timer once the connection is closed
//     // clearInterval(timer);
//     // });

//     // return outgoingMessages;
//   }
// }

// import { EventEmitter } from "events";

// export class TestEmitter extends EventEmitter {
//   constructor(name) {
//     super();
//     this.name = name;
//     this.on("eventToLog", (eventData) => {
//       // On event, Post to an endpoint.
//       console.log("event name noticed: ", this.name);
//       console.log("eventData noticed: ", eventData);
//     });
//   }

//   // Method to emit events
//   emitEvent(eventName, data) {
//     console.log("running emitEvent");
//     this.emit(eventName, data);
//   }

//   // Method to allow other files to listen to events
//   listen(eventName, callback) {
//     console.log("running listen");
//     this.on(eventName, callback);
//   }
// }
