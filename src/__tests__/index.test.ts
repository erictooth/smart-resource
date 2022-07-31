import { SmartResource } from "../index";

const sampleResult = "sampledata";

const getSampleResource = () => new SmartResource(async () => sampleResult);

it("provides `null` as the initial value before a fetch occurs", () => {
    const SampleResource = getSampleResource();
    const fn1 = jest.fn();

    SampleResource.subscribe(fn1);

    expect(fn1.mock.calls.length).toBe(1);
    expect(fn1.mock.calls[0][0]).toBe(null);
});

it("it notifies all subscribers when a new value is available", async () => {
    const SampleResource = getSampleResource();
    const fn1 = jest.fn();
    const fn2 = jest.fn();

    SampleResource.subscribe(fn1);
    SampleResource.subscribe(fn2);

    SampleResource.fetch();

    await new Promise(process.nextTick);

    expect(fn1.mock.calls.length).toBe(2);
    expect(fn2.mock.calls.length).toBe(2);
    expect(fn1.mock.calls[1][0]).toBe(sampleResult);
});

it("immediately provides a new subscriber with the current value if it's already set", async () => {
    const SampleResource = getSampleResource();

    SampleResource.fetch();

    await new Promise(process.nextTick);

    const fn1 = jest.fn();
    SampleResource.subscribe(fn1);

    expect(fn1.mock.calls.length).toBe(1);
    expect(fn1.mock.calls[0][0]).toBe(sampleResult);
});
