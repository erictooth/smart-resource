type Fetcher<T> = (...args: any) => T;

export type RequestStatus = "initial" | "pending" | "error" | "success";

export type ResourceOptions<T> = {
    mode: "takeLatest" | "takeEvery";
    onCancel?: (promise: T) => void;
};

const defaultOptions: ResourceOptions<any> = {
    mode: "takeLatest",
};

export type Subscription = { closed(): boolean; unsubscribe(): void };

/**
 * Reflects the result of one or more asynchronous requests.
 */
export class SmartResource<T> {
    protected _errorVal: any = null;
    protected _fetcher: Fetcher<T>;
    protected _queued: T[] = [];
    protected _options: ResourceOptions<T>;
    protected _subscribers = new Set<any>();
    protected _statusSubscribers = new Set<any>();
    protected _value: Awaited<T> | null = null;

    // this._errorVal can be set to `undefined`, so a flag is used to track
    // if there's currently an error
    protected _hasError = false;

    get status(): RequestStatus {
        if (this._queued.length) {
            return "pending";
        }

        if (this._hasError) {
            return "error";
        }

        if (this._value) {
            return "success";
        }

        return "initial";
    }

    get value(): Awaited<T> | null {
        return this._value;
    }

    get error(): any {
        return this._errorVal;
    }

    constructor(
        fetcher: Fetcher<T>,
        options: Partial<ResourceOptions<T>> = {}
    ) {
        this._fetcher = fetcher;
        this._options = Object.assign({ ...defaultOptions }, options);
    }

    private _internalNext(value: Awaited<T>) {
        this._errorVal = null;
        this._hasError = false;
        this._value = value;
        for (const subscriber of this._subscribers) {
            subscriber.onNext(this._value);
        }  
    }

    protected _next(value: Awaited<T>) {
        this._internalNext();
    }

    protected _notifyStatusSubscribers() {
        for (const subscriber of this._statusSubscribers) {
            subscriber(this.status);
        }
    }

    protected _error(err: any) {
        this._value = null;
        this._hasError = true;
        this._errorVal = err;
        for (const subscriber of this._subscribers) {
            subscriber.onError?.(this._errorVal);
        }
    }

    subscribe(
        onNext: (val: Awaited<T> | null) => void,
        onError?: (err: any) => void,
        onComplete?: () => void
    ): Subscription {
        const subscription = {
            onNext,
            onError,
            onComplete,
        };

        this._subscribers.add(subscription);

        onNext(this._value);

        return {
            closed() {
                return false;
            },
            unsubscribe: () => {
                this._subscribers.delete(subscription);
            },
        };
    }

    subscribeStatus(onNext: (status: RequestStatus) => void): Subscription {
        this._statusSubscribers.add(onNext);

        onNext(this.status);

        return {
            closed() {
                return false;
            },
            unsubscribe: () => {
                this._statusSubscribers.delete(onNext);
            },
        };
    }

    reset(): void {
        this._cancelPromises(this._queued);
        this._queued = [];
        this._internalNext(null as any);
        this._notifyStatusSubscribers();
    }

    protected _cancelPromises(promises: T[]) {
        if (!this._options.onCancel) {
            return;
        }

        promises.forEach((promise) => {
            this._options.onCancel!(promise);
        });
    }

    async fetch(...args: any[]) {
        const promise = this._fetcher(...args);

        const prevQueuedLength = this._queued.length;

        if (this._options.mode === "takeLatest") {
            this._cancelPromises(this._queued);
            this._queued = [];
        }

        this._queued.push(promise);

        if (this._queued.length === 1 && prevQueuedLength === 0) {
            this._notifyStatusSubscribers();
        }

        try {
            const result = await promise;
            const promiseIdx = this._queued.indexOf(promise);
            if (promiseIdx !== -1) {
                this._cancelPromises(this._queued.splice(0, promiseIdx));
                this._queued.shift();
                this._next(result);
            }

            if (!this._queued.length) {
                this._notifyStatusSubscribers();
            }
        } catch (err) {
            this._queued.splice(this._queued.indexOf(promise), 1);
            this._error(err);
            this._notifyStatusSubscribers();
        }
    }
}
