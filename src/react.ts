import { useEffect, useRef, useState } from "react";
import { SmartResource, type Resource } from "./index";

export const useResourceSnapshot = <T>(resource: SmartResource<T>) => {
    const [snapshot, setSnapshot] = useState<Resource<T>>(
        resource.getResource()
    );

    useEffect(() => {
        return resource.subscribe((resource) => {
            setSnapshot(resource);
        }).unsubscribe;
    }, [resource]);

    return snapshot;
};

export const useResourceInstance = <T>(
    createResource: () => SmartResource<T>
) => useRef(createResource()).current;
