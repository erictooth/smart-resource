import { useEffect, useRef, useState } from "react";
import { SmartResource, RequestStatus } from "./index";

export const useResourceSnapshot = <T>(resource: SmartResource<T>) => {
    const [snapshot, setSnapshot] = useState<Awaited<T> | null>(resource.value);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        return resource.subscribe(
            (val) => {
                setError(null);
                setSnapshot(val);
            },
            (err: any) => {
                setSnapshot(null);
                setError(err);
            }
        ).unsubscribe;
    }, [resource]);

    return [snapshot, error] as const;
};

export const useResourceStatus = (resource: SmartResource<any>) => {
    const [status, setStatus] = useState<RequestStatus>(resource.status);

    useEffect(() => {
        return resource.subscribeStatus((nextStatus) => {
            setStatus(nextStatus);
        }).unsubscribe;
    }, [resource]);

    return status;
};

export const useResourceInstance = <T>(
    createResource: () => SmartResource<T>
) => useRef(createResource()).current;
