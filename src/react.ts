import { useEffect, useRef, useState } from "react";
import { SmartResource, ResourceStatus } from "./index";

export const useResourceSnapshot = <T>(resource: SmartResource<T>) => {
    const [snapshot, setSnapshot] = useState<Awaited<T> | null>(resource.value);
    const [error, setError] = useState<any>(resource.error);

    useEffect(() => {
        return resource.subscribe((request) => {
            setError(request.error);
            setSnapshot(request.value);
        }).unsubscribe;
    }, [resource]);

    return [snapshot, error] as const;
};

export const useResourceStatus = (resource: SmartResource<any>) => {
    const [status, setStatus] = useState<ResourceStatus>(resource.status);

    useEffect(() => {
        return resource.subscribe((request) => {
            setStatus(request.status);
        }).unsubscribe;
    }, [resource]);

    return status;
};

export const useResourceInstance = <T>(
    createResource: () => SmartResource<T>
) => useRef(createResource()).current;
