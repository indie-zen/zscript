
export class EventSink {
  constructor() {
    this.$subscribers = [];
  }

  publish(value) {

  }

  subscribe(subscriber) {
    this.$subscribers.push(subscriber);
  }

}

