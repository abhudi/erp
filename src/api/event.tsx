type EventListener<T> = (data: T) => void;

class EventEmitter<T> {
    private events: { [event: string]: EventListener<T>[] } = {};

    on(event: string, listener: EventListener<T>): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(listener);
    }

    emit(event: string, data: T): void {
        if (this.events[event]) {
            this.events[event].forEach(listener => listener(data));
        }
    }
}

const eventEmitter = new EventEmitter<any>();
export default eventEmitter;
