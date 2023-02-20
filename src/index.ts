type Fetcher<T> = (...args: any) => T;

export type ResourceStatus = "initial" | "pending" | "error" | "success";

export type ResourceOptions<T> = {
    mode: "takeLatest" | "takeEvery";
    onCancel?: (promise: T) => void;
};

const defaultOptions: ResourceOptions<any> = {
    mode: "takeLatest",
};

/**
 * Represents the current state of a Resource
 */
export type Resource<T> = {
    status: ResourceStatus;
    value: Awaited<T> | null;
    error: unknown | null;
};

export type Subscription = { closed(): boolean; unsubscribe(): void };

/**
 * Reflects the state of one or more asynchronous requests.
 */
export class SmartResource<T> {
    protected _value: Awaited<T> | null = null;
    protected _errorVal: any = null;
    protected _fetcher: Fetcher<T>;
    protected _queued: T[] = [];
    protected _options: ResourceOptions<T>;
    protected _subscribers = new Set<any>();

    // this._errorVal can be set to `undefined`, so a flag is used to track
    // if there's currently an error
    protected _hasError = false;

    private _getRequest(): Resource<T> {
        return {
            status: this.status,
            value: this.value,
            error: this.error,
        };
    }

    private _pushToSubscribers() {
        for (const subscriber of this._subscribers) {
            subscriber.onNext(this._getRequest());
        }
    }

    private _internalNext(value: Awaited<T>) {
        this._errorVal = null;
        this._hasError = false;
        this._value = value;
        this._pushToSubscribers();
    }

    protected _error(err: any) {
        this._value = null;
        this._hasError = true;
        this._errorVal = err;
        this._pushToSubscribers();
    }

    protected _next(value: Awaited<T>) {
        this._internalNext(value);
    }

    protected _cancelPromises(promises: T[]) {
        if (!this._options.onCancel) {
            return;
        }

        promises.forEach((promise) => {
            this._options.onCancel!(promise);
        });
    }

    get status(): ResourceStatus {
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

    subscribe(
        onNext: (request: Resource<T>) => void,
        onError?: (err: any) => void,
        onComplete?: () => void
    ): Subscription {
        const subscription = {
            onNext,
            onError,
            onComplete,
        };

        this._subscribers.add(subscription);

        onNext(this._getRequest());

        return {
            closed() {
                return false;
            },
            unsubscribe: () => {
                this._subscribers.delete(subscription);
            },
        };
    }

    reset(): void {
        this._cancelPromises(this._queued);
        this._queued = [];
        this._internalNext(null as any);
    }

    constructor(
        fetcher: Fetcher<T>,
        options: Partial<ResourceOptions<T>> = {}
    ) {
        this._fetcher = fetcher;
        this._options = Object.assign({ ...defaultOptions }, options);
    }

    async fetch(...args: any[]) {
        const promise = this._fetcher(...args);

        const prevQueuedLength = this._queued.length;

        if (this._options.mode === "takeLatest") {
            // Cancel any unfinished promises and remove them from the queue
            this._cancelPromises(this._queued);
            this._queued = [];
        }

        this._queued.push(promise);

        // Changed from non-pending status to pending
        if (prevQueuedLength === 0) {
            this._pushToSubscribers();
        }

        try {
            const result = await promise;
            const promiseIdx = this._queued.indexOf(promise);
            if (promiseIdx !== -1) {
                this._cancelPromises(this._queued.splice(0, promiseIdx));
                this._queued.shift();
                this._next(result);
            }
        } catch (err) {
            this._queued.splice(this._queued.indexOf(promise), 1);
            this._error(err);
        }
    }
}
