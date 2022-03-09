import { useEffect, useState } from "react";
import { SmartResource } from "./index";

export const useResource = <T>(resource: SmartResource<T>) => {
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
