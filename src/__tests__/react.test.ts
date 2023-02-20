import { act, renderHook } from "@testing-library/react-hooks";
import { SmartResource } from "../index";
import { useResourceSnapshot } from "../react";

const sampleResult = "sampledata";

const getSampleResource = () => new SmartResource(async () => sampleResult);

it("does not fetch until SmartResource.fetch() is called", async () => {
    const SampleResource = getSampleResource();
    const { result, waitForNextUpdate } = renderHook(() =>
        useResourceSnapshot(SampleResource)
    );

    expect(result.current.value).toBe(null);

    act(() => {
        SampleResource.fetch();
    });

    await waitForNextUpdate();

    expect(result.current.value).toBe(sampleResult);
});

it("updates the status result", async () => {
    const SampleResource = getSampleResource();

    const { result, waitForNextUpdate } = renderHook(() =>
        useResourceSnapshot(SampleResource)
    );

    expect(result.current.status).toBe("initial");

    act(() => {
        SampleResource.fetch();
    });

    expect(result.current.status).toBe("pending");

    await waitForNextUpdate();

    expect(result.current.status).toBe("success");
});

it("correctly sets error status", async () => {
    const ErrorResource = new SmartResource(() => Promise.reject());

    const { result, waitForNextUpdate } = renderHook(() =>
        useResourceSnapshot(ErrorResource)
    );

    expect(result.current.status).toBe("initial");

    act(() => {
        ErrorResource.fetch();
    });

    expect(result.current.status).toBe("pending");

    await waitForNextUpdate();

    expect(result.current.status).toBe("error");
});
