import { act, renderHook } from "@testing-library/react-hooks";
import { SmartResource } from "../index";
import { useResourceSnapshot, useResourceStatus } from "../react";

const sampleResult = "sampledata";

const getSampleResource = () => new SmartResource(async () => sampleResult);

it("does not fetch until SmartResource.fetch() is called", async () => {
    const SampleResource = getSampleResource();
    const { result, waitForNextUpdate } = renderHook(() =>
        useResourceSnapshot(SampleResource)
    );

    expect(result.current[0]).toBe(null);

    act(() => {
        SampleResource.fetch();
    });

    await waitForNextUpdate();

    expect(result.current[0]).toBe(sampleResult);
});

it("updates the status result", async () => {
    const SampleResource = getSampleResource();

    const { result, waitForNextUpdate } = renderHook(() =>
        useResourceStatus(SampleResource)
    );

    expect(result.current).toBe("initial");

    act(() => {
        SampleResource.fetch();
    });

    expect(result.current).toBe("pending");

    await waitForNextUpdate();

    expect(result.current).toBe("success");
});

it("correctly sets error status", async () => {
    const ErrorResource = new SmartResource(() => Promise.reject());

    const { result, waitForNextUpdate } = renderHook(() =>
        useResourceStatus(ErrorResource)
    );

    expect(result.current).toBe("initial");

    act(() => {
        ErrorResource.fetch();
    });

    expect(result.current).toBe("pending");

    await waitForNextUpdate();

    expect(result.current).toBe("error");
});
