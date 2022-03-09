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
    protected _errorVal: any = undefined;
    protected _fetcher: Fetcher<T>;
    private _initialArgs: any[];
    protected _queued: T[] = [];
    protected _options: ResourceOptions<T>;
    protected _subscribers = new Set<any>();
    protected _value: Awaited<T> | undefined = undefined;

    get status(): RequestStatus {
        if (this._value) {
            return "success";
        }

        if (this._errorVal) {
            return "error";
        }

        if (this._queued.length) {
            return "pending";
        }

        return "initial";
    }

    get value(): Awaited<T> | undefined {
        return this._value;
    }

    constructor(
        fetcher: Fetcher<T>,
        options: Partial<ResourceOptions<T> & { initialArgs: any[] }> = {}
    ) {
        this._fetcher = fetcher;
        this._options = Object.assign({ ...defaultOptions }, options);

        this._initialArgs = options.initialArgs || [];
    }

    protected _next(value: Awaited<T>) {
        this._errorVal = undefined;
        this._value = value;
        for (const subscriber of this._subscribers) {
            subscriber.onNext(this._value);
        }
    }

    protected _error(err: any) {
        this._value = undefined;
        this._errorVal = err;
        for (const subscriber of this._subscribers) {
            subscriber.onError?.(this._errorVal);
        }
    }

    subscribe(
        onNext: (val: Awaited<T>) => void,
        onError?: (err: any) => void,
        onComplete?: () => void
    ): Subscription {
        const subscription = {
            onNext,
            onError,
            onComplete,
        };

        this._subscribers.add(subscription);

        if (this._value !== undefined) {
            onNext(this._value);
        } else if (this.status === "initial") {
            this.fetch(...this._initialArgs);
        }

        return {
            closed() {
                return false;
            },
            unsubscribe: () => {
                this._subscribers.delete(subscription);
            },
        };
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
        if (this._options.mode === "takeLatest") {
            this._cancelPromises(this._queued);
            this._queued = [];
        }
        this._queued.push(promise);
        try {
            const result = await promise;
            const promiseIdx = this._queued.indexOf(promise);
            if (promiseIdx !== -1) {
                this._cancelPromises(this._queued.splice(0, promiseIdx + 1));
                this._next(result);
            }
        } catch (err) {
            this._error(err);
        }
    }
}
