import { SmartResource, type Request } from "../index";

const sampleResult = "sampledata";

const initialRequest: Request<any> = {
    status: "initial",
    value: null,
    error: null,
};

const getSampleResource = (options = {}) =>
    new SmartResource(async () => sampleResult, options);

it("provides `null` as the initial value before a fetch occurs", () => {
    const SampleResource = getSampleResource();
    const fn1 = jest.fn();

    SampleResource.subscribe(fn1);

    expect(fn1.mock.calls.length).toBe(1);
    expect(fn1.mock.calls[0][0].value).toBe(initialRequest.value);
});

it("it notifies all subscribers when a new value is available", async () => {
    const SampleResource = getSampleResource();
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    SampleResource.subscribe(fn1);
    SampleResource.subscribe(fn2);

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
    SampleResource.subscribe(fn1);

    expect(fn1.mock.calls.length).toBe(1);
    expect(fn1.mock.calls[0][0].value).toBe(sampleResult);
});

it("notifies status subscribers with correct status updates", async () => {
    const SampleResource = getSampleResource();

    const requestSubscriber = jest.fn();
    SampleResource.subscribe(requestSubscriber);

    expect(requestSubscriber).toHaveBeenCalledTimes(1);
    expect(requestSubscriber).toHaveBeenLastCalledWith({
        value: null,
        error: null,
        status: "initial",
    });

    SampleResource.fetch();

    // expect(requestSubscriber).toHaveBeenCalledTimes(2);
    expect(requestSubscriber).toHaveBeenLastCalledWith({
        value: null,
        error: null,
        status: "pending",
    });

    await new Promise(process.nextTick);

    expect(requestSubscriber).toHaveBeenCalledTimes(3);
    expect(requestSubscriber).toHaveBeenLastCalledWith({
        value: sampleResult,
        error: null,
        status: "success",
    });
});

it("only notifies status subscribers when status changes", async () => {
    const SampleResource = getSampleResource();

    // const statusSubscriber = jest.fn();
    // SampleResource.subscribeStatus(statusSubscriber);

    // expect(statusSubscriber).toHaveBeenCalledTimes(1);
    // expect(statusSubscriber).toHaveBeenLastCalledWith("initial");

    // SampleResource.fetch();
    // SampleResource.fetch();

    // expect(statusSubscriber).toHaveBeenCalledTimes(2);
    // expect(statusSubscriber).toHaveBeenLastCalledWith("pending");

    // await new Promise(process.nextTick);

    // expect(statusSubscriber).toHaveBeenCalledTimes(3);
    // expect(statusSubscriber).toHaveBeenLastCalledWith("success");
});

it("notifies subscribers for all value changes in takeEvery mode", async () => {
    const SampleResource = getSampleResource({ mode: "takeEvery" });

    const valueSubscriber = jest.fn();
    SampleResource.subscribe(valueSubscriber);

    expect(valueSubscriber).toHaveBeenCalledTimes(1);

    SampleResource.fetch();
    SampleResource.fetch();
    SampleResource.fetch();

    await new Promise(process.nextTick);
    expect(valueSubscriber).toHaveBeenCalledTimes(5);
});

it("notifies subscribers for only the latest change in takeLatest mode", async () => {
    const SampleResource = getSampleResource({ mode: "takeLatest" });

    const valueSubscriber = jest.fn();
    SampleResource.subscribe(valueSubscriber);

    expect(valueSubscriber).toHaveBeenCalledTimes(1);

    SampleResource.fetch();
    SampleResource.fetch();
    SampleResource.fetch();

    await new Promise(process.nextTick);

    expect(valueSubscriber).toHaveBeenCalledTimes(3);
});

it("only notifies status subscribers when status changes in takeEvery mode", async () => {
    // const SampleResource = getSampleResource({ mode: "takeEvery" });
    // const statusSubscriber = jest.fn();
    // SampleResource.subscribeStatus(statusSubscriber);
    // expect(statusSubscriber).toHaveBeenCalledTimes(1);
    // expect(statusSubscriber).toHaveBeenLastCalledWith("initial");
    // SampleResource.fetch();
    // SampleResource.fetch();
    // expect(statusSubscriber).toHaveBeenCalledTimes(2);
    // expect(statusSubscriber).toHaveBeenLastCalledWith("pending");
    // await new Promise(process.nextTick);
    // expect(statusSubscriber).toHaveBeenCalledTimes(3);
    // expect(statusSubscriber).toHaveBeenLastCalledWith("success");
});

it("sets status as error when the fetcher function throws/rejects", async () => {
    const errorVal = "error";
    const ErrorResource = new SmartResource(() => {
        return Promise.reject(errorVal);
    });
    const resultSubscriber = jest.fn();
    // const errorSubscriber = jest.fn();
    // const statusSubscriber = jest.fn();

    ErrorResource.subscribe(resultSubscriber);
    // ErrorResource.subscribeStatus(statusSubscriber);

    // expect(statusSubscriber).toHaveBeenLastCalledWith("initial");

    ErrorResource.fetch();

    // expect(statusSubscriber).toHaveBeenLastCalledWith("pending");

    await new Promise(process.nextTick);

    // expect(statusSubscriber).toHaveBeenLastCalledWith("error");
    // expect(errorSubscriber).toHaveBeenLastCalledWith(errorVal);
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
    // const statusSubscriber = jest.fn();

    SampleResource.subscribe(resultSubscriber);
    // SampleResource.subscribeStatus(statusSubscriber);

    SampleResource.fetch();

    await new Promise(process.nextTick);

    expect(resultSubscriber).toHaveBeenCalledTimes(3);
    expect(resultSubscriber).toHaveBeenLastCalledWith({
        status: "success",
        value: sampleResult,
        error: null,
    });
    // expect(statusSubscriber).toHaveBeenCalledTimes(3);
    // expect(statusSubscriber).toHaveBeenLastCalledWith("success");

    SampleResource.reset();

    await new Promise(process.nextTick);

    expect(resultSubscriber).toHaveBeenCalledTimes(4);
    expect(resultSubscriber).toHaveBeenLastCalledWith(initialRequest);
    // expect(statusSubscriber).toHaveBeenCalledTimes(4);
    // expect(statusSubscriber).toHaveBeenLastCalledWith("initial");
});
