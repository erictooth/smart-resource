export type ResourceOptions<T> = {
	mode: "takeLatest" | "takeEvery";
	onCancel?: (promise: T) => void;
};

export const DEFAULT_OPTIONS = {
	mode: "takeLatest",
} satisfies Partial<ResourceOptions<any>>;
