import { useEffect, useRef, useState } from "preact/hooks";
import { SmartResource } from "./index";
import { type ResourceState } from "./ResourceState";

export const useResourceSnapshot = <T>(resource: SmartResource<T>) => {
    const [snapshot, setSnapshot] = useState<ResourceState<T>>(
        resource.state.value
    );

    useEffect(() => {
        return resource.state.subscribe((resource) => {
            setSnapshot(resource);
        }).unsubscribe;
    }, [resource]);

    return snapshot;
};

export const useResourceInstance = <T>(
    createResource: () => SmartResource<T>
) => useRef(createResource()).current;
