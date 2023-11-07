import {
	INITIAL_STATE,
	PENDING_STATE,
	type ResourceState,
} from "./ResourceState";
import { DEFAULT_OPTIONS, type ResourceOptions } from "./ResourceOptions";
import { BehaviorSubject } from "rxjs";

type Fetcher<T> = (...args: any) => T;

export class SmartResource<T> {
	#fetcher: Fetcher<T>;
	#options: Partial<ResourceOptions<T>>;
	#running: T[] = [];
	state = new BehaviorSubject<ResourceState<T>>(INITIAL_STATE);

	constructor(fetcher: Fetcher<T>, options: Partial<ResourceOptions<T>> = {}) {
		this.#fetcher = fetcher;
		this.#options = { ...DEFAULT_OPTIONS, ...options };
	}

	async fetch(...args: any[]) {
		if (this.#options.mode === "takeLatest") {
			this.#cancelPromises(this.#running.splice(0, this.#running.length));
		}

		const promise = this.#fetcher(...args);

		this.#running.push(promise);

		this.state.next(PENDING_STATE);

		try {
			const value = await promise;

			const promiseIdx = this.#running.indexOf(promise);

			if (promiseIdx !== -1) {
				this.#cancelPromises(this.#running.splice(0, promiseIdx));
				this.#running.shift();
				this.state.next({
					status: "fulfilled",
					value,
				});
			}
		} catch (e) {
			this.state.next({
				status: "rejected",
				value: e,
			});
		}
	}

	reset(): void {
		this.#cancelPromises(this.#running.splice(0, this.#running.length));
		this.state.next(INITIAL_STATE);
	}

	#cancelPromises(promises: T[]): void {
		if (this.#options.onCancel) {
			for (const promise of promises) {
				this.#options.onCancel(promise);
			}
		}
	}
}
