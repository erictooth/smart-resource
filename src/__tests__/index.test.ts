import { SmartResource } from "../index";
import { INITIAL_STATE, PENDING_STATE } from "../ResourceState";

const sampleResult = "sampledata";

const getSampleResource = (options = {}) =>
    new SmartResource(async () => sampleResult, options);

it("provides `null` as the initial value before a fetch occurs", () => {
    const SampleResource = getSampleResource();
    const fn1 = jest.fn();

    SampleResource.state.subscribe(fn1);

    expect(fn1.mock.calls.length).toBe(1);
    expect(fn1.mock.calls[0][0].value).toBe(INITIAL_STATE.value);
});

it("it notifies all subscribers when a new value is available", async () => {
    const SampleResource = getSampleResource();
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    SampleResource.state.subscribe(fn1);
    SampleResource.state.subscribe(fn2);

    SampleResource.fetch();

    await new Promise(process.nextTick);
    expect(fn1.mock.calls.length).toBe(3);
    expect(fn2.mock.calls.length).toBe(3);
    expect(fn1.mock.lastCall[0].value).toBe(sampleResult);
});

it("immediately provides a new subscriber with the current value if it's already set", async () => {
    const SampleResource = getSampleResource();

    SampleResource.fetch();

    await new Promise(process.nextTick);

    const fn1 = jest.fn();
    SampleResource.state.subscribe(fn1);

    expect(fn1.mock.calls.length).toBe(1);
    expect(fn1.mock.calls[0][0].value).toBe(sampleResult);
});

it("notifies status subscribers with correct status updates", async () => {
    const SampleResource = getSampleResource();

    const requestSubscriber = jest.fn();
    SampleResource.state.subscribe(requestSubscriber);

    expect(requestSubscriber).toHaveBeenCalledTimes(1);
    expect(requestSubscriber).toHaveBeenLastCalledWith(INITIAL_STATE);

    SampleResource.fetch();

    expect(requestSubscriber).toHaveBeenCalledTimes(2);
    expect(requestSubscriber).toHaveBeenLastCalledWith(PENDING_STATE);

    await new Promise(process.nextTick);

    expect(requestSubscriber).toHaveBeenCalledTimes(3);
    expect(requestSubscriber).toHaveBeenLastCalledWith({
        value: sampleResult,
        status: "fulfilled",
    });
});

it("notifies subscribers for all value changes in takeEvery mode", async () => {
    const SampleResource = getSampleResource({ mode: "takeEvery" });

    const valueSubscriber = jest.fn();
    SampleResource.state.subscribe(valueSubscriber);

    expect(valueSubscriber).toHaveBeenCalledTimes(1);

    SampleResource.fetch();
    SampleResource.fetch();
    SampleResource.fetch();

    await new Promise(process.nextTick);
    expect(valueSubscriber).toHaveBeenCalledTimes(7);
});

it("notifies subscribers for only the latest change in takeLatest mode", async () => {
    const SampleResource = getSampleResource({ mode: "takeLatest" });

    const valueSubscriber = jest.fn();
    SampleResource.state.subscribe(valueSubscriber);

    expect(valueSubscriber).toHaveBeenCalledTimes(1);

    SampleResource.fetch();
    SampleResource.fetch();
    SampleResource.fetch();

    await new Promise(process.nextTick);

    expect(valueSubscriber).toHaveBeenCalledTimes(5);
});

it("only notifies status subscribers when status changes in takeEvery mode", async () => {
    const SampleResource = getSampleResource({ mode: "takeEvery" });
    const resourceSubscriber = jest.fn();
    SampleResource.state.subscribe(resourceSubscriber);
    expect(resourceSubscriber).toHaveBeenCalledTimes(1);
    expect(resourceSubscriber).toHaveBeenLastCalledWith(INITIAL_STATE);
    SampleResource.fetch();
    SampleResource.fetch();
    expect(resourceSubscriber).toHaveBeenCalledTimes(3);
    expect(resourceSubscriber).toHaveBeenLastCalledWith(PENDING_STATE);
    await new Promise(process.nextTick);
    expect(resourceSubscriber).toHaveBeenCalledTimes(5);
    expect(resourceSubscriber).toHaveBeenLastCalledWith({
        value: sampleResult,
        status: "fulfilled",
    });
});

it("sets status as error when the fetcher function throws/rejects", async () => {
    const errorVal = "error";
    const ErrorResource = new SmartResource(() => {
        return Promise.reject(errorVal);
    });
    const resultSubscriber = jest.fn();

    ErrorResource.state.subscribe(resultSubscriber);

    expect(resultSubscriber).toHaveBeenLastCalledWith(INITIAL_STATE);

    ErrorResource.fetch();

    expect(resultSubscriber).toHaveBeenLastCalledWith(PENDING_STATE);

    await new Promise(process.nextTick);

    expect(resultSubscriber).toHaveBeenLastCalledWith({
        value: errorVal,
        status: "rejected",
    });
});

it("cancels promises correctly in takeLatest mode", async () => {
    const onCancel = jest.fn();
    const SampleResource = getSampleResource({ mode: "takeLatest", onCancel });

    SampleResource.fetch();

    expect(onCancel).toHaveBeenCalledTimes(0);

    await new Promise(process.nextTick);

    expect(onCancel).toHaveBeenCalledTimes(0);

    SampleResource.fetch();
    SampleResource.fetch();
    SampleResource.fetch();

    expect(onCancel).toHaveBeenCalledTimes(2);
});

it("resets state after calling .reset()", async () => {
    const SampleResource = getSampleResource({ mode: "takeLatest" });
    const resultSubscriber = jest.fn();

    SampleResource.state.subscribe(resultSubscriber);

    SampleResource.fetch();

    await new Promise(process.nextTick);

    expect(resultSubscriber).toHaveBeenCalledTimes(3);
    expect(resultSubscriber).toHaveBeenLastCalledWith({
        status: "fulfilled",
        value: sampleResult,
    });

    SampleResource.reset();

    await new Promise(process.nextTick);

    expect(resultSubscriber).toHaveBeenCalledTimes(4);
    expect(resultSubscriber).toHaveBeenLastCalledWith(INITIAL_STATE);
});
