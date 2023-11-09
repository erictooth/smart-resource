import {
	INITIAL_STATE,
	PENDING_STATE,
	type ResourceState,
} from "./ResourceState";
import { DEFAULT_OPTIONS, type ResourceOptions } from "./ResourceOptions";
import { BehaviorSubject } from "rxjs";

export class SmartResource<T extends (...args: any[]) => any> {
	#fetcher: T;
	#options: Partial<ResourceOptions<ReturnType<T>>>;
	#running: ReturnType<T>[] = [];
	state = new BehaviorSubject<ResourceState<ReturnType<T>>>(INITIAL_STATE);

	constructor(
		fetcher: T,
		options: Partial<ResourceOptions<ReturnType<T>>> = {},
	) {
		this.#fetcher = fetcher;
		this.#options = { ...DEFAULT_OPTIONS, ...options };
	}

	async fetch(...args: Parameters<T>) {
		if (this.#options.mode === "takeLatest") {
			this.#cancelPromises(this.#running.splice(0, this.#running.length));
		}

		const promise = this.#fetcher(...args) as ReturnType<T>;

		this.#running.push(promise);

		if (this.#running.length === 1) {
			this.state.next(PENDING_STATE);
		}

		try {
			const value = await promise;

			const promiseIdx = this.#running.indexOf(promise);

			if (promiseIdx !== -1) {
				this.#cancelPromises(this.#running.splice(0, promiseIdx));
				this.#running.shift();
				this.state.next({
					status: this.#running.length ? "refreshing" : "fulfilled",
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

	#cancelPromises(promises: ReturnType<T>[]): void {
		if (this.#options.onCancel) {
			for (const promise of promises) {
				this.#options.onCancel(promise);
			}
		}
	}
}

export type { ResourceOptions, ResourceState };
