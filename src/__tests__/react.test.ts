import { renderHook } from "@testing-library/react-hooks";
import { SmartResource } from "../index";
import { useResourceSnapshot } from "../react";

const sampleResult = "sampledata";

const getSampleResource = () => new SmartResource(async () => sampleResult);

it("does not fetch until SmartResource.fetch() is called", async () => {
    const SampleResource = getSampleResource();
    const { result, waitForNextUpdate } = renderHook(() =>
        useResourceSnapshot(SampleResource)
    );

    expect(result.current[0]).toBe(null);

    SampleResource.fetch();

    await waitForNextUpdate();

    expect(result.current[0]).toBe(sampleResult);
});
