export type ResourceState<T> =
	| {
			status: "initial";
			value: null;
	  }
	| {
			status: "pending";
			value: null;
	  }
	| {
			status: "fulfilled";
			value: Awaited<T>;
	  }
	| {
			status: "refreshing";
			value: Awaited<T>;
	  }
	| {
			status: "rejected";
			value: unknown;
	  };

export const INITIAL_STATE = {
	status: "initial",
	value: null,
} satisfies ResourceState<unknown>;

export const PENDING_STATE = {
	status: "pending",
	value: null,
} satisfies ResourceState<unknown>;
