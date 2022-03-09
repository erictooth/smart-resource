import { useEffect, useState } from "preact/hooks";
import { SmartResource } from "./index";

export const useResourceSnapshot = <T>(resource: SmartResource<T>) => {
    const [snapshot, setSnapshot] = useState<Awaited<T> | undefined>(
        resource.value
    );
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        return resource.subscribe(
            (val) => {
                setError(null);
                setSnapshot(val);
            },
            (err: any) => {
                setSnapshot(undefined);
                setError(err);
            }
        ).unsubscribe;
    }, [resource]);

    return [snapshot, error] as const;
};
